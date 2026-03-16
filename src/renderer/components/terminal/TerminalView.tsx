// xterm.js 기반 터미널 표시 컴포넌트

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { SearchAddon } from 'xterm-addon-search';
import { WebglAddon } from 'xterm-addon-webgl';
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

        terminal.open(container);

        // WebGL 렌더러 (성능 향상, 실패 시 Canvas 폴백)
        try {
          const webglAddon = new WebglAddon();
          webglAddon.onContextLoss(() => {
            console.warn(`[TerminalView ${paneId}] WebGL context lost, falling back to canvas`);
            webglAddon.dispose();
          });
          terminal.loadAddon(webglAddon);
          console.log(`[TerminalView ${paneId}] WebGL renderer loaded`);
        } catch (e) {
          console.warn(`[TerminalView ${paneId}] WebGL not available, using canvas renderer`);
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
            if (cols !== lastCols || rows !== lastRows) {
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
          // contentRect가 0이면 display:none → 무시
          const entry = entries[0];
          if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            debouncedFit();
          }
        });
        resizeObserver.observe(container);

        // ─── 키보드 핸들러 ───
        terminal.attachCustomKeyEventHandler((event: KeyboardEvent) => {
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
            navigator.clipboard.readText().then((text) => {
              if (text && onData && !disposedRef.current) onData(text);
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

        // ─── 사용자 입력 ───
        if (onData) {
          terminal.onData((data) => {
            if (!disposedRef.current) onData(data);
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
