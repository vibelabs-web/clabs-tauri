// PaneView - 리프 패인 래퍼 (PaneHeader + TerminalView)
// absolute positioning으로 TerminalView 크기 확보

import type { PaneLeaf } from '@shared/pane-types';
import { PaneHeader } from './PaneHeader';
import { TerminalView } from './TerminalView';

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
}: PaneViewProps) {
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
      {/* TerminalView 영역: position relative + absolute로 확실한 크기 전달 */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <TerminalView
            key={`${projectPath || 'default'}-${pane.id}`}
            paneId={pane.id}
            onData={onData}
            onReady={() => onPaneReady(pane.id)}
            onSuggestion={onSuggestion}
            onPtyOutput={onPtyOutput}
          />
        </div>
      </div>
    </div>
  );
}
