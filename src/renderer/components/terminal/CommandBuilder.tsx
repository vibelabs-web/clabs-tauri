// CLI Command Builder 모달 — GUI로 플래그를 조합하여 claude 명령어 생성

import React, { useState, useEffect, useMemo } from 'react';
import { CLI_FLAGS, CLI_FLAG_CATEGORIES } from '@shared/claude-cli';
import type { CLIFlag } from '@shared/claude-cli';
import { useModalStore } from '@renderer/stores/modal';

interface CommandBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (command: string) => void;
}

// 카테고리별 아이콘
const CategoryIcon: React.FC<{ category: string }> = ({ category }) => {
  const paths: Record<string, string> = {
    basic: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    session: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    output: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    security: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
    advanced: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
  };
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[category] || paths.basic} />
    </svg>
  );
};

// 접을 수 있는 섹션 (로컬)
const Section: React.FC<{
  title: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, defaultExpanded = true, children }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <div className="mb-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-1.5 text-left hover:text-accent transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
      </button>
      {expanded && <div className="mt-2 space-y-2 pl-2">{children}</div>}
    </div>
  );
};

export default function CommandBuilder({ isOpen, onClose, onExecute }: CommandBuilderProps) {
  // 플래그 상태: flag 문자열 → 값
  const [flagValues, setFlagValues] = useState<Record<string, string | boolean | number>>({});
  const [query, setQuery] = useState('');

  // ESC로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 모달이 열려있는 동안 alac NSView를 일시 hide.
  useEffect(() => {
    if (!isOpen) return;
    useModalStore.getState().open();
    return () => useModalStore.getState().close();
  }, [isOpen]);

  // 카테고리별 그룹화
  const grouped = useMemo(() => {
    const groups: Record<string, CLIFlag[]> = {};
    for (const f of CLI_FLAGS) {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    }
    return groups;
  }, []);

  // 명령어 미리보기 생성
  const preview = useMemo(() => {
    const parts = ['claude'];
    for (const f of CLI_FLAGS) {
      const val = flagValues[f.flag];
      if (val === undefined || val === false || val === '') continue;
      if (f.type === 'boolean' && val === true) {
        parts.push(f.flag);
      } else if (f.type === 'string' || f.type === 'enum') {
        parts.push(`${f.flag} ${JSON.stringify(val)}`);
      } else if (f.type === 'number' && val !== '' && val !== 0) {
        parts.push(`${f.flag} ${val}`);
      }
    }
    if (query.trim()) {
      parts.push(`"${query.trim()}"`);
    }
    return parts.join(' ');
  }, [flagValues, query]);

  const handleToggle = (flag: string) => {
    setFlagValues(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  const handleStringChange = (flag: string, value: string) => {
    setFlagValues(prev => ({ ...prev, [flag]: value }));
  };

  const handleNumberChange = (flag: string, value: string) => {
    const num = value === '' ? '' : Number(value);
    setFlagValues(prev => ({ ...prev, [flag]: num }));
  };

  const handleExecute = () => {
    onExecute(preview);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
    } catch {
      // 실패 시 무시
    }
  };

  const handleReset = () => {
    setFlagValues({});
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 모달 */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-bg-secondary border border-border-default rounded-xl shadow-2xl flex flex-col">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-sm font-semibold text-text-primary">CLI 명령어 빌더</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 카테고리별 플래그 */}
          {Object.entries(grouped).map(([cat, flags]) => (
            <Section
              key={cat}
              title={CLI_FLAG_CATEGORIES[cat as keyof typeof CLI_FLAG_CATEGORIES] || cat}
              icon={<CategoryIcon category={cat} />}
              defaultExpanded={cat === 'security' || cat === 'session'}
            >
              {flags.map((f) => (
                <div key={f.flag} className="flex items-center gap-3 py-1">
                  {f.type === 'boolean' ? (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={!!flagValues[f.flag]}
                          onChange={() => handleToggle(f.flag)}
                          className="w-4 h-4 rounded border-border-default text-accent focus:ring-accent bg-bg-tertiary"
                        />
                        <span className="font-mono text-xs text-text-primary">{f.flag}</span>
                        {f.alias && <span className="text-xs text-text-muted">({f.alias})</span>}
                      </label>
                      <span className="text-xs text-text-secondary">{f.description}</span>
                    </>
                  ) : f.type === 'enum' ? (
                    <>
                      <span className="font-mono text-xs text-text-primary min-w-[140px]">{f.flag}</span>
                      <select
                        value={(flagValues[f.flag] as string) || ''}
                        onChange={(e) => handleStringChange(f.flag, e.target.value)}
                        className="flex-1 px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded text-text-primary focus:outline-none focus:border-accent/50"
                      >
                        <option value="">선택 안 함</option>
                        {f.enumValues?.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                      <span className="text-xs text-text-secondary">{f.description}</span>
                    </>
                  ) : f.type === 'number' ? (
                    <>
                      <span className="font-mono text-xs text-text-primary min-w-[140px]">{f.flag}</span>
                      <input
                        type="number"
                        min={0}
                        value={(flagValues[f.flag] as number) ?? ''}
                        onChange={(e) => handleNumberChange(f.flag, e.target.value)}
                        placeholder="0"
                        className="w-20 px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded text-text-primary focus:outline-none focus:border-accent/50"
                      />
                      <span className="text-xs text-text-secondary">{f.description}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-xs text-text-primary min-w-[140px]">{f.flag}</span>
                      <input
                        type="text"
                        value={(flagValues[f.flag] as string) || ''}
                        onChange={(e) => handleStringChange(f.flag, e.target.value)}
                        placeholder={f.description}
                        className="flex-1 px-2 py-1 text-xs bg-bg-tertiary border border-border-default rounded text-text-primary focus:outline-none focus:border-accent/50"
                      />
                    </>
                  )}
                </div>
              ))}
            </Section>
          ))}

          {/* 쿼리 입력 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              프롬프트 (선택)
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="claude에게 전달할 프롬프트를 입력하세요..."
              className="w-full px-3 py-2 text-sm bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent/50 resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* 미리보기 + 액션 버튼 */}
        <div className="px-6 py-4 border-t border-border-default space-y-3">
          {/* 미리보기 */}
          <div className="bg-bg-primary rounded-lg p-3 border border-border-default">
            <p className="text-xs text-text-muted mb-1">미리보기</p>
            <code className="block font-mono text-sm text-accent break-all">{preview}</code>
          </div>

          {/* 버튼 */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              초기화
            </button>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors"
            >
              복사
            </button>
            <button
              onClick={handleExecute}
              className="px-4 py-1.5 text-xs font-semibold text-bg-primary bg-accent hover:bg-accent/80 rounded-lg transition-colors"
            >
              실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
