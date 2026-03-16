// EditorTabBar - VS Code 스타일 에디터 탭 바
// 터미널 탭(항상 첫 번째) + 파일 에디터 탭들
// dirty 상태: 흰 점 표시, hover 시 닫기 버튼

import { useState } from 'react';
import type { EditorTab } from '@shared/pane-types';

interface EditorTabBarProps {
  tabs: EditorTab[];
  activeTabId?: string;
  onSwitch: (editorTabId: string) => void;
  onClose: (editorTabId: string) => void;
}

export function EditorTabBar({ tabs, activeTabId, onSwitch, onClose }: EditorTabBarProps) {
  const [hoveredCloseId, setHoveredCloseId] = useState<string | null>(null);

  const handleClose = (tab: EditorTab, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tab.isDirty) {
      const confirmed = confirm(`"${tab.label}" 파일이 수정되었습니다. 저장하지 않고 닫으시겠습니까?`);
      if (!confirmed) return;
    }
    onClose(tab.id);
  };

  return (
    <div className="flex items-center bg-bg-secondary border-b border-border-default overflow-x-auto flex-shrink-0" style={{ height: 32 }}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isCloseHovered = hoveredCloseId === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSwitch(tab.id)}
            className={`group flex items-center gap-1.5 px-3 h-full text-xs border-r border-border-default transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-bg-primary text-text-primary border-b-2 border-b-accent'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            {tab.type === 'terminal' ? (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            <span>{tab.label}</span>
            {tab.type === 'file' && (
              <span
                onClick={(e) => handleClose(tab, e)}
                onMouseEnter={() => setHoveredCloseId(tab.id)}
                onMouseLeave={() => setHoveredCloseId(null)}
                className={`ml-1 w-4 h-4 flex items-center justify-center rounded hover:bg-bg-hover transition-colors ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {tab.isDirty && !isCloseHovered ? (
                  // dirty 상태: 흰 점 표시
                  <span className="w-2 h-2 rounded-full bg-text-primary" />
                ) : (
                  // 닫기 아이콘
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
