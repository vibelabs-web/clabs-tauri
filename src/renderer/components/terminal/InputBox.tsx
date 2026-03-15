// @TASK P2-S2-T1 - 한글 조합 지원 입력창 컴포넌트

import { useRef, useEffect, useState, useMemo, KeyboardEvent, CompositionEvent, ChangeEvent } from 'react';
import { BUILTIN_COMMANDS } from '@shared/claude-cli';
import type { CommandHistoryEntry } from '@shared/claude-cli';

// ─────────────────────────────────────────────────────────────
// 슬래시 명령어 타입 (드롭다운용)
// ─────────────────────────────────────────────────────────────

interface SlashCommand {
  command: string;
  description: string;
  type: 'builtin' | 'skill';
}

// BUILTIN_COMMANDS에 type 필드 추가
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
  /** 스킬팩 명령어 목록 (외부에서 전달) */
  skillCommands?: { command: string; description: string }[];
  /** ESC 키 핸들러 (Claude Code 중단 등) */
  onEscape?: () => void;
  /** 방향키/엔터를 PTY로 직접 전달 (AskUserQuestion 지원) */
  onRawKey?: (key: string) => void;
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
  onRawKey
}: InputBoxProps) {
  const isComposingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);

  // 명령어 히스토리 상태
  const [historyList, setHistoryList] = useState<CommandHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const savedInputRef = useRef('');

  // 히스토리 로드
  useEffect(() => {
    const loadHistory = async () => {
      try {
        if (window.api?.commandHistory?.list) {
          const history = await window.api.commandHistory.list();
          setHistoryList(history);
        }
      } catch {
        // 히스토리 로드 실패 시 무시
      }
    };
    loadHistory();
  }, []);

  // 모든 명령어 합치기 (스킬 + 기본) - 중복 제거, 스킬 우선
  const allCommands = useMemo<SlashCommand[]>(() => {
    const skillCmds = skillCommands.map(s => ({ ...s, type: 'skill' as const }));
    const skillCommandSet = new Set(skillCmds.map(s => s.command));
    // 스킬과 중복되지 않는 기본 명령어만 포함
    const uniqueBuiltins = BUILTIN_SLASH_COMMANDS.filter(cmd => !skillCommandSet.has(cmd.command));
    return [...skillCmds, ...uniqueBuiltins];
  }, [skillCommands]);

  // 입력값이 "/" 로 시작하면 명령어 필터링
  useEffect(() => {
    if (value.startsWith('/')) {
      const query = value.toLowerCase();
      const filtered = allCommands.filter(cmd =>
        cmd.command.toLowerCase().startsWith(query)
      );
      setFilteredCommands(filtered);
      setShowDropdown(filtered.length > 0 && value !== filtered[0]?.command);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
      setFilteredCommands([]);
    }
  }, [value, skillCommands]);

  // 외부에서 value가 변경되면 포커스
  useEffect(() => {
    if (value && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [value]);

  // 클릭 외부 감지로 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCompositionStart = (_e: CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (_e: CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // 입력이 변경되면 히스토리 인덱스 초기화
    setHistoryIndex(-1);
  };

  const selectCommand = (command: string) => {
    onChange(command + ' ');
    setShowDropdown(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;

    // 드롭다운 열려있을 때 키보드 네비게이션
    if (showDropdown && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        selectCommand(filteredCommands[selectedIndex].command);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }

    // ESC 키: 드롭다운이 닫혀있을 때 PTY로 전달 (Claude Code 중단)
    if (e.key === 'Escape' && !showDropdown && onEscape) {
      e.preventDefault();
      onEscape();
      return;
    }

    // 입력값이 비어있을 때 Up/Down arrow로 히스토리 리콜
    if (!value && !showDropdown && historyList.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex === -1) {
          // 처음 Up: 현재 입력 저장 후 히스토리 첫 번째 항목
          savedInputRef.current = value;
          setHistoryIndex(0);
          onChange(historyList[0].command);
        } else if (historyIndex < historyList.length - 1) {
          // 다음 히스토리 항목
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          onChange(historyList[newIndex].command);
        }
        return;
      }
    }

    // 히스토리 탐색 중 Down arrow
    if (historyIndex >= 0 && e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        onChange(historyList[newIndex].command);
      } else {
        // 히스토리 끝 → 원래 입력 복원
        setHistoryIndex(-1);
        onChange(savedInputRef.current);
      }
      return;
    }

    // 히스토리 탐색 중 Up arrow (value가 있는 경우)
    if (historyIndex >= 0 && e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < historyList.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        onChange(historyList[newIndex].command);
      }
      return;
    }

    // 입력값이 비어있을 때 방향키/엔터를 PTY로 직접 전달 (AskUserQuestion 지원)
    // 히스토리 탐색 중이 아닐 때만
    if (!value && !showDropdown && onRawKey && historyIndex === -1) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        onRawKey('\x1b[A'); // ESC [ A
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onRawKey('\x1b[B'); // ESC [ B
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && !isComposingRef.current) {
        e.preventDefault();
        onRawKey('\r'); // Carriage return
        return;
      }
    }

    // Tab 키로 제안 수락
    if (e.key === 'Tab' && suggestion && !value) {
      e.preventDefault();
      onChange(suggestion);
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
    console.log('[InputBox] handleSubmitClick called, disabled:', disabled, 'value:', value);

    if (disabled) {
      console.log('[InputBox] Input is disabled, ignoring');
      return;
    }

    const trimmedText = value.trim();
    if (trimmedText === '') {
      console.log('[InputBox] Empty text, ignoring');
      return;
    }

    console.log('[InputBox] Calling onSubmit with:', trimmedText);
    onSubmit(trimmedText);
    onChange('');
    setShowDropdown(false);
    setHistoryIndex(-1);
  };

  const canSubmit = !disabled && value.trim() !== '';

  // 제안 표시 여부 (입력값이 없고 제안이 있을 때)
  const showSuggestion = !value && suggestion;

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative" ref={dropdownRef}>
        {/* 슬래시 명령어 드롭다운 */}
        {showDropdown && (
          <div className="absolute bottom-full left-0 right-0 mb-1 max-h-64 overflow-y-auto bg-bg-tertiary border border-border-default rounded-lg shadow-lg z-50">
            {filteredCommands.map((cmd, index) => (
              <button
                key={`${cmd.type}-${cmd.command}`}
                type="button"
                onClick={() => selectCommand(cmd.command)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-bg-hover transition-colors ${
                  index === selectedIndex ? 'bg-bg-hover' : ''
                }`}
              >
                <span className={`font-mono text-sm font-semibold ${
                  cmd.type === 'builtin' ? 'text-blue-400' : 'text-accent'
                }`}>
                  {cmd.command}
                </span>
                <span className="text-xs text-text-secondary truncate">
                  {cmd.description}
                </span>
                {cmd.type === 'builtin' && (
                  <span className="ml-auto text-xs text-blue-400/50 px-1.5 py-0.5 bg-blue-400/10 rounded">
                    기본
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
          className="w-full min-h-[40px] max-h-[120px] px-3 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none font-mono text-sm transition-colors duration-200"
          style={{ background: 'transparent' }}
          rows={1}
        />
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </button>
    </div>
  );
}
