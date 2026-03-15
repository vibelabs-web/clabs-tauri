// PaneHeader - 패인 헤더 (이름, 분할/닫기 버튼)

import { useState, useRef, useEffect, useCallback } from 'react';

export interface PaneHeaderProps {
  name: string;
  isActive: boolean;
  canClose: boolean;
  onSplitHorizontal: () => void;
  onSplitVertical: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
  onClick: () => void;
}

export function PaneHeader({
  name,
  isActive,
  canClose,
  onSplitHorizontal,
  onSplitVertical,
  onClose,
  onRename,
  onClick,
}: PaneHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setEditValue(name);
    setIsEditing(true);
  }, [name]);

  const handleSubmit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editValue, name, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(name);
      setIsEditing(false);
    }
  }, [handleSubmit, name]);

  return (
    <div
      className={`flex items-center h-7 px-2 bg-bg-secondary text-text-secondary text-xs select-none ${
        isActive ? 'border-b-2 border-accent' : 'border-b border-border-default'
      }`}
      onClick={onClick}
    >
      {/* 패인 이름 */}
      <div className="flex-1 min-w-0 truncate">
        {isEditing ? (
          <input
            ref={inputRef}
            className="w-full bg-bg-primary text-text-primary text-xs px-1 py-0 rounded outline-none border border-accent"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span
            className="cursor-default"
            onDoubleClick={handleDoubleClick}
          >
            {name}
          </span>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="flex items-center gap-0.5 ml-1">
        {/* 오른쪽 분할 (vertical split) — 세로선으로 좌우 분할 */}
        <button
          className="p-0.5 rounded hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-colors"
          onClick={e => { e.stopPropagation(); onSplitVertical(); }}
          title="오른쪽 분할"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
            <line x1="12" y1="3" x2="12" y2="21" strokeWidth={2} />
          </svg>
        </button>

        {/* 아래쪽 분할 (horizontal split) — 가로선으로 상하 분할 */}
        <button
          className="p-0.5 rounded hover:bg-bg-hover text-text-tertiary hover:text-text-primary transition-colors"
          onClick={e => { e.stopPropagation(); onSplitHorizontal(); }}
          title="아래쪽 분할"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
            <line x1="3" y1="12" x2="21" y2="12" strokeWidth={2} />
          </svg>
        </button>

        {/* 닫기 */}
        {canClose && (
          <button
            className="p-0.5 rounded hover:bg-red-500/20 text-text-tertiary hover:text-red-400 transition-colors"
            onClick={e => { e.stopPropagation(); onClose(); }}
            title="패인 닫기"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
