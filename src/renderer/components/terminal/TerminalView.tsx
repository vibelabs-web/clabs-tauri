// xterm.js 기반 터미널 표시 컴포넌트

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { SearchAddon } from 'xterm-addon-search';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { ImageAddon } from 'xterm-addon-image';
import { LigaturesAddon } from 'xterm-addon-ligatures';
import 'xterm/css/xterm.css';
import { useThemeStore } from '@renderer/stores/theme';
import { registerTerminal, unregisterTerminal } from '@renderer/utils/terminal-registry';
import { TerminalSearchBar } from './TerminalSearchBar';

export interface TerminalViewProps {
  paneId?: string;
  onData?: (data: string) => void;
  onReady?: () => void;
  onSuggestion?: (suggestion: string) => void;
  onPtyOutput?: (data: string) => void;
}

const GHOST_DIM = /\x1b\[2m([^\x1b]+)\x1b\[22m/;
const GHOST_GRAY = /\x1b\[90m([^\x1b]+)\x1b\[39m/;
const GHOST_BRIGHT_BLACK = /\x1b\[38;5;24[0-5]m([^\x1b]+)/;

const extractGhostText = (data: string): string | null => {
  if (!data.includes('\x1b')) return null;
  const dimMatch = data.match(GHOST_DIM);
  if (dimMatch && dimMatch[1].trim()) return dimMatch[1].trim();
  const grayMatch = data.match(GHOST_GRAY);
  if (grayMatch && grayMatch[1].trim()) return grayMatch[1].trim();
  const brightBlackMatch = data.match(GHOST_BRIGHT_BLACK);
  if (brightBlackMatch && brightBlackMatch[1].trim()) return brightBlackMatch[1].trim();
  return null;
};

export function TerminalView({ paneId = 'pane-default', onData, onReady, onSuggestion, onPtyOutput }: TerminalViewProps) {
  const [searchVisible, setSearchVisible] = useState(false);
  const [pasteConfirm, setPasteConfirm] = useState<{ text: string; resolve: (ok: boolean) => void } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const initializedRef = useRef(false);
  const disposedRef = useRef(false);
  const lastSuggestionRef = useRef<string>('');
  const onReadyCalledRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const { currentTheme } = useThemeStore();
  const currentThemeRef = useRef(currentTheme);

  currentThemeRef.current = currentTheme;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || initializedRef.current) return;

    disposedRef.current = false;

    let retryCount = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let fitDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const initTerminal = () => {
      if (disposedRef.current) return;

      const rect = container.getBoundingClientRect();
      retryCount++;
      if (retryCount <= 5 || retryCount % 50 === 0) {
        console.log(`[TerminalView ${paneId}] initTerminal retry=${retryCount} rect=${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
      if (rect.width < 100 || rect.height < 100) {
        if (!disposedRef.current && retryCount < 300) {
          retryTimeout = setTimeout(initTerminal, 100);
        }
        return;
      }

      try {
        const theme = currentThemeRef.current;
        const isWindows = navigator.platform.toLowerCase().includes('win');

        const terminal = new Terminal({
          cursorBlink: true,
          convertEol: true,
          fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
          fontSize: 13,
          lineHeight: 1.4,
          cols: Math.floor(rect.width / 8),
          rows: Math.floor(rect.height / 20),
          allowProposedApi: true,
          disableStdin: false,
          scrollback: 5000,
          windowsPty: isWindows ? { backend: 'conpty', buildNumber: 18309 } : undefined,
          theme: {
            background: theme.terminal.background,
            foreground: theme.terminal.foreground,
            cursor: theme.terminal.cursor,
            cursorAccent: theme.terminal.cursorAccent,
            selectionBackground: theme.terminal.selectionBackground,
            black: theme.terminal.black,
            red: theme.terminal.red,
            green: theme.terminal.green,
            yellow: theme.terminal.yellow,
            blue: theme.terminal.blue,
            magenta: theme.terminal.magenta,
            cyan: theme.terminal.cyan,
            white: theme.terminal.white,
            brightBlack: theme.terminal.brightBlack,
            brightRed: theme.terminal.brightRed,
            brightGreen: theme.terminal.brightGreen,
            brightYellow: theme.terminal.brightYellow,
            brightBlue: theme.terminal.brightBlue,
            brightMagenta: theme.terminal.brightMagenta,
            brightCyan: theme.terminal.brightCyan,
            brightWhite: theme.terminal.brightWhite,
          },
        });

        const fitAddon = new FitAddon();
        const unicodeAddon = new Unicode11Addon();
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(unicodeAddon);
        terminal.unicode.activeVersion = '11';

        // SearchAddon 로드
        const searchAddon = new SearchAddon();
        terminal.loadAddon(searchAddon);
        searchAddonRef.current = searchAddon;

        // WebLinksAddon 로드 (URL 감지 + 클릭 가능한 링크)
        const webLinksAddon = new WebLinksAddon((_event, uri) => {
          window.open(uri, '_blank');
        });
        terminal.loadAddon(webLinksAddon);

        // ─── WKWebView 한글 IME 픽스 ───
        // 문제: xterm은 input 이벤트를 capture phase로 등록(Terminal.ts:382)하여
        //   _inputEvent()에서 한글 insertText를 triggerDataEvent로 보낸다.
        //   attachCustomKeyEventHandler(kc=229 차단)으로는 이 경로를 막을 수 없다.
        // 해결: terminal.open() 전에 container에 capture phase listener를 등록하여
        //   한글 input 이벤트에 stopImmediatePropagation → xterm이 절대 보지 못함.
        //   textarea.value를 직접 추적하여 조합 완료 시에만 PTY 전송.
        const ime = { active: false, flushedLen: 0, preInputLen: 0 };

        const isKoreanChar = (s: string) => !!s && [...s].some(c => {
          const cp = c.codePointAt(0)!;
          return (cp >= 0x3131 && cp <= 0x3163) || (cp >= 0xAC00 && cp <= 0xD7A3);
        });

        // ① keydown capture — open() 전에 등록
        container.addEventListener('keydown', (e: KeyboardEvent) => {
          const ta = container.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement | null;
          if (!ta) return;

          if (e.keyCode === 229) {
            // IME 키: 현재 textarea 길이를 기록 (input 전 baseline)
            if (!ime.active) {
              ime.preInputLen = ta.value.length;
            }
          } else if (ime.active && onData) {
            // 비-IME 키: 조합 완료 → textarea에서 미전송 한글을 PTY 전송
            const pending = ta.value.slice(ime.flushedLen);
            if (pending && isKoreanChar(pending)) {
              onData(pending);
            }
            ime.flushedLen = ta.value.length;
            ime.active = false;
            const cv = container.querySelector('.composition-view') as HTMLElement | null;
            if (cv) {
              cv.textContent = '';
              cv.classList.remove('active');
            }
          }
        }, true);

        // ② input capture — open() 전에 등록 → xterm보다 먼저 실행
        container.addEventListener('input', (e: Event) => {
          const ie = e as InputEvent;
          const data = ie.data || '';
          if (!isKoreanChar(data)) {
            // 비-한글 input → baseline 업데이트
            setTimeout(() => {
              const ta = container.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement | null;
              if (ta) ime.flushedLen = ta.value.length;
            }, 0);
            return; // xterm에 위임
          }

          // 한글 → xterm의 _inputEvent가 보지 못하게 완전 차단
          e.stopImmediatePropagation();

          if (!ime.active) {
            // 첫 한글 입력: keydown에서 기록한 preInputLen을 baseline으로
            ime.flushedLen = ime.preInputLen;
            ime.active = true;
          }

          // 미리보기: setTimeout으로 textarea.value 확정 후 읽기
          setTimeout(() => {
            const ta = container.querySelector('.xterm-helper-textarea') as HTMLTextAreaElement | null;
            const cv = container.querySelector('.composition-view') as HTMLElement | null;
            if (!ta || !cv) return;
            const pending = ta.value.slice(ime.flushedLen);
            if (pending && isKoreanChar(pending)) {
              cv.textContent = pending;
              cv.classList.add('active');
              // 터미널 폰트와 동일하게 설정
              cv.style.fontFamily = 'JetBrains Mono, Menlo, Monaco, monospace';
              cv.style.fontSize = '13px';
              cv.style.lineHeight = (13 * 1.4) + 'px';
              cv.style.height = (13 * 1.4) + 'px';
              cv.style.left = ta.style.left;
              cv.style.top = ta.style.top;
            }
          }, 0);
        }, true);

        terminal.open(container);

        // ImageAddon (Sixel/iTerm2 이미지 프로토콜 지원)
        try {
          const imageAddon = new ImageAddon();
          terminal.loadAddon(imageAddon);
          console.log(`[TerminalView ${paneId}] Image addon loaded`);
        } catch (e) {
          console.warn(`[TerminalView ${paneId}] Image addon not available`);
        }

        // LigaturesAddon (프로그래밍 합자 지원: =>, !==, -> 등)
        try {
          const ligaturesAddon = new LigaturesAddon();
          terminal.loadAddon(ligaturesAddon);
          console.log(`[TerminalView ${paneId}] Ligatures addon loaded`);
        } catch (e) {
          console.warn(`[TerminalView ${paneId}] Ligatures addon not available`);
        }

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;
        initializedRef.current = true;

        registerTerminal(paneId, terminal);

        // ─── fit 로직 (디바운스 + 스크롤 보존) ───
        let lastCols = 0;
        let lastRows = 0;

        const doFit = () => {
          if (disposedRef.current || !terminalRef.current || !fitAddonRef.current) return;

          // display:none 상태에서는 fit 하지 않음 (비활성 탭)
          const rect = container.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;

          try {
            const t = terminalRef.current;
            // fit() 전: 스크롤 오프셋을 행 단위로 저장
            // baseY = 완전 하단 시 viewport 시작 행, viewportY = 현재 viewport 시작 행
            const wasAtBottom = t.buffer.active.baseY <= t.buffer.active.viewportY + 1;
            const scrollOffset = wasAtBottom ? 0 : t.buffer.active.baseY - t.buffer.active.viewportY;

            fitAddonRef.current.fit();

            const { cols, rows } = t;
            // PTY에 0 크기 전송 방지 (split 직후 컨테이너가 작을 때 PTY 죽음 방지)
            if (cols > 0 && rows > 0 && (cols !== lastCols || rows !== lastRows)) {
              lastCols = cols;
              lastRows = rows;
              if (window.api?.pty) {
                window.api.pty.resize(cols, rows, paneId);
              }
            }

            // fit() 후: 스크롤 위치 복원
            if (wasAtBottom) {
              // 하단에 있었으면 하단 유지
              t.scrollToBottom();
            } else if (scrollOffset > 0) {
              // 위로 스크롤해서 보고 있었으면 — 하단에서의 오프셋 복원
              const newTarget = Math.max(0, t.buffer.active.baseY - scrollOffset);
              t.scrollToLine(newTarget);
            }
          } catch (e) { /* ignore */ }
        };

        // 디바운스: 연속 리사이즈 이벤트를 150ms 내 하나로 합침
        const debouncedFit = () => {
          if (fitDebounceTimer) clearTimeout(fitDebounceTimer);
          fitDebounceTimer = setTimeout(doFit, 150);
        };

        // 초기 fit (타이머 참조 보관 → 클린업 시 취소)
        let initialFitTimer: ReturnType<typeof setTimeout> | null = setTimeout(doFit, 50);

        // ─── ResizeObserver (컨테이너 크기 변경 감지) ───
        resizeObserver = new ResizeObserver((entries) => {
          if (disposedRef.current) return;
          const entry = entries[0];
          if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            debouncedFit();
          }
        });
        resizeObserver.observe(container);

        // IntersectionObserver: 탭 전환 시 display:none → block 감지하여 refit
        const visibilityObserver = new IntersectionObserver((entries) => {
          if (disposedRef.current) return;
          const entry = entries[0];
          if (entry && entry.isIntersecting && entry.intersectionRatio > 0) {
            // 터미널이 다시 보이면 refit + 캔버스 강제 리페인트 + 스크롤 복원
            setTimeout(() => {
              if (!disposedRef.current && fitAddonRef.current && terminalRef.current) {
                doFit();
                // display:none에서 복귀 시 xterm 캔버스가 빈 화면이 되는 버그 수정
                terminalRef.current.refresh(0, terminalRef.current.rows - 1);
                terminalRef.current.scrollToBottom();
              }
            }, 50);
            // 이중 안전장치: 첫 번째 refit이 타이밍 문제로 실패할 경우 대비
            setTimeout(() => {
              if (!disposedRef.current && fitAddonRef.current && terminalRef.current) {
                doFit();
                terminalRef.current.refresh(0, terminalRef.current.rows - 1);
              }
            }, 300);
          }
        }, { threshold: 0.01 });
        visibilityObserver.observe(container);

        // ─── 키보드 핸들러 ───
        terminal.attachCustomKeyEventHandler((event: KeyboardEvent) => {
          // 한글 IME 키(kc=229)를 xterm이 처리하지 못하도록 차단
          // → _handleAnyTextareaChanges 경로 차단, 한글은 위 input 리스너에서 처리
          if (event.keyCode === 229 && event.type === 'keydown') {
            return false;
          }

          const isMeta = event.metaKey || event.ctrlKey;

          // Cmd+F / Ctrl+F → 검색 바 토글
          if (isMeta && event.key === 'f' && event.type === 'keydown') {
            event.preventDefault();
            setSearchVisible(prev => !prev);
            return false;
          }

          if (isMeta && event.key === 'c' && event.type === 'keydown') {
            const selection = terminal.getSelection();
            if (selection) {
              navigator.clipboard.writeText(selection).catch(() => {});
              return false;
            }
            return true;
          }

          if (isMeta && event.key === 'v' && event.type === 'keydown') {
            navigator.clipboard.readText().then(async (text) => {
              if (!text || !onData || disposedRef.current) return;
              // 안전 검사: 여러 줄이거나 위험한 명령 패턴
              const isMultiLine = text.includes('\n') && text.trim().split('\n').length > 1;
              const dangerousPatterns = /\b(rm\s+-rf|sudo\s+rm|mkfs|dd\s+if=|:(){ :|>\s*\/dev\/|chmod\s+-R\s+777|curl.*\|\s*(ba)?sh)\b/i;
              const isDangerous = dangerousPatterns.test(text);

              if (isMultiLine || isDangerous) {
                const ok = await new Promise<boolean>((resolve) => {
                  setPasteConfirm({ text, resolve });
                });
                if (ok && !disposedRef.current) onData(text);
              } else {
                onData(text);
              }
            }).catch(() => {});
            return false;
          }

          // 줌 키는 웹뷰에 통과
          if (isMeta && (event.key === '=' || event.key === '+' || event.key === '-' || event.key === '0')) {
            // 줌 변경 후 fit 재계산 (doFit 직접 호출 — debouncedFit의 추가 150ms 지연 방지)
            setTimeout(doFit, 300);
            return false;
          }

          return true;
        });

        // ─── 사용자 입력 (비-한글) ───
        // xterm의 _inputEvent()가 insertText 한글을 triggerDataEvent로 보내므로
        // onData에서 한글을 필터링 — 한글은 위 커스텀 IME 핸들러에서만 처리
        if (onData) {
          const hasKorean = (s: string) => [...s].some(c => {
            const cp = c.codePointAt(0)!;
            return (cp >= 0x3131 && cp <= 0x3163) || (cp >= 0xAC00 && cp <= 0xD7A3);
          });
          terminal.onData((data) => {
            if (!disposedRef.current && !hasKorean(data)) onData(data);
          });
        }

        // ─── PTY 데이터 수신 ───
        let unsubscribe: (() => void) | undefined;
        if (window.api?.pty) {
          unsubscribe = window.api.pty.onData((receivedPaneId: string, data: string) => {
            if (receivedPaneId !== paneId) return;
            if (!disposedRef.current && terminalRef.current) {
              try {
                terminalRef.current.write(data);

                if (onPtyOutput) onPtyOutput(data);

                if (onSuggestion) {
                  const suggestion = extractGhostText(data);
                  if (suggestion && suggestion !== lastSuggestionRef.current) {
                    lastSuggestionRef.current = suggestion;
                    onSuggestion(suggestion);
                  } else if (!suggestion && (data.includes('\r') || data.includes('\n'))) {
                    if (lastSuggestionRef.current) {
                      lastSuggestionRef.current = '';
                      onSuggestion('');
                    }
                  }
                }
              } catch (e) { /* ignore */ }
            }
          });
        }

        terminal.focus();

        if (onReady && !onReadyCalledRef.current) {
          onReadyCalledRef.current = true;
          onReady();
        }

        // ─── 클린업 ───
        cleanupRef.current = () => {
          disposedRef.current = true;
          unregisterTerminal(paneId);
          if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
          visibilityObserver.disconnect();
          if (fitDebounceTimer) clearTimeout(fitDebounceTimer);
          if (initialFitTimer) { clearTimeout(initialFitTimer); initialFitTimer = null; }
          if (unsubscribe) unsubscribe();

          const term = terminalRef.current;
          terminalRef.current = null;
          fitAddonRef.current = null;
          searchAddonRef.current = null;

          setTimeout(() => {
            try { if (term) term.dispose(); } catch (e) { /* ignore */ }
          }, 100);
        };
      } catch (e) {
        console.error('Terminal init error:', e);
      }
    };

    setTimeout(initTerminal, 100);

    return () => {
      disposedRef.current = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      cleanupRef.current?.();
      cleanupRef.current = null;
      initializedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 테마 변경 시 업데이트
  useEffect(() => {
    if (terminalRef.current && currentTheme) {
      terminalRef.current.options.theme = {
        background: currentTheme.terminal.background,
        foreground: currentTheme.terminal.foreground,
        cursor: currentTheme.terminal.cursor,
        cursorAccent: currentTheme.terminal.cursorAccent,
        selectionBackground: currentTheme.terminal.selectionBackground,
        black: currentTheme.terminal.black,
        red: currentTheme.terminal.red,
        green: currentTheme.terminal.green,
        yellow: currentTheme.terminal.yellow,
        blue: currentTheme.terminal.blue,
        magenta: currentTheme.terminal.magenta,
        cyan: currentTheme.terminal.cyan,
        white: currentTheme.terminal.white,
        brightBlack: currentTheme.terminal.brightBlack,
        brightRed: currentTheme.terminal.brightRed,
        brightGreen: currentTheme.terminal.brightGreen,
        brightYellow: currentTheme.terminal.brightYellow,
        brightBlue: currentTheme.terminal.brightBlue,
        brightMagenta: currentTheme.terminal.brightMagenta,
        brightCyan: currentTheme.terminal.brightCyan,
        brightWhite: currentTheme.terminal.brightWhite,
      };
    }
  }, [currentTheme]);

  const handleClick = () => {
    if (terminalRef.current) terminalRef.current.focus();
  };

  const handleSearchNext = useCallback((query: string) => {
    if (searchAddonRef.current && query) {
      searchAddonRef.current.findNext(query);
    }
  }, []);

  const handleSearchPrev = useCallback((query: string) => {
    if (searchAddonRef.current && query) {
      searchAddonRef.current.findPrevious(query);
    }
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchVisible(false);
    searchAddonRef.current?.clearDecorations();
    if (terminalRef.current) terminalRef.current.focus();
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 붙여넣기 안전 경고 다이얼로그 */}
      {pasteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-border-default rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-border-default flex items-center gap-2">
              <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-semibold text-text-primary">붙여넣기 확인</span>
            </div>
            <div className="p-4">
              <p className="text-xs text-text-muted mb-2">
                {pasteConfirm.text.includes('\n') ? '여러 줄의 텍스트를' : '위험할 수 있는 명령을'} 붙여넣으려 합니다:
              </p>
              <pre className="bg-bg-primary border border-border-default rounded-lg p-3 text-xs text-text-secondary font-mono max-h-40 overflow-auto whitespace-pre-wrap break-all">
                {pasteConfirm.text.length > 500 ? pasteConfirm.text.slice(0, 500) + '...' : pasteConfirm.text}
              </pre>
              <p className="text-xs text-text-muted mt-2">
                {pasteConfirm.text.trim().split('\n').length}줄 · {pasteConfirm.text.length}자
              </p>
            </div>
            <div className="px-4 py-3 border-t border-border-default flex justify-end gap-2">
              <button
                onClick={() => { pasteConfirm.resolve(false); setPasteConfirm(null); }}
                className="px-4 py-1.5 text-sm text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-hover rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => { pasteConfirm.resolve(true); setPasteConfirm(null); }}
                className="px-4 py-1.5 text-sm text-bg-primary bg-accent hover:bg-accent/80 rounded-lg transition-colors"
              >
                붙여넣기
              </button>
            </div>
          </div>
        </div>
      )}
      <TerminalSearchBar
        visible={searchVisible}
        onClose={handleSearchClose}
        onSearchNext={handleSearchNext}
        onSearchPrev={handleSearchPrev}
      />
      <div
        ref={containerRef}
        data-testid="terminal-container"
        tabIndex={0}
        onClick={handleClick}
        onFocus={handleClick}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: currentTheme.terminal.background,
          overflow: 'hidden',
          cursor: 'text',
          outline: 'none',
        }}
      />
    </div>
  );
}
