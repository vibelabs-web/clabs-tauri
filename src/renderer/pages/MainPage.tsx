// MainPage - 멀티탭 워크스페이스 통합
// 각 탭마다 독립된 paneTree/PTY 세션 유지, display:none으로 비활성 탭 숨김

import { useState, useCallback, useRef, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import ProjectSelector from '../components/project/ProjectSelector';
import SettingsModal from '../components/settings/SettingsModal';
import CommandBuilder from '../components/terminal/CommandBuilder';
import { useProjectStore } from '../stores/project';
import { useWorkspaceStore } from '../stores/workspace';
import { useTimelineStore } from '../stores/timeline';
import { useDiffStore } from '../stores/diff';
import { extractAllTurns } from '../utils/terminal-registry';
import type { UsageData } from '../types/usage';
import { stripAnsi } from '../utils/ansi';
import type { SplitDirection } from '@shared/pane-types';
import { getAllLeaves } from '@shared/pane-types';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

export default function MainPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandBuilder, setShowCommandBuilder] = useState(false);

  // 프로젝트 store (모달 상태만 사용)
  const { showProjectSelector, openProjectSelector, closeProjectSelector } = useProjectStore();

  // 워크스페이스 store
  const {
    tabs,
    activeTabId,
    addTab,
    removeTab,
    switchTab,
    getActiveTab,
    splitPaneInTab,
    closePaneInTab,
    renamePaneInTab,
    resizeSplitInTab,
    setActivePaneInTab,
    markPaneSpawned,
    unmarkPaneSpawned,
    isPaneSpawned,
    addEditorTab,
    switchEditorTab,
    closeEditorTab,
    setEditorTabDirty,
    broadcastMode,
    toggleBroadcastMode,
    saveSession,
    restoreSession,
  } = useWorkspaceStore();

  const activeTab = getActiveTab();

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

  const sessionStartRef = useRef<number>(Date.now());
  const writeAbortRef = useRef(false);
  const writeCooldownRef = useRef(false);
  const responseBufferRef = useRef<string[]>([]);
  const [lastResponse, setLastResponse] = useState('');
  const timelineDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 타임라인/diff 스토어
  const { setTurns } = useTimelineStore();
  const { addChange } = useDiffStore();

  // Usage 업데이트 구독
  useEffect(() => {
    if (window.api?.usage?.onUpdate) {
      const unsubscribe = window.api.usage.onUpdate((data) => {
        setUsage(prev => ({ ...prev, ...data, taskDuration: prev.taskDuration }));
      });
      return unsubscribe;
    }
  }, []);

  // PTY 종료 이벤트 구독 — 워크스페이스 탭에서 paneId 제거 + 시스템 알림
  useEffect(() => {
    if (window.api?.pty?.onExit) {
      const unsubscribe = window.api.pty.onExit((paneId, code) => {
        console.log(`[MainPage] PTY ${paneId} exited with code:`, code);

        // 프로세스 완료 시스템 알림 (앱이 포커스되지 않았을 때)
        if (!document.hasFocus() && Notification.permission === 'granted') {
          new Notification('프로세스 완료', {
            body: `터미널 프로세스가 ${code === 0 ? '성공적으로' : `코드 ${code}로`} 종료되었습니다.`,
            icon: undefined,
          });
        }

        // 모든 탭에서 해당 paneId를 spawned에서 제거
        const { tabs } = useWorkspaceStore.getState();
        for (const tab of tabs) {
          if (tab.spawnedPaneIds.has(paneId)) {
            unmarkPaneSpawned(tab.id, paneId);
          }
        }

        // 활성 탭의 모든 PTY가 종료되면 상태 리셋
        const currentTab = useWorkspaceStore.getState().getActiveTab();
        if (currentTab && currentTab.spawnedPaneIds.size === 0) {
          setIsPtyRunning(false);
          setIsClaudeRunning(false);
        }
      });
      return unsubscribe;
    }
  }, [unmarkPaneSpawned]);

  // 시스템 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // PTY 시작 후 usage 데이터 주기적 요청
  useEffect(() => {
    if (isPtyRunning && window.api?.usage?.get) {
      const fetchUsage = () => {
        window.api.usage.get().then((data) => {
          if (data) {
            setUsage(prev => ({ ...prev, ...data, taskDuration: prev.taskDuration }));
          }
        }).catch(err => console.error('Usage fetch error:', err));
      };

      fetchUsage();
      const interval = setInterval(fetchUsage, 30000);
      return () => clearInterval(interval);
    }
  }, [isPtyRunning]);

  // 세션 복원 (앱 시작 시) - 탭이 없을 때만
  useEffect(() => {
    if (tabs.length === 0) {
      restoreSession().then((restored) => {
        if (!restored) {
          openProjectSelector();
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 세션 자동 저장 (탭 변경 시)
  useEffect(() => {
    if (tabs.length > 0) {
      saveSession();
    }
  }, [tabs, activeTabId, saveSession]);

  // Orchestrator: 원격 페인 분할 요청 수신
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<{ paneId: string; direction: string; requestId: string }>(
      'orchestrate:split-pane',
      async (event) => {
        const { paneId, direction, requestId } = event.payload;
        const store = useWorkspaceStore.getState();

        // Find the tab that contains this paneId (not just active tab)
        const tab = store.tabs.find(t => {
          const leaves = getAllLeaves(t.paneRoot);
          return leaves.some(l => l.id === paneId);
        }) || store.getActiveTab();

        if (!tab) {
          console.error('[orchestrate] No tab found for split');
          return;
        }

        const dir = (direction === 'vertical' ? 'vertical' : 'horizontal') as SplitDirection;
        const newPaneId = store.splitPaneInTab(tab.id, paneId, dir);

        console.log(`[orchestrate] Split pane ${paneId} ${dir} → ${newPaneId} (tab: ${tab.id})`);

        if (newPaneId) {
          // Report result to Tauri backend via IPC command
          await invoke('orchestrate_split_result', {
            requestId,
            newPaneId,
          });
        }
      },
    ).then((fn) => { unlisten = fn; });

    return () => { unlisten?.(); };
  }, []);

  // 태스크 시간 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStartRef.current) / 1000);
      setUsage(prev => ({ ...prev, taskDuration: duration }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 파일 감시 시작/종료 (활성 탭 프로젝트 연동)
  useEffect(() => {
    const tab = activeTab;
    if (!tab?.project?.path || !window.api?.fileWatcher) return;

    window.api.fileWatcher.start(tab.project.path).catch((err: unknown) => {
      console.error('[MainPage] 파일 감시 시작 실패:', err);
    });

    // 파일 변경 이벤트 구독
    const unsubscribe = window.api.fileWatcher.onChanged((change) => {
      addChange({
        path: change.path,
        diff: change.diff,
        changeType: change.change_type as 'modified' | 'created' | 'deleted',
        timestamp: change.timestamp,
      });
    });

    return () => {
      unsubscribe();
      window.api?.fileWatcher?.stop().catch(() => {});
    };
  }, [activeTab?.project?.path, addChange]);

  // 전역 ESC 키 핸들러
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPtyRunning && !showSettings && !showProjectSelector && activeTab) {
        // InputBox(textarea)에 포커스가 있으면 전역 ESC 무시 (InputBox 자체 핸들러 우선)
        const active = document.activeElement;
        if (active?.tagName === 'TEXTAREA' && (active as HTMLElement).dataset.testid === 'input-box') {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        writeAbortRef.current = true;
        window.api?.pty?.write('\x03', activeTab.activePaneId);
        writeCooldownRef.current = true;
        setTimeout(() => { writeCooldownRef.current = false; }, 1000);
      }
    };
    document.addEventListener('keydown', handleGlobalEscape, true);
    return () => document.removeEventListener('keydown', handleGlobalEscape, true);
  }, [isPtyRunning, showSettings, showProjectSelector, activeTab]);

  // 패인 터미널 준비 완료 시 해당 패인의 PTY 시작
  // paneId로 어떤 탭에 속하는지 찾아서 해당 탭의 프로젝트 경로로 PTY 생성
  const handlePaneReady = useCallback(async (paneId: string) => {
    const { tabs } = useWorkspaceStore.getState();
    console.log(`[handlePaneReady] paneId=${paneId}, tabs=${tabs.length}, tabIds=${tabs.map(t => t.id).join(',')}`);

    // paneId가 속한 탭 찾기
    const tab = tabs.find(t => {
      const leaves = getAllLeaves(t.paneRoot);
      return leaves.some(l => l.id === paneId);
    });

    if (!tab) {
      console.warn(`[handlePaneReady] No tab found for paneId=${paneId}`);
      return;
    }

    if (tab.spawnedPaneIds.has(paneId)) {
      console.log(`[handlePaneReady] paneId=${paneId} already spawned, skipping`);
      return;
    }

    markPaneSpawned(tab.id, paneId);
    console.log(`[handlePaneReady] Spawning PTY for pane ${paneId} in: ${tab.project.path} (tab: ${tab.id})`);

    try {
      if (window.api?.pty) {
        await window.api.pty.spawn('claude', tab.project.path, paneId);
        setIsPtyRunning(true);
        console.log(`[handlePaneReady] PTY spawned successfully for pane ${paneId}`);
      }
    } catch (error) {
      console.error(`[handlePaneReady] Failed to spawn PTY for pane ${paneId}:`, error);
      unmarkPaneSpawned(tab.id, paneId);
    }
  }, [markPaneSpawned, unmarkPaneSpawned]);

  // 터미널 데이터 핸들러 (xterm → 활성 패인 PTY, 브로드캐스트 모드 지원)
  const handleData = useCallback((data: string) => {
    if (!window.api?.pty || !isPtyRunningRef.current || !activeTab) return;

    if (broadcastMode) {
      // 브로드캐스트: 모든 spawned 패인에 동시 전송
      for (const paneId of activeTab.spawnedPaneIds) {
        window.api.pty.write(data, paneId);
      }
    } else {
      window.api.pty.write(data, activeTab.activePaneId);
    }
  }, [activeTab, broadcastMode]);

  // 패인 분할 핸들러
  const handleSplit = useCallback((paneId: string, direction: SplitDirection) => {
    if (!activeTab) return;
    const newPaneId = splitPaneInTab(activeTab.id, paneId, direction);
    console.log(`Split pane ${paneId} ${direction} → new pane ${newPaneId}`);
  }, [activeTab, splitPaneInTab]);

  // 패인 닫기 핸들러
  const handleClosePane = useCallback((paneId: string) => {
    if (!activeTab) return;
    if (window.api?.pty) {
      window.api.pty.kill(paneId);
    }
    unmarkPaneSpawned(activeTab.id, paneId);
    closePaneInTab(activeTab.id, paneId);
    console.log(`Closed pane ${paneId}`);
  }, [activeTab, closePaneInTab, unmarkPaneSpawned]);

  // 패인 클릭 핸들러
  const handlePaneClick = useCallback((paneId: string) => {
    if (!activeTab) return;
    setActivePaneInTab(activeTab.id, paneId);
  }, [activeTab, setActivePaneInTab]);

  // 패인 이름 변경 핸들러
  const handleRenamePane = useCallback((paneId: string, name: string) => {
    if (!activeTab) return;
    renamePaneInTab(activeTab.id, paneId, name);
  }, [activeTab, renamePaneInTab]);

  // 분할 비율 변경 핸들러
  const handleSplitResize = useCallback((splitId: string, newRatio: number) => {
    if (!activeTab) return;
    resizeSplitInTab(activeTab.id, splitId, newRatio);
  }, [activeTab, resizeSplitInTab]);

  // 입력 제출 핸들러
  const handleSubmit = useCallback(async (text: string) => {
    const tab = useWorkspaceStore.getState().getActiveTab();
    if (!tab) return;

    if (!window.api?.pty || !isPtyRunning) return;

    if (writeCooldownRef.current) {
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

      window.api.pty.write(cleanText, tab.activePaneId);
      await new Promise(resolve => setTimeout(resolve, 50));
      await window.api.pty.write('\r', tab.activePaneId);

      console.log(`[handleSubmit] sent to pane ${tab.activePaneId}:`, cleanText);
    } catch (error) {
      console.error('[handleSubmit] Failed to send to PTY:', error);
    }

    if (window.api?.commandHistory?.add) {
      window.api.commandHistory.add(text.trim()).catch(() => {});
    }

    if (text.trim().startsWith('claude') && !isClaudeRunning && tab.project) {
      setIsClaudeRunning(true);
      setTimeout(async () => {
        try {
          await window.api.pty.startClaude(tab.project.path);
        } catch (error) {
          console.error('Failed to start session watcher:', error);
        }
      }, 2000);
    }
  }, [isPtyRunning, isClaudeRunning]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSettingsClick = useCallback(() => {
    setShowSettings(true);
  }, []);

  // "+" 탭 추가 → ProjectSelector 열기
  const handleTabAdd = useCallback(() => {
    openProjectSelector();
  }, [openProjectSelector]);

  // 탭 전환 (PTY 유지, display:none으로 전환)
  const handleTabSwitch = useCallback((tabId: string) => {
    switchTab(tabId);
    // 전환된 탭에 PTY가 있으면 running 상태 유지
    const { tabs } = useWorkspaceStore.getState();
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.spawnedPaneIds.size > 0) {
      setIsPtyRunning(true);
    }
  }, [switchTab]);

  // 탭 닫기
  const handleTabClose = useCallback((tabId: string) => {
    removeTab(tabId);
    // 남은 탭이 없으면 ProjectSelector 열기
    const { tabs: remainingTabs } = useWorkspaceStore.getState();
    if (remainingTabs.length === 0) {
      openProjectSelector();
      setIsPtyRunning(false);
      setIsClaudeRunning(false);
    }
  }, [removeTab, openProjectSelector]);

  // 프로젝트 클릭 핸들러 (TitleBar — 탭이 없을 때)
  const handleProjectClick = useCallback(() => {
    openProjectSelector();
  }, [openProjectSelector]);

  // PTY 출력 캡처 핸들러 + 타임라인 파싱 트리거
  const handlePtyOutput = useCallback((data: string) => {
    responseBufferRef.current.push(data);

    // 500ms 디바운스로 타임라인 파싱
    if (timelineDebounceRef.current) clearTimeout(timelineDebounceRef.current);
    timelineDebounceRef.current = setTimeout(() => {
      const tab = useWorkspaceStore.getState().getActiveTab();
      if (tab) {
        const turns = extractAllTurns(tab.activePaneId);
        setTurns(turns);
      }
    }, 500);
  }, [setTurns]);

  // 프롬프트 제안 핸들러
  const handleSuggestion = useCallback((text: string) => {
    setSuggestion(text);
  }, []);

  // CommandBuilder 실행
  const handleCommandBuilderExecute = useCallback((command: string) => {
    setInputValue(command);
    setTimeout(() => handleSubmit(command), 100);
  }, [handleSubmit]);

  const handleOpenCommandBuilder = useCallback(() => {
    setShowCommandBuilder(true);
  }, []);

  // ESC 키 핸들러
  const handleEscape = useCallback(() => {
    if (window.api?.pty && isPtyRunning && activeTab) {
      writeAbortRef.current = true;
      window.api.pty.write('\x03', activeTab.activePaneId);
      writeCooldownRef.current = true;
      setTimeout(() => { writeCooldownRef.current = false; }, 1000);
    }
  }, [isPtyRunning, activeTab]);

  // 에디터 탭 핸들러
  const handleSwitchEditorTab = useCallback((paneId: string, editorTabId: string) => {
    if (!activeTab) return;
    switchEditorTab(activeTab.id, paneId, editorTabId);
  }, [activeTab, switchEditorTab]);

  const handleCloseEditorTab = useCallback((paneId: string, editorTabId: string) => {
    if (!activeTab) return;
    closeEditorTab(activeTab.id, paneId, editorTabId);
  }, [activeTab, closeEditorTab]);

  const handleEditorTabDirtyChange = useCallback((paneId: string, editorTabId: string, isDirty: boolean) => {
    if (!activeTab) return;
    setEditorTabDirty(activeTab.id, paneId, editorTabId, isDirty);
  }, [activeTab, setEditorTabDirty]);

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
        projectName={activeTab?.project.name || '프로젝트 없음'}
        projectPath={activeTab?.project.path}
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
        // 다중 패인 props (활성 탭)
        paneTree={activeTab?.paneRoot}
        activePaneId={activeTab?.activePaneId}
        onPaneReady={handlePaneReady}
        onPaneClick={handlePaneClick}
        onSplit={handleSplit}
        onClosePane={handleClosePane}
        onRenamePane={handleRenamePane}
        onSplitResize={handleSplitResize}
        // 멀티탭 props
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSwitch={handleTabSwitch}
        onTabClose={handleTabClose}
        onTabAdd={handleTabAdd}
        onSwitchEditorTab={handleSwitchEditorTab}
        onCloseEditorTab={handleCloseEditorTab}
        onEditorTabDirtyChange={handleEditorTabDirtyChange}
        broadcastMode={broadcastMode}
        onToggleBroadcast={toggleBroadcastMode}
      />
    </>
  );
}
