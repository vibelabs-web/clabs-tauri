// TitleBar 컴포넌트 - 멀티탭 워크스페이스 지원

import { memo, useCallback, useRef, useState, useEffect } from 'react';
import type { WorkspaceTab } from '@renderer/stores/workspace';

interface TitleBarProps {
  projectName?: string;
  onProjectClick?: () => void;
  // 멀티탭 props
  tabs?: WorkspaceTab[];
  activeTabId?: string;
  onTabSwitch?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabAdd?: () => void;
}

// 아이콘 컴포넌트
const FolderIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-text-secondary flex-shrink-0">
    <path
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-secondary">
    <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TabCloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-text-muted">
    <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

const TitleBar = memo(({
  projectName,
  onProjectClick,
  tabs,
  activeTabId,
  onTabSwitch,
  onTabClose,
  onTabAdd,
}: TitleBarProps) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTabId, setDragTabId] = useState<string | null>(null);

  const handleMinimize = () => window.api.window.minimize();
  const handleMaximize = () => window.api.window.maximize();
  const handleClose = () => window.api.window.close();

  const handleTabClick = useCallback((tabId: string) => {
    onTabSwitch?.(tabId);
  }, [onTabSwitch]);

  const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose?.(tabId);
  }, [onTabClose]);

  // 탭이 추가되면 스크롤을 끝으로 이동
  useEffect(() => {
    if (tabsContainerRef.current && tabs && tabs.length > 0) {
      tabsContainerRef.current.scrollLeft = tabsContainerRef.current.scrollWidth;
    }
  }, [tabs?.length]);

  const hasTabs = tabs && tabs.length > 0;

  return (
    <div
      className="h-12 bg-bg-secondary border-b border-border-default flex items-center justify-between"
      data-tauri-drag-region
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* 좌측: 앱 타이틀 */}
      <div className="flex items-center gap-2 px-4 flex-shrink-0">
        <h1 className="text-sm font-semibold text-text-primary">clabs</h1>
        <span className="text-xs text-text-disabled">|</span>
      </div>

      {/* 중앙: 탭 바 또는 단일 프로젝트명 — 빈 공간은 드래그 가능 */}
      <div
        className="flex-1 flex items-center overflow-hidden min-w-0 h-full"
        data-tauri-drag-region
      >
        {hasTabs ? (
          <div className="flex items-center gap-1 overflow-hidden min-w-0">
            {/* 탭 목록 (가로 스크롤) */}
            <div
              ref={tabsContainerRef}
              className="flex items-center gap-0.5 overflow-x-auto scrollbar-none min-w-0"
              style={{ scrollbarWidth: 'none' }}
            >
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`
                      group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs
                      transition-colors duration-150 flex-shrink-0 max-w-[180px]
                      ${isActive
                        ? 'bg-bg-primary text-text-primary shadow-sm'
                        : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                      }
                    `}
                    title={tab.project.path}
                    style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                  >
                    <FolderIcon size={12} />
                    <span className="truncate">{tab.project.name}</span>
                    {/* 닫기 버튼 */}
                    <span
                      onClick={(e) => handleTabClose(e, tab.id)}
                      className={`
                        flex-shrink-0 w-4 h-4 flex items-center justify-center rounded
                        transition-opacity duration-150
                        hover:bg-status-error/20 hover:text-status-error
                        ${isActive ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'}
                      `}
                    >
                      <TabCloseIcon />
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 새 탭 추가 버튼 */}
            <button
              onClick={onTabAdd}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md hover:bg-bg-hover transition-colors"
              title="새 프로젝트 탭 추가"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <PlusIcon />
            </button>
          </div>
        ) : (
          /* 탭이 없으면 단일 프로젝트명 (기존 동작) */
          <button
            onClick={onProjectClick}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-bg-hover transition-colors"
            title="클릭하여 프로젝트 변경"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <FolderIcon />
            <span className="text-xs text-text-secondary max-w-[200px] truncate">
              {projectName || '프로젝트 없음'}
            </span>
          </button>
        )}
      </div>

      {/* 우측: 창 컨트롤 */}
      <div
        className="flex items-center gap-2 px-4 flex-shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-hover transition-colors"
          aria-label="Minimize window"
        >
          <MinimizeIcon />
        </button>
        <button
          onClick={handleMaximize}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-bg-hover transition-colors"
          aria-label="Maximize window"
        >
          <MaximizeIcon />
        </button>
        <button
          onClick={handleClose}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-status-error/80 transition-colors"
          aria-label="Close window"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
});

TitleBar.displayName = 'TitleBar';

export default TitleBar;
