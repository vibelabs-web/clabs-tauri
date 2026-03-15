// @TASK P2-S3-T1 - SkillPanel 컴포넌트 (다크 테마 + 그룹화 + MCP)
// @SPEC Worktree Phase 2 - 워크플로우, 추천, 스킬 버튼 표시 패널

import React, { useState, useEffect } from 'react';
import type { SkillInfo, MCPServer } from '@shared/types';
import {
  BUILTIN_COMMANDS,
  BUNDLED_SKILLS,
  QUICK_ACTIONS,
  QUICK_ACTION_CATEGORIES,
} from '@shared/claude-cli';
import type { QuickAction, BundledSkill, CommandHistoryEntry } from '@shared/claude-cli';
import type {
  WorkflowStep,
  Recommendation,
} from '../../types/skill-panel';
import { useToolbarStore } from '@renderer/stores/toolbar';

// ─────────────────────────────────────────────────────────────
// 아이콘 컴포넌트
// ─────────────────────────────────────────────────────────────

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const SkillIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const MCPIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
  </svg>
);

const CommandIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const RocketIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
  </svg>
);

const QuickActionIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const HistoryIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BundleIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const BuilderIcon: React.FC = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// 바로가기 핀 버튼
const PinButton: React.FC<{ pinned: boolean; onToggle: (e: React.MouseEvent) => void }> = ({ pinned, onToggle }) => (
  <button
    onClick={onToggle}
    className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded transition-colors ${
      pinned ? 'text-yellow-400' : 'text-text-muted opacity-0 group-hover:opacity-100 hover:text-yellow-400'
    }`}
    aria-label={pinned ? '바로가기 제거' : '바로가기 추가'}
    title={pinned ? '바로가기 제거' : '바로가기 추가'}
  >
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />
    </svg>
  </button>
);

// ─────────────────────────────────────────────────────────────
// 퀵 액션 아이콘 매핑
// ─────────────────────────────────────────────────────────────

const ActionIcon: React.FC<{ icon: QuickAction['icon'] }> = ({ icon }) => {
  switch (icon) {
    case 'rocket': return <RocketIcon />;
    case 'bug': return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
    case 'gear': return <BuilderIcon />;
    case 'terminal':
    default: return <CommandIcon />;
  }
};

// ─────────────────────────────────────────────────────────────
// 워크플로우 상태별 스타일 (다크 테마)
// ─────────────────────────────────────────────────────────────

const workflowStatusStyles = {
  completed: 'border-l-accent text-accent',
  active: 'border-l-accent text-text-primary bg-accent/10',
  pending: 'border-l-text-muted text-text-secondary',
};

// ─────────────────────────────────────────────────────────────
// 하위 컴포넌트
// ─────────────────────────────────────────────────────────────

// 워크플로우 단계 컴포넌트
const WorkflowStepItem: React.FC<{ step: WorkflowStep }> = ({ step }) => {
  const statusStyle = workflowStatusStyles[step.status];

  return (
    <div
      data-status={step.status}
      className={`workflow-step px-3 py-2 rounded border-l-2 bg-bg-tertiary/50 ${statusStyle} transition-colors`}
      role="listitem"
    >
      <span className="font-mono text-sm">{step.title}</span>
    </div>
  );
};

// 추천 카드 컴포넌트
const RecommendationCard: React.FC<{ recommendation: Recommendation }> = ({
  recommendation,
}) => {
  return (
    <div className="recommendation-card bg-accent/10 border border-accent/30 rounded-lg p-3">
      <h3 className="text-sm font-semibold text-accent mb-1">
        {recommendation.title}
      </h3>
      <p className="text-xs text-text-secondary">{recommendation.description}</p>
    </div>
  );
};

// 기본 명령어 버튼 컴포넌트
const CommandButtonItem: React.FC<{ command: { command: string; description: string }; onClick?: () => void; pinned?: boolean; onTogglePin?: (e: React.MouseEvent) => void }> = ({ command, onClick, pinned, onTogglePin }) => {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="command-button w-full text-left px-3 py-2 pr-8 bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-tertiary/80 hover:border-blue-500/30 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        aria-label={`${command.command} - ${command.description}`}
      >
        <span className="block font-mono text-sm font-semibold text-blue-400">
          {command.command}
        </span>
        <span className="block text-xs text-text-secondary mt-0.5 truncate">
          {command.description}
        </span>
      </button>
      {onTogglePin && (
        <div className="absolute right-1.5 top-1.5">
          <PinButton pinned={!!pinned} onToggle={onTogglePin} />
        </div>
      )}
    </div>
  );
};

// 빠른 실행 버튼 컴포넌트
const QuickActionButton: React.FC<{ action: QuickAction; onClick?: () => void; pinned?: boolean; onTogglePin?: (e: React.MouseEvent) => void }> = ({ action, onClick, pinned, onTogglePin }) => {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="quick-action-button w-full text-left px-3 py-3 pr-8 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-lg hover:from-emerald-500/30 hover:to-cyan-500/30 hover:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
        aria-label={`${action.label} - ${action.description}`}
      >
        <div className="flex items-center gap-2">
          <ActionIcon icon={action.icon} />
          <span className="font-semibold text-sm text-emerald-400">
            {action.label}
          </span>
        </div>
        <span className="block text-xs text-text-secondary mt-1 truncate">
          {action.description}
        </span>
        <span className="block font-mono text-xs text-text-muted mt-1 truncate">
          {action.command}
        </span>
      </button>
      {onTogglePin && (
        <div className="absolute right-1.5 top-1.5">
          <PinButton pinned={!!pinned} onToggle={onTogglePin} />
        </div>
      )}
    </div>
  );
};

// 스킬 버튼 컴포넌트
const SkillButtonItem: React.FC<{ skill: SkillInfo; onClick?: () => void; pinned?: boolean; onTogglePin?: (e: React.MouseEvent) => void }> = ({ skill, onClick, pinned, onTogglePin }) => {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="skill-button w-full text-left px-3 py-2 pr-8 bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-tertiary/80 hover:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent transition-all"
        aria-label={`${skill.trigger} - ${skill.description}`}
      >
        <span className="block font-mono text-sm font-semibold text-accent">
          /{skill.trigger}
        </span>
        <span className="skill-description block text-xs text-text-secondary mt-0.5 truncate">
          {skill.description}
        </span>
      </button>
      {onTogglePin && (
        <div className="absolute right-1.5 top-1.5">
          <PinButton pinned={!!pinned} onToggle={onTogglePin} />
        </div>
      )}
    </div>
  );
};

// 번들 스킬 버튼 컴포넌트
const BundledSkillButton: React.FC<{ skill: BundledSkill; onClick?: () => void; pinned?: boolean; onTogglePin?: (e: React.MouseEvent) => void }> = ({ skill, onClick, pinned, onTogglePin }) => {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="w-full text-left px-3 py-2 pr-8 bg-gradient-to-r from-indigo-500/15 to-violet-500/15 border border-indigo-500/25 rounded-lg hover:from-indigo-500/25 hover:to-violet-500/25 hover:border-indigo-500/40 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
        aria-label={`${skill.command} - ${skill.description}`}
      >
        <span className="block font-mono text-sm font-semibold text-indigo-400">
          {skill.command}
        </span>
        <span className="block text-xs text-text-secondary mt-0.5 truncate">
          {skill.description}
        </span>
      </button>
      {onTogglePin && (
        <div className="absolute right-1.5 top-1.5">
          <PinButton pinned={!!pinned} onToggle={onTogglePin} />
        </div>
      )}
    </div>
  );
};

// MCP 서버 아이템 컴포넌트
const MCPServerItem: React.FC<{ server: MCPServer }> = ({ server }) => {
  return (
    <div className="mcp-server px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            server.status === 'configured' ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        />
        <span className="font-mono text-sm text-text-primary">{server.name}</span>
      </div>
      {server.command && (
        <span className="block text-xs text-text-muted mt-1 truncate">
          {server.command}
        </span>
      )}
    </div>
  );
};

// 접을 수 있는 섹션 컴포넌트
const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  count?: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, count, defaultExpanded = true, children }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="collapsible-section">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-1.5 text-left hover:text-accent transition-colors"
      >
        <ChevronIcon expanded={expanded} />
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider flex-1">
          {title}
        </span>
        {count !== undefined && (
          <span className="text-xs text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded">
            {count}
          </span>
        )}
      </button>
      {expanded && <div className="mt-2 ml-5 space-y-1.5">{children}</div>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 메인 SkillPanel 컴포넌트
// ─────────────────────────────────────────────────────────────

interface SkillPanelProps {
  workflow?: WorkflowStep[];
  recommendation?: Recommendation;
  onSkillSelect?: (command: string) => void;
  onOpenCommandBuilder?: () => void;
}

export const SkillPanel: React.FC<SkillPanelProps> = ({
  workflow = [],
  recommendation,
  onSkillSelect,
  onOpenCommandBuilder,
}) => {
  const [categorizedSkills, setCategorizedSkills] = useState<Record<string, SkillInfo[]>>({});
  const [mcpServers, setMCPServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [commandHistory, setCommandHistory] = useState<CommandHistoryEntry[]>([]);
  const { addShortcut, removeShortcut, hasShortcut } = useToolbarStore();

  // 스킬과 MCP 정보 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        // 스킬 목록 로드
        if (window.api?.skills?.categorized) {
          const skills = await window.api.skills.categorized();
          setCategorizedSkills(skills);
        }

        // MCP 서버 목록 로드
        if (window.api?.mcp?.list) {
          const servers = await window.api.mcp.list();
          setMCPServers(servers);
        }

        // 명령어 히스토리 로드
        if (window.api?.commandHistory?.list) {
          const history = await window.api.commandHistory.list();
          setCommandHistory(history);
        }
      } catch (error) {
        console.error('Failed to load skills/MCP data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 히스토리 삭제
  const handleClearHistory = async () => {
    try {
      if (window.api?.commandHistory?.clear) {
        await window.api.commandHistory.clear();
        setCommandHistory([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  // 히스토리 단일 삭제
  const handleRemoveHistory = async (command: string) => {
    try {
      if (window.api?.commandHistory?.remove) {
        await window.api.commandHistory.remove(command);
        setCommandHistory((prev) => prev.filter((h) => h.command !== command));
      }
    } catch (error) {
      console.error('Failed to remove history entry:', error);
    }
  };

  // 스킬 클릭 핸들러 - 입력창에 명령어 설정
  const handleSkillClick = (skill: SkillInfo) => {
    if (onSkillSelect) {
      onSkillSelect(`/${skill.trigger}`);
    }
  };

  // 바로가기 핀 토글
  const togglePin = (command: string, label: string, category?: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasShortcut(command)) {
      removeShortcut(command);
    } else {
      addShortcut({ command, label, category });
    }
  };

  // 카테고리별 스킬 수 계산
  const totalSkills = Object.values(categorizedSkills).reduce(
    (sum, skills) => sum + skills.length,
    0
  );

  // 카테고리 정렬 순서
  const categoryOrder = ['기획', '디자인', '개발', '검증', '도구', '에이전트', '문서화', '기타'];

  // 정렬된 카테고리 목록
  const sortedCategories = Object.entries(categorizedSkills).sort(([a], [b]) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    // 목록에 없는 카테고리는 마지막에
    const orderA = indexA === -1 ? 999 : indexA;
    const orderB = indexB === -1 ? 999 : indexB;
    return orderA - orderB;
  });

  // 퀵 액션 카테고리별 그룹화
  const groupedActions = QUICK_ACTIONS.reduce<Record<string, QuickAction[]>>((acc, action) => {
    if (!acc[action.category]) acc[action.category] = [];
    acc[action.category].push(action);
    return acc;
  }, {});

  return (
    <div
      data-testid="skill-panel"
      role="region"
      aria-label="스킬 패널"
      className="skill-panel p-4 space-y-4 overflow-y-auto h-full"
    >
      {/* 워크플로우 섹션 */}
      {workflow.length > 0 && (
        <section aria-label="워크플로우 진행 상황" className="workflow-section">
          <h2 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
            워크플로우
          </h2>
          <div role="list" className="space-y-1.5">
            {workflow.map((step) => (
              <WorkflowStepItem key={step.id} step={step} />
            ))}
          </div>
        </section>
      )}

      {/* 추천 섹션 (선택적) */}
      {recommendation && (
        <section aria-label="추천 스킬" className="recommendation-section">
          <h2 className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
            추천
          </h2>
          <RecommendationCard recommendation={recommendation} />
        </section>
      )}

      {/* CLI 빌더 버튼 */}
      <section aria-label="CLI 빌더">
        <button
          onClick={onOpenCommandBuilder}
          className="w-full flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
        >
          <BuilderIcon />
          <span className="font-semibold text-sm text-purple-400">CLI 빌더</span>
          <span className="text-xs text-text-secondary ml-auto">플래그 조합</span>
        </button>
      </section>

      {/* 빠른 실행 섹션 (카테고리별 그룹화) */}
      <section aria-label="빠른 실행" className="quick-actions-section">
        <CollapsibleSection
          title="빠른 실행"
          icon={<QuickActionIcon />}
          count={QUICK_ACTIONS.length}
          defaultExpanded={true}
        >
          {Object.entries(groupedActions).map(([cat, actions]) => (
            <CollapsibleSection
              key={cat}
              title={QUICK_ACTION_CATEGORIES[cat as keyof typeof QUICK_ACTION_CATEGORIES] || cat}
              count={actions.length}
              defaultExpanded={cat === 'basic'}
            >
              {actions.map((action) => (
                <QuickActionButton
                  key={action.command}
                  action={action}
                  onClick={() => onSkillSelect?.(action.command)}
                  pinned={hasShortcut(action.command)}
                  onTogglePin={togglePin(action.command, action.label, 'quick')}
                />
              ))}
            </CollapsibleSection>
          ))}
        </CollapsibleSection>
      </section>

      {/* 명령어 기록 섹션 */}
      {commandHistory.length > 0 && (
        <section aria-label="명령어 기록" className="history-section">
          <CollapsibleSection
            title="명령어 기록"
            icon={<HistoryIcon />}
            count={commandHistory.length}
            defaultExpanded={false}
          >
            {commandHistory.map((entry, index) => (
              <div key={`${entry.command}-${entry.timestamp}-${index}`} className="group relative">
                <button
                  onClick={() => onSkillSelect?.(entry.command)}
                  className="w-full text-left px-3 py-2 pr-8 bg-bg-tertiary border border-border-default rounded-lg hover:bg-bg-tertiary/80 hover:border-accent/30 focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                >
                  <span className="block font-mono text-xs text-text-primary truncate">
                    {entry.command}
                  </span>
                  <span className="block text-xs text-text-muted mt-0.5">
                    {new Date(entry.timestamp).toLocaleString('ko-KR', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </button>
                <button
                  onClick={() => handleRemoveHistory(entry.command)}
                  className="absolute right-1.5 top-1.5 w-5 h-5 flex items-center justify-center rounded text-text-muted opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                  aria-label={`${entry.command} 삭제`}
                  title="삭제"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={handleClearHistory}
              className="w-full text-center px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              전체 삭제
            </button>
          </CollapsibleSection>
        </section>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <span className="text-xs text-text-muted">로딩 중...</span>
        </div>
      )}

      {/* Claude Code 기본 명령어 섹션 */}
      {!loading && (
        <section aria-label="기본 명령어" className="commands-section space-y-3">
          <CollapsibleSection
            title="기본 명령어"
            icon={<CommandIcon />}
            count={BUILTIN_COMMANDS.length}
            defaultExpanded={false}
          >
            {BUILTIN_COMMANDS.map((cmd) => (
              <CommandButtonItem
                key={cmd.command}
                command={cmd}
                onClick={() => onSkillSelect?.(cmd.command)}
                pinned={hasShortcut(cmd.command)}
                onTogglePin={togglePin(cmd.command, cmd.command, 'builtin')}
              />
            ))}
          </CollapsibleSection>
        </section>
      )}

      {/* 번들 스킬 섹션 */}
      {!loading && (
        <section aria-label="번들 스킬" className="bundled-skills-section space-y-3">
          <CollapsibleSection
            title="번들 스킬"
            icon={<BundleIcon />}
            count={BUNDLED_SKILLS.length}
            defaultExpanded={false}
          >
            {BUNDLED_SKILLS.map((skill) => (
              <BundledSkillButton
                key={skill.command}
                skill={skill}
                onClick={() => onSkillSelect?.(skill.command)}
                pinned={hasShortcut(skill.command)}
                onTogglePin={togglePin(skill.command, skill.label, '번들')}
              />
            ))}
          </CollapsibleSection>
        </section>
      )}

      {/* 스킬 목록 섹션 (카테고리별 그룹화) */}
      {!loading && (
        <section aria-label="스킬 목록" className="skills-section space-y-3">
          <CollapsibleSection
            title="스킬"
            icon={<SkillIcon />}
            count={totalSkills}
            defaultExpanded={true}
          >
            {totalSkills === 0 ? (
              <p className="text-xs text-text-muted italic px-2">
                사용 가능한 스킬이 없습니다
              </p>
            ) : (
              <div className="space-y-3">
                {sortedCategories.map(([category, skills]) => (
                  <CollapsibleSection
                    key={category}
                    title={category}
                    count={skills.length}
                    defaultExpanded={false}
                  >
                    {skills.map((skill, index) => (
                      <SkillButtonItem
                        key={`${category}-${skill.trigger}-${index}`}
                        skill={skill}
                        onClick={() => handleSkillClick(skill)}
                        pinned={hasShortcut(`/${skill.trigger}`)}
                        onTogglePin={togglePin(`/${skill.trigger}`, skill.name || skill.trigger, category)}
                      />
                    ))}
                  </CollapsibleSection>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* MCP 서버 섹션 */}
          <CollapsibleSection
            title="MCP 서버"
            icon={<MCPIcon />}
            count={mcpServers.length}
            defaultExpanded={true}
          >
            {mcpServers.length === 0 ? (
              <p className="text-xs text-text-muted italic px-2">
                설정된 MCP 서버가 없습니다
              </p>
            ) : (
              mcpServers.map((server, index) => (
                <MCPServerItem key={`${server.name}-${index}`} server={server} />
              ))
            )}
          </CollapsibleSection>
        </section>
      )}
    </div>
  );
};
