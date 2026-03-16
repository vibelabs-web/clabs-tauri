// 터미널 검색 바 오버레이 컴포넌트 (Cmd+F)

import React, { useRef, useEffect, useState } from 'react';

interface TerminalSearchBarProps {
  visible: boolean;
  onClose: () => void;
  onSearchNext: (query: string) => void;
  onSearchPrev: (query: string) => void;
}

export const TerminalSearchBar: React.FC<TerminalSearchBarProps> = ({
  visible,
  onClose,
  onSearchNext,
  onSearchPrev,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [visible]);

  if (!visible) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        onSearchPrev(query);
      } else {
        onSearchNext(query);
      }
    }
  };

  return (
    <div className="absolute top-2 right-2 z-50 flex items-center gap-1 bg-bg-secondary border border-border-default rounded-lg px-2 py-1.5 shadow-lg">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value) onSearchNext(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder="검색..."
        className="w-48 bg-bg-tertiary text-text-primary text-sm px-2 py-1 rounded border border-border-default focus:outline-none focus:border-accent"
      />
      {/* 이전 (Shift+Enter) */}
      <button
        onClick={() => onSearchPrev(query)}
        className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
        title="이전 (Shift+Enter)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      {/* 다음 (Enter) */}
      <button
        onClick={() => onSearchNext(query)}
        className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
        title="다음 (Enter)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {/* 닫기 (ESC) */}
      <button
        onClick={onClose}
        className="p-1 text-text-secondary hover:text-text-primary rounded hover:bg-bg-hover transition-colors"
        title="닫기 (ESC)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
