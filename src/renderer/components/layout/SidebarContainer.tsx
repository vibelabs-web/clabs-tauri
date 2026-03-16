// @TASK WU-1 - 사이드바 컨테이너 (탭 인프라)
// 왼쪽 아이콘 탭 스트립 + 오른쪽 패널 렌더링

import React from 'react';
import { useSidebarStore } from '@renderer/stores/sidebar';
import type { SidebarTabId } from '@renderer/stores/sidebar';
import { SkillPanel } from './SkillPanel';
import { TimelinePanel } from './TimelinePanel';
import { CostPanel } from './CostPanel';
import { ContextPanel } from './ContextPanel';
import { DiffPanel } from './DiffPanel';
import type { WorkflowStep, Recommendation } from '@renderer/types/skill-panel';
import type { UsageData } from '@renderer/types/usage';

// ─────────────────────────────────────────────────────────────
// 탭 아이콘 컴포넌트
// ─────────────────────────────────────────────────────────────

// skills: 번개 아이콘 (기존 SkillIcon 패턴)
const SkillsTabIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

// timeline: 시계 아이콘
const TimelineTabIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// files: 폴더 아이콘
const FilesTabIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
  </svg>
);

// cost: 달러 아이콘
const CostTabIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// diff: 파일 diff 아이콘
const DiffTabIcon: React.FC = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// 탭 정의
// ─────────────────────────────────────────────────────────────

interface TabDef {
  id: SidebarTabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'skills', label: '스킬', icon: <SkillsTabIcon /> },
  { id: 'timeline', label: '타임라인', icon: <TimelineTabIcon /> },
  { id: 'files', label: '파일', icon: <FilesTabIcon /> },
  { id: 'cost', label: '비용', icon: <CostTabIcon /> },
  { id: 'diff', label: '변경', icon: <DiffTabIcon /> },
];

// ─────────────────────────────────────────────────────────────
// 탭 버튼 컴포넌트
// ─────────────────────────────────────────────────────────────

interface TabButtonProps {
  tab: TabDef;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isActive, onClick }) => (
  <button
    onClick={onClick}
    title={tab.label}
    aria-label={tab.label}
    aria-pressed={isActive}
    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all focus:outline-none focus:ring-1 focus:ring-accent ${
      isActive
        ? 'text-accent bg-accent/15'
        : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary/60'
    }`}
  >
    {tab.icon}
  </button>
);

// ─────────────────────────────────────────────────────────────
// 플레이스홀더 패널 (미구현 탭)
// ─────────────────────────────────────────────────────────────

interface PlaceholderPanelProps {
  label: string;
}

const PlaceholderPanel: React.FC<PlaceholderPanelProps> = ({ label }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-4">
    <p className="text-xs text-text-muted">{label} 패널 준비 중</p>
  </div>
);

// ─────────────────────────────────────────────────────────────
// SidebarContainer Props
// ─────────────────────────────────────────────────────────────

export interface SidebarContainerProps {
  workflow?: WorkflowStep[];
  recommendation?: Recommendation;
  onSkillSelect?: (command: string) => void;
  onOpenCommandBuilder?: () => void;
  usage?: UsageData;
  projectPath?: string;
}

// ─────────────────────────────────────────────────────────────
// SidebarContainer 메인 컴포넌트
// ─────────────────────────────────────────────────────────────

export const SidebarContainer: React.FC<SidebarContainerProps> = ({
  workflow,
  recommendation,
  onSkillSelect,
  onOpenCommandBuilder,
  usage,
  projectPath,
}) => {
  const { activeTab, setActiveTab } = useSidebarStore();

  // 활성 탭에 따라 패널 렌더링
  const renderPanel = () => {
    switch (activeTab) {
      case 'skills':
        return (
          <SkillPanel
            workflow={workflow}
            recommendation={recommendation}
            onSkillSelect={onSkillSelect}
            onOpenCommandBuilder={onOpenCommandBuilder}
          />
        );
      case 'timeline':
        return <TimelinePanel />;
      case 'files':
        return <ContextPanel projectPath={projectPath} />;
      case 'cost':
        return usage ? <CostPanel usage={usage} /> : <PlaceholderPanel label="비용" />;
      case 'diff':
        return <DiffPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* 왼쪽 아이콘 탭 스트립 (40px) */}
      <div className="flex-shrink-0 w-10 flex flex-col items-center gap-1 py-2 bg-bg-secondary border-r border-border-default">
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* 오른쪽 패널 영역 */}
      <div className="flex-1 overflow-hidden">
        {renderPanel()}
      </div>
    </div>
  );
};
