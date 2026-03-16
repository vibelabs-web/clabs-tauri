// @TASK P2-S1-T1 - xterm.js 기반 터미널 표시 컴포넌트

import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import 'xterm/css/xterm.css';
import { useThemeStore } from '@renderer/stores/theme';
import { registerTerminal, unregisterTerminal } from '@renderer/utils/terminal-registry';

export interface TerminalViewProps {
  paneId?: string; // 패인 ID (다중 패인 지원, 기본: 'pane-default')
  onData?: (data: string) => void;
  onReady?: () => void; // 터미널 준비 완료 콜백
  onSuggestion?: (suggestion: string) => void; // 프롬프트 제안 감지 콜백
  onPtyOutput?: (data: string) => void; // PTY 출력 캡처 콜백 (응답 버퍼링용)
}

// Ghost text 패턴 감지 (Claude Code 프롬프트 제안)
// - \x1b[2m ... \x1b[22m (dim text)
// - \x1b[90m ... \x1b[39m (gray text)
const extractGhostText = (data: string): string | null => {
  // Dim text 패턴: \x1b[2m{text}\x1b[22m
  const dimMatch = data.match(/\x1b\[2m([^\x1b]+)\x1b\[22m/);
  if (dimMatch && dimMatch[1].trim()) {
    return dimMatch[1].trim();
  }

  // Gray text 패턴: \x1b[90m{text}\x1b[39m
  const grayMatch = data.match(/\x1b\[90m([^\x1b]+)\x1b\[39m/);
  if (grayMatch && grayMatch[1].trim()) {
    return grayMatch[1].trim();
  }

  // Bright black 패턴: \x1b[38;5;240m{text}
  const brightBlackMatch = data.match(/\x1b\[38;5;24[0-5]m([^\x1b]+)/);
  if (brightBlackMatch && brightBlackMatch[1].trim()) {
    return brightBlackMatch[1].trim();
  }

  return null;
};

export function TerminalView({ paneId = 'pane-default', onData, onReady, onSuggestion, onPtyOutput }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const initializedRef = useRef(false);
  const disposedRef = useRef(false);
  const lastSuggestionRef = useRef<string>('');
  const onReadyCalledRef = useRef(false);
  const { currentTheme } = useThemeStore();
  const currentThemeRef = useRef(currentTheme);

  // 테마 ref 업데이트
  currentThemeRef.current = currentTheme;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || initializedRef.current) return;

    disposedRef.current = false;

    let retryCount = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    const initTerminal = () => {
      if (disposedRef.current) return;

      const rect = container.getBoundingClientRect();
      retryCount++;
      if (retryCount <= 5 || retryCount % 50 === 0) {
        console.log(`[TerminalView ${paneId}] initTerminal retry=${retryCount} rect=${Math.round(rect.width)}x${Math.round(rect.height)}`);
      }
      if (rect.width < 100 || rect.height < 100) {
        if (!disposedRef.current && retryCount < 300) {
          // display:none → block 전환 시 크기가 바로 반영 안 될 수 있으므로 rAF + 타이머 병행
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
          lineHeight: 1.2,
          cols: Math.floor(rect.width / 8),
          rows: Math.floor(rect.height / 17),
          allowProposedApi: true, // Unicode11 addon 사용을 위해 필요
          // 키보드 입력 활성화 (중요!)
          disableStdin: false,
          // Windows ConPTY 호환성 설정
          windowsPty: isWindows ? {
            backend: 'conpty',
            buildNumber: 18309 // Windows 10 1809+
          } : undefined,
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
        terminal.open(container);

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;
        initializedRef.current = true;

        // 레지스트리에 등록 (복사 기능용)
        registerTerminal(paneId, terminal);

        // fit 호출 및 PTY 리사이즈 (안전하게)
        const safeFit = () => {
          if (disposedRef.current || !terminalRef.current || !fitAddonRef.current) {
            return;
          }
          try {
            fitAddonRef.current.fit();
            // PTY에 터미널 크기 동기화 (paneId 포함)
            if (window.api?.pty && terminalRef.current) {
              window.api.pty.resize(terminalRef.current.cols, terminalRef.current.rows, paneId);
            }
          } catch (e) {
            // ignore - terminal might be disposed
          }
        };

        setTimeout(safeFit, 50);

        // Cmd+C: 선택 텍스트 복사, 선택 없으면 Ctrl+C 전송
        // Cmd+V: 클립보드에서 붙여넣기 → PTY로 전송
        terminal.attachCustomKeyEventHandler((event: KeyboardEvent) => {
          const isMeta = event.metaKey || event.ctrlKey;

          if (isMeta && event.key === 'c' && event.type === 'keydown') {
            const selection = terminal.getSelection();
            if (selection) {
              navigator.clipboard.writeText(selection).catch(() => {});
              return false; // xterm에 \x03 전송 안 함
            }
            // 선택 없으면 기본 동작 (Ctrl+C = \x03)
            return true;
          }

          if (isMeta && event.key === 'v' && event.type === 'keydown') {
            navigator.clipboard.readText().then((text) => {
              if (text && onData && !disposedRef.current) {
                onData(text);
              }
            }).catch(() => {});
            return false; // xterm 기본 처리 안 함
          }

          // Cmd+=/+/- → 웹뷰 줌 통과 (xterm이 먹지 않도록)
          if (isMeta && (event.key === '=' || event.key === '+' || event.key === '-' || event.key === '0')) {
            return false;
          }

          return true;
        });

        // 사용자 입력 핸들러
        if (onData) {
          terminal.onData((data) => {
            if (!disposedRef.current) {
              onData(data);
            }
          });
        }

        // PTY 데이터 수신 연결 (paneId 필터링)
        let unsubscribe: (() => void) | undefined;
        if (window.api?.pty) {
          unsubscribe = window.api.pty.onData((receivedPaneId: string, data: string) => {
            // paneId가 일치하는 데이터만 처리
            if (receivedPaneId !== paneId) return;

            if (!disposedRef.current && terminalRef.current) {
              try {
                terminalRef.current.write(data);

                // PTY 출력 캡처 (응답 버퍼링용)
                if (onPtyOutput) {
                  onPtyOutput(data);
                }

                // Ghost text (프롬프트 제안) 감지
                if (onSuggestion) {
                  const suggestion = extractGhostText(data);
                  if (suggestion && suggestion !== lastSuggestionRef.current) {
                    lastSuggestionRef.current = suggestion;
                    onSuggestion(suggestion);
                  } else if (!suggestion && data.includes('\r') || data.includes('\n')) {
                    // 줄바꿈 시 제안 초기화
                    if (lastSuggestionRef.current) {
                      lastSuggestionRef.current = '';
                      onSuggestion('');
                    }
                  }
                }
              } catch (e) {
                // ignore
              }
            }
          });
        }

        // 리사이즈 핸들러
        const handleResize = () => {
          if (!disposedRef.current) {
            setTimeout(safeFit, 50);
          }
        };
        window.addEventListener('resize', handleResize);

        // 터미널 포커스 (키보드 입력 활성화)
        terminal.focus();

        // 터미널 준비 완료 알림 (한 번만)
        if (onReady && !onReadyCalledRef.current) {
          onReadyCalledRef.current = true;
          console.log('Terminal ready, calling onReady');
          onReady();
        }

        // 클린업 함수 저장
        (container as any)._cleanup = () => {
          disposedRef.current = true;
          unregisterTerminal(paneId);
          window.removeEventListener('resize', handleResize);
          if (unsubscribe) unsubscribe();

          // 터미널 dispose 전 참조 정리
          const term = terminalRef.current;
          terminalRef.current = null;
          fitAddonRef.current = null;

          // 약간의 지연 후 dispose (pending tasks 완료 대기)
          setTimeout(() => {
            try {
              if (term) {
                term.dispose();
              }
            } catch (e) {
              // ignore
            }
          }, 100);
        };
      } catch (e) {
        console.error('Terminal init error:', e);
      }
    };

    // 초기화 시작
    setTimeout(initTerminal, 100);

    return () => {
      disposedRef.current = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if ((container as any)?._cleanup) {
        (container as any)._cleanup();
      }
      initializedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 테마 변경 시 터미널 테마 업데이트
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

  // 터미널 클릭 시 포커스
  const handleClick = () => {
    if (terminalRef.current) {
      terminalRef.current.focus();
    }
  };

  return (
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
  );
}
