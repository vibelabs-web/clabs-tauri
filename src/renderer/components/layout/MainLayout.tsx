// @TASK P2-S6-T1 - MainLayout 컴포넌트 (리사이즈 가능 사이드바 + 다중 패인)

import React, { useState, useCallback, useRef, useEffect } from 'react';
import TitleBar from './TitleBar';
import ToolbarBar from './ToolbarBar';
import { SkillPanel } from './SkillPanel';
import { SplitPaneContainer } from '../terminal/SplitPaneContainer';
import { InputBox } from '../terminal/InputBox';
import StatusBar from './StatusBar';
import type { UsageData } from '@renderer/types/usage';
import type { WorkflowStep, Recommendation } from '@renderer/types/skill-panel';
import type { PaneNode, SplitDirection } from '@shared/pane-types';
import { getAllLeaves } from '@shared/pane-types';
import { getTerminalTextForCopy } from '@renderer/utils/terminal-registry';
import type { WorkspaceTab } from '@renderer/stores/workspace';

export interface MainLayoutProps {
  usage: UsageData;
  workflow?: WorkflowStep[];
  recommendation?: Recommendation;
  projectName?: string;
  projectPath?: string; // 터미널 재생성을 위한 key
  disabled?: boolean;
  inputValue: string;
  suggestion?: string;
  onInputChange: (value: string) => void;
  onSubmit: (text: string) => void;
  onData: (data: string) => void;
  onSuggestion?: (suggestion: string) => void;
  onSettingsClick?: () => void;
  onProjectClick?: () => void;
  onEscape?: () => void;
  onOpenCommandBuilder?: () => void;
  lastResponse?: string;
  onPtyOutput?: (data: string) => void;
  // 다중 패인 props
  paneTree?: PaneNode;
  activePaneId?: string;
  onPaneReady?: (paneId: string) => void;
  onPaneClick?: (paneId: string) => void;
  onSplit?: (paneId: string, direction: SplitDirection) => void;
  onClosePane?: (paneId: string) => void;
  onRenamePane?: (paneId: string, name: string) => void;
  onSplitResize?: (splitId: string, newRatio: number) => void;
  // 멀티탭 props
  tabs?: WorkspaceTab[];
  activeTabId?: string;
  onTabSwitch?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabAdd?: () => void;
}

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 280;

