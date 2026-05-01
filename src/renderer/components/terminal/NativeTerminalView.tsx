// @TASK Phase 1 - NativeTerminalView
// NSView(libghostty) 오버레이를 위한 투명 placeholder React 컴포넌트.
// xterm.js 없이 크기/위치/가시성을 Tauri 백엔드에 IPC로 전달한다.

import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useThemeStore } from '@renderer/stores/theme';
import type { TerminalTheme } from '@shared/themes/types';
import { TerminalSearchBar } from './TerminalSearchBar';

// ────────────────────────────────────────────────────────────
// 타입 정의
// ────────────────────────────────────────────────────────────

export interface GhosttyConfig {
  /** 폰트 패밀리 (선택) */
  fontFamily?: string;
  /** 폰트 크기 px (선택) */
  fontSize?: number;
  /** 초기 테마 색상 */
  theme?: GhosttyThemeColors;
}

export interface GhosttyThemeColors {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface NativeTerminalViewProps {
  paneId?: string;
  onReady?: () => void;
}

// ────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────

function terminalThemeToGhostty(t: TerminalTheme): GhosttyThemeColors {
  return {
    background: t.background,
    foreground: t.foreground,
    cursor: t.cursor,
    cursorAccent: t.cursorAccent,
    selectionBackground: t.selectionBackground,
    black: t.black,
    red: t.red,
    green: t.green,
    yellow: t.yellow,
    blue: t.blue,
    magenta: t.magenta,
    cyan: t.cyan,
    white: t.white,
    brightBlack: t.brightBlack,
    brightRed: t.brightRed,
    brightGreen: t.brightGreen,
    brightYellow: t.brightYellow,
    brightBlue: t.brightBlue,
    brightMagenta: t.brightMagenta,
    brightCyan: t.brightCyan,
    brightWhite: t.brightWhite,
  };
}

// ────────────────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────────────────

export function NativeTerminalView({
  paneId = 'pane-default',
  onReady,
}: NativeTerminalViewProps) {
  const [searchVisible, setSearchVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const disposedRef = useRef(false);
  const createdRef = useRef(false);
  const onReadyCalledRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { currentTheme } = useThemeStore();
  const currentThemeRef = useRef(currentTheme);
  currentThemeRef.current = currentTheme;

  // ── 프레임 전송 (디바운스 150ms) ──────────────────────────
  // sendFrame은 getBoundingClientRect 가 0x0 이면 skip 하므로,
  // 마운트 직후처럼 layout 이 아직 안 끝난 시점엔 NSView 가 hidden 상태로
  // 머무는 문제가 있었다. 첫 호출이 실패하면 RAF 로 재시도해서
  // 첫 유효 frame 을 보장한다.
  const sendFrame = useCallback((): boolean => {
    if (disposedRef.current || !containerRef.current) return false;
    const el = containerRef.current;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    invoke('ghostty_set_frame', {
      paneId,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }).catch(() => {});
    return true;
  }, [paneId]);

  // 첫 frame 보장 — 0x0 이면 RAF/타이머로 재시도, 최대 ~2초
  const ensureFirstFrame = useCallback(() => {
    let attempts = 0;
    const tick = () => {
      if (disposedRef.current) return;
      if (sendFrame()) return; // 성공
      attempts++;
      if (attempts < 40) {
        // RAF 로 다음 frame 대기 (보통 layout 끝나면 즉시 잡힘)
        requestAnimationFrame(tick);
      }
    };
    tick();
  }, [sendFrame]);

  const debouncedSendFrame = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(sendFrame, 150);
  }, [sendFrame]);

  // ── 마운트 / 언마운트 ────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container || createdRef.current) return;

    disposedRef.current = false;

    console.log(`[NativeTerminalView ${paneId}] useEffect mounted`);
    invoke('log_from_js', { message: `NativeTerminalView mounted: ${paneId}` }).catch(() => {});

