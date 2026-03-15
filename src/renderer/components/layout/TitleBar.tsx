// @TASK P2-S5-T1 - TitleBar 컴포넌트
// @SPEC docs/planning/phase-2.md#titlebar

import { memo } from 'react';

interface TitleBarProps {
  projectName?: string;
  onProjectClick?: () => void;
}

// 아이콘 컴포넌트
const FolderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-text-secondary">
    <path
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MinimizeIcon = () => (
  <svg width="12" height="2" viewBox="0 0 12 2" fill="none" className="text-text-secondary">
    <line x1="0" y1="1" x2="12" y2="1" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const MaximizeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-secondary">
    <rect x="1" y="1" width="10" height="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-secondary">
    <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TitleBar = memo(({ projectName, onProjectClick }: TitleBarProps) => {
  const handleMinimize = () => {
    window.api.window.minimize();
  };

  const handleMaximize = () => {
    window.api.window.maximize();
  };

  const handleClose = () => {
    window.api.window.close();
  };

  return (
    <div
      className="h-12 bg-bg-secondary border-b border-border-default flex items-center justify-between px-4"
      data-tauri-drag-region
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* 좌측: 앱 타이틀 + 프로젝트명 */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-text-primary">clabs</h1>
        <span className="text-xs text-text-disabled">|</span>
        {/* 프로젝트 클릭 영역 */}
        <button
          onClick={onProjectClick}
          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-bg-hover transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="클릭하여 프로젝트 변경"
        >
          <FolderIcon />
          <span className="text-xs text-text-secondary max-w-[200px] truncate">
            {projectName || '프로젝트 없음'}
          </span>
        </button>
      </div>

      {/* 우측: 창 컨트롤 */}
      <div
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* 최소화 */}
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-hover transition-colors"
          aria-label="Minimize window"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <MinimizeIcon />
        </button>

        {/* 최대화 */}
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-hover transition-colors"
          aria-label="Maximize window"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <MaximizeIcon />
        </button>

        {/* 닫기 */}
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-status-error/80 transition-colors"
          aria-label="Close window"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
});

TitleBar.displayName = 'TitleBar';

export default TitleBar;
