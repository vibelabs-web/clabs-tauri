// @TASK P2-S2-T1 - 한글 조합 지원 입력창 컴포넌트

import { useRef, useEffect, useState, useMemo, useCallback, KeyboardEvent, CompositionEvent, ChangeEvent } from 'react';
import { BUILTIN_COMMANDS } from '@shared/claude-cli';
import type { CommandHistoryEntry } from '@shared/claude-cli';

// ─────────────────────────────────────────────────────────────
// 드롭다운 아이템 타입 (통합)
// ─────────────────────────────────────────────────────────────

interface DropdownItem {
  label: string;
  description?: string;
  value: string; // 선택 시 입력값에 설정될 텍스트
  icon?: 'slash-builtin' | 'slash-skill' | 'folder' | 'file' | 'history';
}

type DropdownMode = 'slash' | 'path' | 'history' | null;

interface SlashCommand {
  command: string;
  description: string;
  type: 'builtin' | 'skill';
}

const BUILTIN_SLASH_COMMANDS: SlashCommand[] = BUILTIN_COMMANDS.map(cmd => ({
  ...cmd,
  type: 'builtin' as const,
}));

export interface InputBoxProps {
  onSubmit: (text: string) => void;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestion?: string;
  skillCommands?: { command: string; description: string }[];
  onEscape?: () => void;
  onRawKey?: (key: string) => void;
  activePaneId?: string;
}

