// ToolbarBar - TitleBar 아래 바로가기 칩 바

import React, { useEffect } from 'react';
import { useToolbarStore } from '@renderer/stores/toolbar';
import type { ToolbarShortcut } from '@shared/types';

interface ToolbarBarProps {
  onExecute: (command: string) => void;
}

const categoryColors: Record<string, string> = {
  '기획': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  '디자인': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  '개발': 'bg-green-500/20 text-green-400 border-green-500/30',
  '검증': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  '도구': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  '에이전트': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  '문서화': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  builtin: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  quick: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

function chipStyle(category?: string): string {
  return categoryColors[category || ''] || 'bg-accent/15 text-accent border-accent/30';
}

const ToolbarBar: React.FC<ToolbarBarProps> = ({ onExecute }) => {
  const { shortcuts, removeShortcut, loadFromConfig } = useToolbarStore();

  useEffect(() => {
    loadFromConfig();
  }, [loadFromConfig]);

  if (shortcuts.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 h-8 bg-bg-secondary border-b border-border-default overflow-x-auto flex-shrink-0">
      {shortcuts.map((sc: ToolbarShortcut) => (
        <button
          key={sc.command}
          onClick={() => onExecute(sc.command)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono rounded border whitespace-nowrap hover:brightness-125 transition-all ${chipStyle(sc.category)}`}
          title={sc.label}
        >
          {sc.command}
          <span
            role="button"
            aria-label={`${sc.label} 바로가기 제거`}
            onClick={(e) => {
              e.stopPropagation();
              removeShortcut(sc.command);
            }}
            className="ml-0.5 opacity-50 hover:opacity-100 cursor-pointer"
          >
            &times;
          </span>
        </button>
      ))}
    </div>
  );
};

export default ToolbarBar;
