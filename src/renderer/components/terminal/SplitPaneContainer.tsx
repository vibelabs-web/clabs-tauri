// SplitPaneContainer - 이진 트리 재귀적 렌더링

import { useCallback, useRef } from 'react';
import type { PaneNode } from '@shared/pane-types';
import { PaneView } from './PaneView';
import { PaneDivider } from './PaneDivider';

export interface SplitPaneContainerProps {
  node: PaneNode;
  activePaneId: string;
  totalLeaves: number;
  onPaneClick: (paneId: string) => void;
  onSplit: (paneId: string, direction: 'horizontal' | 'vertical') => void;
  onClose: (paneId: string) => void;
  onRename: (paneId: string, name: string) => void;
  onPaneReady: (paneId: string) => void;
  onSplitResize: (splitId: string, newRatio: number) => void;
  onData: (data: string) => void;
  onSuggestion?: (suggestion: string) => void;
  onPtyOutput?: (data: string) => void;
  projectPath?: string;
  onSwitchEditorTab?: (paneId: string, editorTabId: string) => void;
  onCloseEditorTab?: (paneId: string, editorTabId: string) => void;
  onEditorTabDirtyChange?: (paneId: string, editorTabId: string, isDirty: boolean) => void;
}

export function SplitPaneContainer({
  node,
  activePaneId,
  totalLeaves,
  onPaneClick,
  onSplit,
  onClose,
  onRename,
  onPaneReady,
  onSplitResize,
  onData,
  onSuggestion,
  onPtyOutput,
  projectPath,
  onSwitchEditorTab,
  onCloseEditorTab,
  onEditorTabDirtyChange,
}: SplitPaneContainerProps) {
  // 훅은 반드시 조건문 전에 선언 (React Rules of Hooks)
  const containerRef = useRef<HTMLDivElement>(null);

  const isVertical = node.type === 'split' ? node.direction === 'vertical' : true;
  const ratio = node.type === 'split' ? node.ratio : 0.5;
  const nodeId = node.id;

  const handleResize = useCallback((delta: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const totalSize = isVertical ? rect.width : rect.height;
    if (totalSize <= 0) return;
    onSplitResize(nodeId, ratio + delta / totalSize);
  }, [nodeId, ratio, isVertical, onSplitResize]);

  // 리프 노드 → PaneView
  if (node.type === 'leaf') {
    return (
      <PaneView
        pane={node}
        isActive={node.id === activePaneId}
        canClose={totalLeaves > 1}
        onPaneClick={onPaneClick}
        onSplit={onSplit}
        onClose={onClose}
        onRename={onRename}
        onPaneReady={onPaneReady}
        onData={onData}
        onSuggestion={onSuggestion}
        onPtyOutput={onPtyOutput}
        projectPath={projectPath}
        onSwitchEditorTab={onSwitchEditorTab}
        onCloseEditorTab={onCloseEditorTab}
        onEditorTabDirtyChange={onEditorTabDirtyChange}
      />
    );
  }

  // 스플릿 노드 → 재귀적 분할
  const sharedProps = {
    activePaneId,
    totalLeaves,
    onPaneClick,
    onSplit,
    onClose,
    onRename,
    onPaneReady,
    onSplitResize,
    onData,
    onSuggestion,
    onPtyOutput,
    projectPath,
    onSwitchEditorTab,
    onCloseEditorTab,
    onEditorTabDirtyChange,
  };

  const abs: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'row' : 'column',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div style={{ flex: ratio, position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0, zIndex: 2 }}>
        <div style={abs}>
          <SplitPaneContainer node={node.first} {...sharedProps} />
        </div>
      </div>

      <PaneDivider direction={node.direction} onResize={handleResize} />

      <div style={{ flex: 1 - ratio, position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0, zIndex: 2 }}>
        <div style={abs}>
          <SplitPaneContainer node={node.second} {...sharedProps} />
        </div>
      </div>
    </div>
  );
}
