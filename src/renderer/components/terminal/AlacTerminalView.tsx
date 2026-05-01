// Phase 6 — alacritty_terminal 기반 네이티브 NSView 오버레이용 React 컴포넌트.
// NativeTerminalView(ghostty)와 동일한 placeholder 패턴 — 크기/위치만 IPC로 전달.
// 자체 PTY를 보유하므로 window.api.pty.* 호출 불필요.

import { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProjectStore } from '@renderer/stores/project';
import { useModalStore } from '@renderer/stores/modal';

export interface AlacTerminalViewProps {
  paneId?: string;
  cwd?: string;
  onReady?: () => void;
}

export function AlacTerminalView({
  paneId = 'pane-default',
  cwd,
  onReady,
}: AlacTerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const disposedRef = useRef(false);
  const createdRef = useRef(false);
  const onReadyCalledRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 프로젝트 선택 + 기타 모달들이 떠있는 동안에는 NSView를 숨겨야 한다.
  // NSView는 NSWindow contentView에 직접 add되어 항상 WebView 모달 위에 떠 있기 때문.
  const showProjectSelector = useProjectStore((s) => s.showProjectSelector);
  const modalOpenCount = useModalStore((s) => s.openCount);
  const anyModalOpen = showProjectSelector || modalOpenCount > 0;
  useEffect(() => {
    // Rust 측 글로벌 modal flag 동기화 — 모든 alac view가 일괄 hidden 처리됨.
    invoke('alac_set_modal_open', { open: anyModalOpen }).catch(() => {});
    if (!createdRef.current) return;
    if (anyModalOpen) {
      invoke('alac_set_visible', { paneId, visible: false }).catch(() => {});
    } else {
      // 모달이 닫혔으면: 1) frame 재전송 (그동안 ResizeObserver가 안 돌았을 수 있음),
      //              2) visible로 명시 전환.
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          invoke('alac_set_frame', {
            paneId,
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }).catch(() => {});
        }
      }
      invoke('alac_set_visible', { paneId, visible: true }).catch(() => {});
    }
  }, [anyModalOpen, paneId]);

  const sendFrame = useCallback((): boolean => {
    if (disposedRef.current || !containerRef.current) return false;
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    invoke('alac_set_frame', {
      paneId,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }).catch(() => {});
    return true;
  }, [paneId]);

  const ensureFirstFrame = useCallback(() => {
    let attempts = 0;
    const tick = () => {
      if (disposedRef.current) return;
      if (sendFrame()) return;
      attempts++;
      if (attempts < 60) requestAnimationFrame(tick);
    };
    tick();
  }, [sendFrame]);

  const debouncedSendFrame = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(sendFrame, 100);
  }, [sendFrame]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || createdRef.current) return;
    disposedRef.current = false;

    if (onReady && !onReadyCalledRef.current) {
      onReadyCalledRef.current = true;
      onReady();
    }

    invoke('alac_create', { paneId, cwd })
      .then(() => {
        if (disposedRef.current) return;
        createdRef.current = true;
        // NSView는 setHidden:YES로 시작 — 명시적으로 visible로 만들어줘야 한다.
        const projectModalOpen = useProjectStore.getState().showProjectSelector;
        const modalOpen = useModalStore.getState().openCount > 0;
        if (!projectModalOpen && !modalOpen) {
          ensureFirstFrame();
          invoke('alac_set_visible', { paneId, visible: true }).catch(() => {});
          invoke('alac_focus', { paneId }).catch(() => {});
        }
        // 모달 떠 있으면 그대로 hidden 유지 — useEffect가 닫히는 시점에 visible 처리.
      })
      .catch((err) => {
        console.error(`[AlacTerminalView ${paneId}] alac_create failed:`, err);
      });

    const ro = new ResizeObserver((entries) => {
      if (disposedRef.current) return;
      const e = entries[0];
      if (e && e.contentRect.width > 0 && e.contentRect.height > 0) {
        debouncedSendFrame();
      }
    });
    ro.observe(container);

    const io = new IntersectionObserver(
      (entries) => {
        if (disposedRef.current) return;
        const e = entries[0];
        if (!e) return;
        const visible = e.isIntersecting && e.intersectionRatio > 0;
        invoke('alac_set_visible', { paneId, visible }).catch(() => {});
        if (visible) setTimeout(sendFrame, 50);
      },
      { threshold: 0.01 },
    );
    io.observe(container);

    // 보완 polling — 부모의 display:none 변화 등 IntersectionObserver가 놓치는 케이스 대비.
    // 비활성 탭의 NSView가 활성 탭 위로 떠있는 문제를 잡는다.
    let lastVisible: boolean | null = null;
    const visIv = window.setInterval(() => {
      if (!containerRef.current || disposedRef.current) return;
      const el = containerRef.current;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0;
      if (lastVisible !== visible) {
        lastVisible = visible;
        invoke('alac_set_visible', { paneId, visible }).catch(() => {});
        if (visible) sendFrame();
      }
    }, 150);

    return () => {
      // 주의: alac_destroy를 여기서 부르지 않는다.
      // React가 split/리렌더 등으로 PaneView를 unmount하더라도 PTY/Term은 보존되어야 함.
      // 진짜 페인이 닫힐 때 PaneStore.closePane에서 명시적으로 alac_destroy를 호출.
      // (NSView는 같은 paneId로 다시 mount되면 create_view 안의 stale 청소 로직이 처리.)
      disposedRef.current = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      ro.disconnect();
      io.disconnect();
      window.clearInterval(visIv);
      // 잠시 안 보이도록 hide만 — 다시 mount되면 set_frame이 visible로 돌림.
      invoke('alac_set_visible', { paneId, visible: false }).catch(() => {});
      createdRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClick = useCallback(() => {
    if (!disposedRef.current) {
      invoke('alac_focus', { paneId }).catch(() => {});
    }
  }, [paneId]);

  return (
    <div
      ref={containerRef}
      data-testid="alac-terminal-container"
      tabIndex={0}
      onClick={handleClick}
      onFocus={handleClick}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        overflow: 'hidden',
        cursor: 'text',
        outline: 'none',
      }}
    />
  );
}