export function InputBox({
  onSubmit,
  value,
  onChange,
  disabled = false,
  placeholder,
  suggestion,
  skillCommands = [],
  onEscape,
  onRawKey,
  activePaneId,
}: InputBoxProps) {
  const isComposingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 통합 드롭다운 상태
  const [dropdownMode, setDropdownMode] = useState<DropdownMode>(null);
  const [dropdownItems, setDropdownItems] = useState<DropdownItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 경로 완성용: 원래 입력값의 접두사 (드롭다운 선택 시 조합용)
  const pathPrefixRef = useRef('');

  // 명령어 히스토리
  const [historyList, setHistoryList] = useState<CommandHistoryEntry[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (window.api?.commandHistory?.list) {
          const history = await window.api.commandHistory.list();
          setHistoryList(history);
        }
      } catch { /* ignore */ }
    };
    loadHistory();
  }, []);

  // 슬래시 명령어 통합
  const allCommands = useMemo<SlashCommand[]>(() => {
    const skillCmds = skillCommands.map(s => ({ ...s, type: 'skill' as const }));
    const skillCommandSet = new Set(skillCmds.map(s => s.command));
    const uniqueBuiltins = BUILTIN_SLASH_COMMANDS.filter(cmd => !skillCommandSet.has(cmd.command));
    return [...skillCmds, ...uniqueBuiltins];
  }, [skillCommands]);

  // "/" 입력 시 슬래시 명령어 드롭다운
  useEffect(() => {
    if (value.startsWith('/')) {
      const query = value.toLowerCase();
      const filtered = allCommands.filter(cmd =>
        cmd.command.toLowerCase().startsWith(query)
      );
      if (filtered.length > 0 && value !== filtered[0]?.command) {
        setDropdownItems(filtered.map(cmd => ({
          label: cmd.command,
          description: cmd.description,
          value: cmd.command + ' ',
          icon: cmd.type === 'builtin' ? 'slash-builtin' : 'slash-skill',
        })));
        setDropdownMode('slash');
        setSelectedIndex(0);
      } else {
        closeDropdown();
      }
    } else if (dropdownMode === 'slash') {
      closeDropdown();
    }
  }, [value, allCommands]);

  // 외부에서 value가 변경되면 포커스
  useEffect(() => {
    if (value && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [value]);

  // 클릭 외부 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeDropdown = useCallback(() => {
    setDropdownMode(null);
    setDropdownItems([]);
    setSelectedIndex(0);
  }, []);

  const selectItem = useCallback((item: DropdownItem) => {
    onChange(item.value);
    closeDropdown();
    textareaRef.current?.focus();
  }, [onChange, closeDropdown]);

  const handleCompositionStart = () => { isComposingRef.current = true; };
  const handleCompositionEnd = () => { isComposingRef.current = false; };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // ─────────────────────────────────────────────────────────────
  // 경로 탭 자동완성
  // ─────────────────────────────────────────────────────────────
  const handlePathCompletion = useCallback(async () => {
    if (!window.api?.pty?.getCwd || !window.api?.fs?.listDir) return;

    const parts = value.split(/\s+/);
    const lastToken = parts[parts.length - 1] || '';
    const cmdPrefix = parts.slice(0, -1).join(' ');

    const lastSlash = lastToken.lastIndexOf('/');
    let searchDir: string;
    let filePrefix: string;
    let tokenBase: string;

    const paneId = activePaneId || 'pane-default';
    let cwd: string;
    try {
      cwd = await window.api.pty.getCwd(paneId);
    } catch { return; }

    if (lastSlash >= 0) {
      const dirPart = lastToken.substring(0, lastSlash) || '/';
      filePrefix = lastToken.substring(lastSlash + 1);
      tokenBase = lastToken.substring(0, lastSlash + 1);
      searchDir = dirPart.startsWith('/') ? dirPart : `${cwd}/${dirPart}`;
    } else {
      searchDir = cwd;
      filePrefix = lastToken;
      tokenBase = '';
    }

    if (!filePrefix) return;

    try {
      const entries = await window.api.fs.listDir(searchDir);
      const matches = entries.filter(e =>
        e.name.toLowerCase().startsWith(filePrefix.toLowerCase())
      );

      if (matches.length === 1) {
        // 유일한 매치 → 즉시 완성
        const m = matches[0];
        const completed = m.name + (m.is_dir ? '/' : ' ');
        const newValue = cmdPrefix
          ? `${cmdPrefix} ${tokenBase}${completed}`
          : `${tokenBase}${completed}`;
        onChange(newValue);
      } else if (matches.length > 1) {
        // 공통 접두사 완성
        let common = matches[0].name;
        for (let i = 1; i < matches.length; i++) {
          const name = matches[i].name;
          let j = 0;
          while (j < common.length && j < name.length && common[j].toLowerCase() === name[j].toLowerCase()) j++;
          common = common.substring(0, j);
        }
        if (common.length > filePrefix.length) {
          const newValue = cmdPrefix
            ? `${cmdPrefix} ${tokenBase}${common}`
            : `${tokenBase}${common}`;
          onChange(newValue);
        }

        // 드롭다운에 매치 목록 표시
        pathPrefixRef.current = cmdPrefix ? `${cmdPrefix} ${tokenBase}` : tokenBase;
        setDropdownItems(matches.map(m => ({
          label: m.name,
          description: m.is_dir ? '폴더' : '파일',
          value: `${pathPrefixRef.current}${m.name}${m.is_dir ? '/' : ' '}`,
          icon: m.is_dir ? 'folder' : 'file',
        })));
        setDropdownMode('path');
        setSelectedIndex(0);
      }
    } catch { /* ignore */ }
  }, [value, activePaneId, onChange]);

  // ─────────────────────────────────────────────────────────────
  // 히스토리 드롭다운 열기
  // ─────────────────────────────────────────────────────────────
  const openHistoryDropdown = useCallback(() => {
    if (historyList.length === 0) return;

    // 중복 제거 (최근 것만 유지)
    const seen = new Set<string>();
    const unique: CommandHistoryEntry[] = [];
    for (const entry of historyList) {
      if (!seen.has(entry.command)) {
        seen.add(entry.command);
        unique.push(entry);
      }
    }

    setDropdownItems(unique.slice(0, 20).map(entry => ({
      label: entry.command,
      description: formatTimeAgo(entry.timestamp),
      value: entry.command,
      icon: 'history',
    })));
    setDropdownMode('history');
    setSelectedIndex(0);
  }, [historyList]);

  // ─────────────────────────────────────────────────────────────
  // 키보드 핸들러
  // ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    // 드롭다운 열려있을 때 네비게이션
    if (dropdownMode && dropdownItems.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, dropdownItems.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        selectItem(dropdownItems[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDropdown();
        return;
      }
    }

    // ESC 키: PTY에 전달
    if (e.key === 'Escape' && !dropdownMode && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    // 위쪽 화살표: 히스토리 드롭다운 열기
    if (e.key === 'ArrowUp' && !dropdownMode) {
      e.preventDefault();
      openHistoryDropdown();
      return;
    }

    // 입력값이 비어있을 때 방향키/엔터를 PTY로 직접 전달
    if (!value && !dropdownMode && onRawKey) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onRawKey('\x1b[B');
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
        e.preventDefault();
        onRawKey('\r');
        return;
      }
    }

    // Tab 키
    if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) {
        onChange(suggestion);
      } else if (value && !value.startsWith('/')) {
        handlePathCompletion();
      }
      return;
    }

    if (e.key === 'Enter') {
      if (e.shiftKey) return;
      if (isComposingRef.current) return;
      e.preventDefault();
      handleSubmitClick();
    }
  };

  const handleSubmitClick = () => {
    if (disabled) return;
    const trimmedText = value.trim();
    if (trimmedText === '') return;

    onSubmit(trimmedText);
    onChange('');
    closeDropdown();

    // 히스토리 새로고침
    if (window.api?.commandHistory?.list) {
      window.api.commandHistory.list().then(setHistoryList).catch(() => {});
    }
  };

  const canSubmit = !disabled && value.trim() !== '';
  const showSuggestion = !value && suggestion;

  // 확장 모달 상태
  const [showExpandModal, setShowExpandModal] = useState(false);
  const [expandedValue, setExpandedValue] = useState('');
  const expandTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleOpenExpand = useCallback(() => {
    setExpandedValue(value);
    setShowExpandModal(true);
    setTimeout(() => expandTextareaRef.current?.focus(), 100);
  }, [value]);

  const handleExpandSubmit = useCallback(() => {
    const trimmed = expandedValue.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    onChange('');
    setShowExpandModal(false);
    setExpandedValue('');
  }, [expandedValue, disabled, onSubmit, onChange]);

  const handleExpandKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onChange(expandedValue);
      setShowExpandModal(false);
      return;
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleExpandSubmit();
    }
  }, [expandedValue, onChange, handleExpandSubmit]);

  // ─────────────────────────────────────────────────────────────
  // 드롭다운 아이콘
  // ─────────────────────────────────────────────────────────────
  const renderIcon = (icon?: DropdownItem['icon']) => {
    switch (icon) {
      case 'folder':
        return (
          <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'file':
        return (
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'history':
        return (
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'slash-builtin':
        return <span className="w-4 text-center text-blue-400 text-xs font-bold flex-shrink-0">/</span>;
      case 'slash-skill':
        return <span className="w-4 text-center text-accent text-xs font-bold flex-shrink-0">/</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative" ref={dropdownRef}>
        {/* 통합 드롭다운 */}
        {dropdownMode && dropdownItems.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 max-h-72 overflow-y-auto bg-bg-tertiary border border-border-default rounded-lg shadow-lg z-50">
            {/* 헤더 */}
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-text-muted border-b border-border-default sticky top-0 bg-bg-tertiary">
              {dropdownMode === 'slash' && '명령어'}
              {dropdownMode === 'path' && '경로 자동완성'}
              {dropdownMode === 'history' && '명령어 기록'}
            </div>
            {dropdownItems.map((item, index) => (
              <button
                key={`${dropdownMode}-${index}`}
                type="button"
                onClick={() => selectItem(item)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-bg-hover transition-colors ${
                  index === selectedIndex ? 'bg-bg-hover' : ''
                }`}
              >
                {renderIcon(item.icon)}
                <span className="font-mono text-sm text-text-primary truncate">
                  {item.label}
                </span>
                {item.description && (
                  <span className="ml-auto text-xs text-text-muted truncate flex-shrink-0">
                    {item.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 고스트 텍스트 (제안) */}
        {showSuggestion && (
          <div className="absolute inset-0 px-3 py-2 pointer-events-none font-mono text-sm text-text-disabled truncate">
            {suggestion}
            <span className="ml-2 text-xs text-accent/50">[Tab]</span>
          </div>
        )}
        <textarea
          ref={textareaRef}
          data-testid="input-box"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          disabled={disabled}
          placeholder={showSuggestion ? '' : placeholder}
          aria-label="명령어 입력창"
          className="w-full min-h-[40px] max-h-[120px] px-3 py-2 pr-10 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none font-mono text-sm transition-colors duration-200"
          style={{ background: 'transparent' }}
          rows={1}
        />
        {/* 확장 버튼 */}
        <button
          type="button"
          onClick={handleOpenExpand}
          disabled={disabled}
          aria-label="입력창 확장"
          title="입력창 확장 (긴 텍스트 입력)"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors disabled:opacity-30"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9" />
            <polyline points="9 21 3 21 3 15" />
            <line x1="21" y1="3" x2="14" y2="10" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        onClick={handleSubmitClick}
        disabled={!canSubmit}
        aria-label="전송"
        className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-accent hover:bg-accent/80 disabled:bg-bg-tertiary disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
      >
        <svg
          className="w-5 h-5 text-bg-primary disabled:text-text-disabled"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </button>

      {/* 확장 입력 모달 */}
      {showExpandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { onChange(expandedValue); setShowExpandModal(false); }}
          />
          <div className="relative w-full max-w-2xl mx-4 bg-bg-secondary rounded-xl shadow-xl border border-bg-tertiary overflow-hidden">
            <div className="px-4 py-3 border-b border-bg-tertiary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span className="text-sm font-medium text-text-primary">확장 입력</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter로 전송 · ESC로 닫기
                </span>
                <button
                  onClick={() => { onChange(expandedValue); setShowExpandModal(false); }}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                ref={expandTextareaRef}
                value={expandedValue}
                onChange={(e) => setExpandedValue(e.target.value)}
                onKeyDown={handleExpandKeyDown}
                placeholder="긴 명령어나 프롬프트를 입력하세요..."
                className="w-full h-64 px-4 py-3 bg-bg-primary border border-border-default rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent/50 resize-none font-mono text-sm leading-relaxed"
                autoFocus
              />
            </div>
            <div className="px-4 py-3 border-t border-bg-tertiary flex items-center justify-between">
              <span className="text-xs text-text-muted">{expandedValue.length}자</span>
              <button
                onClick={handleExpandSubmit}
                disabled={!expandedValue.trim() || disabled}
                className="px-4 py-2 bg-accent hover:bg-accent/80 disabled:bg-bg-tertiary disabled:cursor-not-allowed rounded-lg text-sm font-medium text-bg-primary transition-colors"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 상대 시간 포맷
function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  if (hr < 24) return `${hr}시간 전`;
  return `${day}일 전`;
}