const MainLayout: React.FC<MainLayoutProps> = ({
  usage,
  workflow = [],
  recommendation,
  projectName,
  projectPath,
  disabled = false,
  inputValue,
  suggestion,
  onInputChange,
  onSubmit,
  onData,
  onSuggestion,
  onSettingsClick,
  onProjectClick,
  onEscape,
  onOpenCommandBuilder,
  onPtyOutput,
  // 다중 패인
  paneTree,
  activePaneId,
  onPaneReady,
  onPaneClick,
  onSplit,
  onClosePane,
  onRenamePane,
  onSplitResize,
  // 멀티탭
  tabs,
  activeTabId: activeWorkspaceTabId,
  onTabSwitch,
  onTabClose,
  onTabAdd,
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [skillCommands, setSkillCommands] = useState<{ command: string; description: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 스킬 명령어 목록 로드
  useEffect(() => {
    const loadSkills = async () => {
      try {
        if (window.api?.skills?.list) {
          const skills = await window.api.skills.list();
          const commands = skills.map(skill => ({
            command: `/${skill.trigger}`,
            description: skill.description || skill.name,
          }));
          setSkillCommands(commands);
        }
      } catch (error) {
        console.error('Failed to load skills:', error);
      }
    };
    loadSkills();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // 터미널 내용 복사 (선택 텍스트 우선, 없으면 최근 출력)
  const handleCopyTerminal = useCallback(async () => {
    const paneId = activePaneId || 'pane-default';
    const text = getTerminalTextForCopy(paneId);
    console.log('[handleCopyTerminal] paneId:', paneId, 'textLen:', text?.length, 'preview:', text?.substring(0, 200));
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [activePaneId]);

  // 스킬 선택 시 입력창에 명령어 설정
  const handleSkillSelect = useCallback((command: string) => {
    onInputChange(command);
  }, [onInputChange]);

  // 툴바 바로가기 클릭 → 입력 + 즉시 실행
  const handleToolbarExecute = useCallback((command: string) => {
    onInputChange(command);
    onSubmit(command);
  }, [onInputChange, onSubmit]);

  // 패인 트리 렌더링 (다중 패인 모드)
  const totalLeaves = paneTree ? getAllLeaves(paneTree).length : 1;

  return (
    <div
      data-testid="main-layout"
      className="flex flex-col h-screen bg-bg-primary overflow-hidden"
    >
      <TitleBar
        projectName={projectName}
        onProjectClick={onProjectClick}
        tabs={tabs}
        activeTabId={activeWorkspaceTabId}
        onTabSwitch={onTabSwitch}
        onTabClose={onTabClose}
        onTabAdd={onTabAdd}
      />
      <ToolbarBar onExecute={handleToolbarExecute} />

      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div
          className="flex-shrink-0 border-r border-border-default overflow-hidden"
          style={{ width: sidebarWidth }}
        >
          <SkillPanel
            workflow={workflow}
            recommendation={recommendation}
            onSkillSelect={handleSkillSelect}
            onOpenCommandBuilder={onOpenCommandBuilder}
          />
        </div>

        <div
          className={`w-1 flex-shrink-0 cursor-col-resize hover:bg-accent/50 transition-colors ${
            isResizing ? 'bg-accent' : 'bg-transparent'
          }`}
          onMouseDown={handleMouseDown}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-hidden" style={{ position: 'relative' }}>
            {/* 멀티탭: 모든 탭의 터미널을 동시 렌더링, 비활성 탭은 display:none으로 숨김 (PTY 유지) */}
            {tabs && tabs.length > 0 && onPaneReady && onPaneClick && onSplit && onClosePane && onRenamePane && onSplitResize ? (
              tabs.map((tab) => {
                const isActive = tab.id === activeWorkspaceTabId;
                const tabLeaves = getAllLeaves(tab.paneRoot).length;
                return (
                  <div
                    key={tab.id}
                    className="h-full w-full"
                    style={{ display: isActive ? 'block' : 'none', position: 'absolute', inset: 0 }}
                  >
                    <SplitPaneContainer
                      node={tab.paneRoot}
                      activePaneId={tab.activePaneId}
                      totalLeaves={tabLeaves}
                      onPaneClick={onPaneClick}
                      onSplit={onSplit}
                      onClose={onClosePane}
                      onRename={onRenamePane}
                      onPaneReady={onPaneReady}
                      onSplitResize={onSplitResize}
                      onData={onData}
                      onSuggestion={onSuggestion}
                      onPtyOutput={onPtyOutput}
                      projectPath={tab.project.path}
                    />
                  </div>
                );
              })
            ) : paneTree && onPaneReady && onPaneClick && onSplit && onClosePane && onRenamePane && onSplitResize ? (
              <SplitPaneContainer
                node={paneTree}
                activePaneId={activePaneId || 'pane-default'}
                totalLeaves={totalLeaves}
                onPaneClick={onPaneClick}
                onSplit={onSplit}
                onClose={onClosePane}
                onRename={onRenamePane}
                onPaneReady={onPaneReady}
                onSplitResize={onSplitResize}
                onData={onData}
                onSuggestion={onSuggestion}
                onPtyOutput={onPtyOutput}
                projectPath={projectPath}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-text-secondary">
                터미널 로딩 중...
              </div>
            )}
          </div>

          <div className="flex-shrink-0 p-4 bg-bg-secondary border-t border-border-default">
            <div className="flex items-end gap-2">
              <div className="flex-1 min-w-0">
                <InputBox
                  value={inputValue}
                  onChange={onInputChange}
                  onSubmit={onSubmit}
                  disabled={disabled}
                  placeholder="명령어를 입력하세요 (예: /socrates)"
                  suggestion={suggestion}
                  skillCommands={skillCommands}
                  onEscape={onEscape}
                  onRawKey={onData}
                  activePaneId={activePaneId}
                />
              </div>
              <button
                type="button"
                onClick={handleCopyTerminal}
                aria-label="터미널 복사"
                title="터미널 텍스트 복사 (선택 영역 우선)"
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-bg-tertiary hover:bg-bg-hover disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <StatusBar usage={usage} onSettingsClick={onSettingsClick} />
    </div>
  );
};

export default MainLayout;
