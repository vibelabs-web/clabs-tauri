// PaneView - 리프 패인 래퍼 (PaneHeader + EditorTabBar + TerminalView/FilePreviewView)
// absolute positioning으로 TerminalView 크기 확보
//
// Feature flag: localStorage.setItem('clabs.useNativeTerminal', 'true')
// → NativeTerminalView (ghostty NSView 오버레이) 활성화
// → localStorage.removeItem('clabs.useNativeTerminal') 으로 xterm 모드 복귀

import { useCallback } from 'react';
import type { PaneLeaf } from '@shared/pane-types';
import { PaneHeader } from './PaneHeader';
import { EditorTabBar } from './EditorTabBar';
import { TerminalView } from './TerminalView';
import { NativeTerminalView } from './NativeTerminalView';
import { FilePreviewView } from './FilePreviewView';

// 런타임에 한 번 평가 (리렌더마다 재평가 불필요)
const USE_NATIVE_TERMINAL = localStorage.getItem('clabs.useNativeTerminal') === 'true';

export interface PaneViewProps {
  pane: PaneLeaf;
  isActive: boolean;
  canClose: boolean;
  onPaneClick: (paneId: string) => void;
  onSplit: (paneId: string, direction: 'horizontal' | 'vertical') => void;
  onClose: (paneId: string) => void;
  onRename: (paneId: string, name: string) => void;
  onPaneReady: (paneId: string) => void;
  onData: (data: string) => void;
  onSuggestion?: (suggestion: string) => void;
  onPtyOutput?: (data: string) => void;
  projectPath?: string;
  onSwitchEditorTab?: (paneId: string, editorTabId: string) => void;
  onCloseEditorTab?: (paneId: string, editorTabId: string) => void;
  onEditorTabDirtyChange?: (paneId: string, editorTabId: string, isDirty: boolean) => void;
}

export function PaneView({
  pane,
  isActive,
  canClose,
  onPaneClick,
  onSplit,
  onClose,
  onRename,
  onPaneReady,
  onData,
  onSuggestion,
  onPtyOutput,
  projectPath,
  onSwitchEditorTab,
  onCloseEditorTab,
  onEditorTabDirtyChange,
}: PaneViewProps) {
  const hasEditorTabs = pane.editorTabs && pane.editorTabs.length > 0;

  // 활성 에디터 탭 결정
  const activeEditorTab = hasEditorTabs
    ? pane.editorTabs!.find(t => t.id === pane.activeEditorTabId) || pane.editorTabs![0]
    : null;

  const isTerminalActive = !activeEditorTab || activeEditorTab.type === 'terminal';

  const handleDirtyChange = useCallback((isDirty: boolean) => {
    if (activeEditorTab && onEditorTabDirtyChange) {
      onEditorTabDirtyChange(pane.id, activeEditorTab.id, isDirty);
    }
  }, [pane.id, activeEditorTab, onEditorTabDirtyChange]);

  // xterm 입력을 이 페인의 PTY로 직접 전송 (공유 onData 대신)
  const handleTerminalData = useCallback((data: string) => {
    if (window.api?.pty) {
      window.api.pty.write(data, pane.id);
    }
  }, [pane.id]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      className={isActive ? 'ring-1 ring-accent/50' : ''}
      data-pane-id={pane.id}
      onClick={() => onPaneClick(pane.id)}
    >
      <PaneHeader
        name={pane.name}
        isActive={isActive}
        canClose={canClose}
        onSplitVertical={() => onSplit(pane.id, 'vertical')}
        onSplitHorizontal={() => onSplit(pane.id, 'horizontal')}
        onClose={() => onClose(pane.id)}
        onRename={(name) => onRename(pane.id, name)}
        onClick={() => onPaneClick(pane.id)}
      />

      {/* 에디터 탭 바 (파일 탭이 있을 때만 표시) */}
      {hasEditorTabs && onSwitchEditorTab && onCloseEditorTab && (
        <EditorTabBar
          tabs={pane.editorTabs!}
          activeTabId={pane.activeEditorTabId}
          onSwitch={(editorTabId) => onSwitchEditorTab(pane.id, editorTabId)}
          onClose={(editorTabId) => onCloseEditorTab(pane.id, editorTabId)}
        />
      )}

      {/* 콘텐츠 영역 */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        {/* 터미널 (항상 렌더링, 비활성 시 숨김으로 PTY 연결 유지)
            ghostty 모드: NativeTerminalView가 자체 PTY를 생성 — pty.spawn 불필요.
            xterm 모드:  TerminalView + window.api.pty.write 기존 방식 유지. */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: isTerminalActive ? 'block' : 'none',
        }}>
          {USE_NATIVE_TERMINAL ? (
            <NativeTerminalView
              key={`native-${pane.id}`}
              paneId={pane.id}
              onReady={() => onPaneReady(pane.id)}
            />
          ) : (
            <TerminalView
              key={`${projectPath || 'default'}-${pane.id}`}
              paneId={pane.id}
              onData={handleTerminalData}
              onReady={() => onPaneReady(pane.id)}
              onSuggestion={onSuggestion}
              onPtyOutput={onPtyOutput}
            />
          )}
        </div>

        {/* 파일 에디터 (파일 탭 활성 시) */}
        {!isTerminalActive && activeEditorTab?.filePath && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <FilePreviewView
              filePath={activeEditorTab.filePath}
              onDirtyChange={handleDirtyChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
