// @TASK P2-S7-T1 - MainPage 통합
// PTY와 xterm.js를 연결하는 메인 페이지 (다중 패인 지원)

import { useState, useCallback, useRef, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import ProjectSelector from '../components/project/ProjectSelector';
import SettingsModal from '../components/settings/SettingsModal';
import CommandBuilder from '../components/terminal/CommandBuilder';
import { useProjectStore } from '../stores/project';
import { usePaneStore } from '../stores/pane';
import type { UsageData } from '../types/usage';
import { stripAnsi } from '../utils/ansi';
import type { SplitDirection } from '@shared/pane-types';

export default function MainPage() {
  // 설정 모달 상태
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandBuilder, setShowCommandBuilder] = useState(false);

  // 프로젝트 store
  const { currentProject, showProjectSelector, openProjectSelector } = useProjectStore();

  // 패인 store
  const {
    root: paneTree,
    activePaneId,
    splitPane,
    closePane,
    renamePane,
    resizeSplit,
    setActivePaneId,
    reset: resetPanes,
  } = usePaneStore();

  // 모든 useState를 상단에 선언
  const [usage, setUsage] = useState<UsageData>({
    tokensUsed: 0,
    contextLimit: 1000000,
    dailyTokensUsed: 0,
    taskDuration: 0,
  });
  const [isPtyRunning, _setIsPtyRunning] = useState(false);
  const isPtyRunningRef = useRef(false);
  const setIsPtyRunning = (val: boolean) => {
    isPtyRunningRef.current = val;
    _setIsPtyRunning(val);
  };
  const [isClaudeRunning, setIsClaudeRunning] = useState(false);
  const [inputValue, setInputValue] = useState('claude --dangerously-skip-permissions');
  const [suggestion, setSuggestion] = useState('');

  // 모든 useRef를 상단에 선언
  const sessionStartRef = useRef<number>(Date.now());
  const spawnedPanesRef = useRef<Set<string>>(new Set()); // 이미 PTY 시작된 패인 추적
  const lastProjectPathRef = useRef<string | null>(null);
  const writeAbortRef = useRef(false); // ESC 시 진행 중인 문자 전송 중단용
  const writeCooldownRef = useRef(false); // ESC 후 쿨다운 (Claude Code 인터럽트 처리 대기)
  const responseBufferRef = useRef<string[]>([]); // PTY 응답 버퍼링
  const [lastResponse, setLastResponse] = useState('');

  // Usage 업데이트 구독
  useEffect(() => {
    if (window.api?.usage?.onUpdate) {
      const unsubscribe = window.api.usage.onUpdate((data) => {
        console.log('Usage update received:', data);
        setUsage(prev => ({
          ...prev,
          ...data,
          taskDuration: prev.taskDuration
        }));
      });
      return unsubscribe;
    }
  }, []);

  // PTY 종료 이벤트 구독 (paneId 포함)
  useEffect(() => {
    if (window.api?.pty?.onExit) {
      const unsubscribe = window.api.pty.onExit((paneId, code) => {
        console.log(`[MainPage] PTY ${paneId} exited with code:`, code);
        spawnedPanesRef.current.delete(paneId);

        // 모든 PTY가 종료되면 상태 리셋
        if (spawnedPanesRef.current.size === 0) {
          setIsPtyRunning(false);
          setIsClaudeRunning(false);
        }
      });
      return unsubscribe;
    }
  }, []);

  // PTY 시작 후 usage 데이터 주기적 요청 (API 포함)
  useEffect(() => {
    if (isPtyRunning && window.api?.usage?.get) {
      const fetchUsage = () => {
        window.api.usage.get().then((data) => {
          console.log('Usage data:', data);
          if (data) {
            setUsage(prev => ({
              ...prev,
              ...data,
              taskDuration: prev.taskDuration
            }));
          }
        }).catch(err => console.error('Usage fetch error:', err));
      };

      fetchUsage();
      const interval = setInterval(fetchUsage, 30000);
      return () => clearInterval(interval);
    }
  }, [isPtyRunning]);

  // 태스크 시간 타이머 (1초마다 업데이트)
  useEffect(() => {
    const timer = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      setUsage(prev => ({
        ...prev,
        taskDuration: duration
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 전역 ESC 키 핸들러 (활성 패인의 PTY에 Ctrl+C 전송)
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPtyRunning && !showSettings && !showProjectSelector) {
        e.preventDefault();
        e.stopPropagation();

        writeAbortRef.current = true;
        window.api?.pty?.write('\x03', activePaneId);
        console.log(`[MainPage] Global ESC - sent Ctrl+C to pane ${activePaneId}`);

        writeCooldownRef.current = true;
        setTimeout(() => {
          writeCooldownRef.current = false;
        }, 1000);
      }
    };

    document.addEventListener('keydown', handleGlobalEscape, true);
    return () => document.removeEventListener('keydown', handleGlobalEscape, true);
  }, [isPtyRunning, showSettings, showProjectSelector, activePaneId]);

  // 프로젝트 변경 시 모든 PTY 종료 + 패인 트리 리셋
  useEffect(() => {
    if (!currentProject) return;
    if (currentProject.path === lastProjectPathRef.current) return;

    console.log('Project changed to:', currentProject.path);

    // 모든 기존 PTY 종료
    if (isPtyRunning && window.api?.pty?.killAll) {
      console.log('Killing all PTY processes...');
      window.api.pty.killAll();
      setIsPtyRunning(false);
    }

    // 패인 트리 리셋
    resetPanes();
    spawnedPanesRef.current.clear();
    lastProjectPathRef.current = currentProject.path;
    sessionStartRef.current = Date.now();
    setIsClaudeRunning(false);
    setInputValue('claude --dangerously-skip-permissions');
  }, [currentProject, isPtyRunning, resetPanes]);

  // 패인 터미널 준비 완료 시 해당 패인의 PTY 시작
  const handlePaneReady = useCallback(async (paneId: string) => {
    if (!currentProject) {
      console.log('No project selected, waiting...');
      return;
    }

    if (spawnedPanesRef.current.has(paneId)) return;
    spawnedPanesRef.current.add(paneId);

    console.log(`Pane ${paneId} ready, starting PTY in:`, currentProject.path);

    try {
      if (window.api?.pty) {
        await window.api.pty.spawn('claude', currentProject.path, paneId);
        setIsPtyRunning(true);
        console.log(`PTY spawned for pane ${paneId} in:`, currentProject.path);
      }
    } catch (error) {
      console.error(`Failed to spawn PTY for pane ${paneId}:`, error);
      spawnedPanesRef.current.delete(paneId);
    }
  }, [currentProject]);

  // 터미널 데이터 핸들러 (xterm → 활성 패인 PTY)
  const handleData = useCallback((data: string) => {
    if (window.api?.pty && isPtyRunningRef.current) {
      window.api.pty.write(data, activePaneId);
    }
  }, [activePaneId]);

  // 패인 분할 핸들러
  const handleSplit = useCallback((paneId: string, direction: SplitDirection) => {
    const newPaneId = splitPane(paneId, direction);
    console.log(`Split pane ${paneId} ${direction} → new pane ${newPaneId}`);
  }, [splitPane]);

  // 패인 닫기 핸들러
  const handleClosePane = useCallback((paneId: string) => {
    // PTY 종료
    if (window.api?.pty) {
      window.api.pty.kill(paneId);
    }
    spawnedPanesRef.current.delete(paneId);
    closePane(paneId);
    console.log(`Closed pane ${paneId}`);
  }, [closePane]);

  // 패인 클릭 핸들러
  const handlePaneClick = useCallback((paneId: string) => {
    setActivePaneId(paneId);
  }, [setActivePaneId]);

  // 패인 이름 변경 핸들러
  const handleRenamePane = useCallback((paneId: string, name: string) => {
    renamePane(paneId, name);
  }, [renamePane]);

  // 분할 비율 변경 핸들러
  const handleSplitResize = useCallback((splitId: string, newRatio: number) => {
    resizeSplit(splitId, newRatio);
  }, [resizeSplit]);

  // 입력 제출 핸들러 (InputBox → 활성 패인 PTY)
  const handleSubmit = useCallback(async (text: string) => {
    console.log('[handleSubmit] text:', text, 'activePaneId:', activePaneId, 'isPtyRunning:', isPtyRunning);

    if (!window.api?.pty) {
      console.error('[handleSubmit] PTY API not available');
      return;
    }
    if (!isPtyRunning) {
      console.error('[handleSubmit] PTY not running, cannot send');
      return;
    }

    if (writeCooldownRef.current) {
      console.log('[handleSubmit] waiting for ESC cooldown...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      const cleanText = text.trim();
      if (!cleanText) return;

      if (responseBufferRef.current.length > 0) {
        setLastResponse(stripAnsi(responseBufferRef.current.join('')));
      }
      responseBufferRef.current = [];

      writeAbortRef.current = false;

      // 활성 패인의 PTY로 전체 문자열을 한 번에 전송
      window.api.pty.write(cleanText, activePaneId);

      await new Promise(resolve => setTimeout(resolve, 50));
      await window.api.pty.write('\r', activePaneId);

      console.log(`[handleSubmit] sent to pane ${activePaneId}:`, cleanText);
    } catch (error) {
      console.error('[handleSubmit] Failed to send to PTY:', error);
    }

    if (window.api?.commandHistory?.add) {
      window.api.commandHistory.add(text.trim()).catch(() => {});
    }

    if (text.trim().startsWith('claude') && !isClaudeRunning && currentProject) {
      setIsClaudeRunning(true);
      setTimeout(async () => {
        try {
          await window.api.pty.startClaude(currentProject.path);
          console.log('Session watcher started');
        } catch (error) {
          console.error('Failed to start session watcher:', error);
        }
      }, 2000);
    }
  }, [isPtyRunning, isClaudeRunning, currentProject, activePaneId]);

  // 입력값 변경 핸들러
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // 설정 버튼 핸들러
  const handleSettingsClick = useCallback(() => {
    setShowSettings(true);
  }, []);

  // 프로젝트 클릭 핸들러 (TitleBar에서 호출)
  const handleProjectClick = useCallback(() => {
    openProjectSelector();
  }, [openProjectSelector]);

  // PTY 출력 캡처 핸들러 (응답 버퍼링)
  const handlePtyOutput = useCallback((data: string) => {
    responseBufferRef.current.push(data);
  }, []);

  // 프롬프트 제안 핸들러 (Claude Code ghost text)
  const handleSuggestion = useCallback((text: string) => {
    setSuggestion(text);
  }, []);

  // CommandBuilder에서 실행
  const handleCommandBuilderExecute = useCallback((command: string) => {
    setInputValue(command);
    setTimeout(() => handleSubmit(command), 100);
  }, [handleSubmit]);

  // CommandBuilder 열기
  const handleOpenCommandBuilder = useCallback(() => {
    setShowCommandBuilder(true);
  }, []);

  // ESC 키 핸들러 (Claude Code 중단)
  const handleEscape = useCallback(() => {
    if (window.api?.pty && isPtyRunning) {
      writeAbortRef.current = true;
      window.api.pty.write('\x03', activePaneId);
      writeCooldownRef.current = true;
      setTimeout(() => { writeCooldownRef.current = false; }, 1000);
    }
  }, [isPtyRunning, activePaneId]);

  return (
    <>
      {/* 프로젝트 선택 모달 */}
      <ProjectSelector />

      {/* 설정 모달 */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* CLI 명령어 빌더 모달 */}
      <CommandBuilder
        isOpen={showCommandBuilder}
        onClose={() => setShowCommandBuilder(false)}
        onExecute={handleCommandBuilderExecute}
      />

      {/* 메인 레이아웃 */}
      <MainLayout
        usage={usage}
        projectName={currentProject?.name || '프로젝트 없음'}
        projectPath={currentProject?.path}
        disabled={!isPtyRunning || showProjectSelector}
        inputValue={inputValue}
        suggestion={suggestion}
        lastResponse={lastResponse}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onData={handleData}
        onPtyOutput={handlePtyOutput}
        onSuggestion={handleSuggestion}
        onSettingsClick={handleSettingsClick}
        onProjectClick={handleProjectClick}
        onEscape={handleEscape}
        onOpenCommandBuilder={handleOpenCommandBuilder}
        // 다중 패인 props
        paneTree={paneTree}
        activePaneId={activePaneId}
        onPaneReady={handlePaneReady}
        onPaneClick={handlePaneClick}
        onSplit={handleSplit}
        onClosePane={handleClosePane}
        onRenamePane={handleRenamePane}
        onSplitResize={handleSplitResize}
      />
    </>
  );
}