    // 1. 즉시 onReady 호출 — 앱 flow를 차단하지 않음 (프로젝트 선택 등)
    if (onReady && !onReadyCalledRef.current) {
      onReadyCalledRef.current = true;
      console.log(`[NativeTerminalView ${paneId}] calling onReady`);
      onReady();
    }

    // 2. ghostty_create — config를 flat string으로 전달 (nested object 회피)
    const config: Record<string, string> = {
      fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
      fontSize: '13',
    };

    console.log(`[NativeTerminalView ${paneId}] calling ghostty_create...`);
    invoke('ghostty_create', { paneId, config })
      .then(() => {
        if (disposedRef.current) return;
        createdRef.current = true;
        console.log(`[NativeTerminalView ${paneId}] ghostty_create succeeded`);
        // 첫 frame 은 retry 로 보장 — 0x0 이면 layout 끝날 때까지 RAF
        ensureFirstFrame();
        invoke('ghostty_focus', { paneId }).catch(() => {});
      })
      .catch((err) => {
        console.error(`[NativeTerminalView ${paneId}] ghostty_create failed:`, err);
        // 에러를 Rust 로그로도 전송
        invoke('log_from_js', { message: `ghostty_create failed: ${err}` }).catch(() => {});
      });

    // 3. ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (disposedRef.current) return;
      const entry = entries[0];
      if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        debouncedSendFrame();
      }
    });
    resizeObserver.observe(container);

    // 3. IntersectionObserver (탭 전환 가시성)
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (disposedRef.current) return;
        const entry = entries[0];
        if (!entry) return;
        const visible = entry.isIntersecting && entry.intersectionRatio > 0;
        invoke('ghostty_set_visible', { paneId, visible }).catch(() => {});
        if (visible) {
          // 다시 보일 때 프레임 재전송 (레이아웃이 달라질 수 있음)
          setTimeout(sendFrame, 50);
        }
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(container);

    // 4. 키보드 핸들러 (Cmd+F)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === 'f' && e.type === 'keydown') {
        e.preventDefault();
        setSearchVisible((prev) => !prev);
      }
    };
    container.addEventListener('keydown', handleKeyDown, true);

    return () => {
      disposedRef.current = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      container.removeEventListener('keydown', handleKeyDown, true);

      // ghostty_destroy
      invoke('ghostty_destroy', { paneId }).catch(() => {});
      createdRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 테마 변경 ───────────────────────────────────────────
  useEffect(() => {
    if (!createdRef.current || disposedRef.current) return;
    const themeColors = terminalThemeToGhostty(currentTheme.terminal);
    invoke('ghostty_apply_theme', { paneId, theme: themeColors }).catch(() => {});
  }, [currentTheme, paneId]);

  // ── 클릭 포커스 ─────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (!disposedRef.current) {
      invoke('ghostty_focus', { paneId }).catch(() => {});
    }
  }, [paneId]);

  // ── 검색 핸들러 ─────────────────────────────────────────
  const handleSearchNext = useCallback(
    (query: string) => {
      if (!query) return;
      invoke('ghostty_search', { paneId, query, direction: 'next' }).catch(() => {});
    },
    [paneId],
  );

  const handleSearchPrev = useCallback(
    (query: string) => {
      if (!query) return;
      invoke('ghostty_search', { paneId, query, direction: 'prev' }).catch(() => {});
    },
    [paneId],
  );

  const handleSearchClose = useCallback(() => {
    setSearchVisible(false);
    invoke('ghostty_search_clear', { paneId }).catch(() => {});
    // NSView로 포커스 반환
    invoke('ghostty_focus', { paneId }).catch(() => {});
  }, [paneId]);

  // ── 렌더 ────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <TerminalSearchBar
        visible={searchVisible}
        onClose={handleSearchClose}
        onSearchNext={handleSearchNext}
        onSearchPrev={handleSearchPrev}
      />
      {/*
        placeholder div: NSView가 이 위치에 오버레이됨.
        background는 반드시 transparent 유지해야 NSView가 보인다.
      */}
      <div
        ref={containerRef}
        data-testid="native-terminal-container"
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
    </div>
  );
}
