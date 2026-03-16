// @TASK P2-S4-T1 - StatusBar 컴포넌트 구현
// @SPEC Anthropic API 기반 5H/7D 사용량 + Context + Task 시간 표시

import React from 'react';
import { UsageData } from '@renderer/types/usage';
import { formatDuration } from '@renderer/utils/formatters';
import { useSidebarStore } from '@renderer/stores/sidebar';

interface StatusBarProps {
  usage: UsageData;
  onSettingsClick?: () => void;
}

// 설정 아이콘
const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// 그라디언트 색상 계산 (퍼센트 기반)
const getGradientColor = (percent: number, type: 'context' | '5h' | '7d'): string => {
  if (type === 'context') {
    // Pink → Orange → Red
    if (percent < 30) return 'from-pink-400 to-pink-500';
    if (percent < 70) return 'from-orange-400 to-orange-500';
    return 'from-red-500 to-red-600';
  }
  if (type === '5h') {
    // Lavender → Blue → Red
    if (percent < 50) return 'from-indigo-400 to-blue-500';
    if (percent < 80) return 'from-blue-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  }
  // 7d: Yellow → Peach → Red
  if (percent < 50) return 'from-yellow-400 to-amber-500';
  if (percent < 80) return 'from-amber-500 to-orange-500';
  return 'from-orange-500 to-red-500';
};

const getTextColor = (percent: number): string => {
  if (percent < 50) return 'text-emerald-400';
  if (percent < 80) return 'text-amber-400';
  return 'text-red-400';
};

// 미니 프로그레스 바 컴포넌트
const MiniProgressBar: React.FC<{
  percent: number;
  type: 'context' | '5h' | '7d';
  width?: string;
}> = ({ percent, type, width = 'w-16' }) => {
  const safePercent = Math.min(100, Math.max(0, percent));
  const gradientClass = getGradientColor(safePercent, type);

  return (
    <div className={`${width} h-1.5 bg-bg-tertiary rounded-full overflow-hidden`}>
      <div
        className={`h-full bg-gradient-to-r ${gradientClass} transition-all duration-500`}
        style={{ width: `${safePercent}%` }}
      />
    </div>
  );
};

const StatusBar: React.FC<StatusBarProps> = ({ usage, onSettingsClick }) => {
  const {
    tokensUsed,
    contextLimit,
    taskDuration,
    fiveHourUsage,
    fiveHourReset,
    sevenDayUsage,
    sevenDayReset
  } = usage;

  // 비용 탭으로 전환 (CTX/5H/7D 클릭 시)
  const { setActiveTab } = useSidebarStore();

  // 컨텍스트 사용률 계산
  const contextPercent = Math.min(100, (tokensUsed / contextLimit) * 100);

  // 토큰 포맷팅 (K 단위)
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <div
      data-testid="status-bar"
      className="flex items-center gap-4 px-4 py-2 bg-bg-secondary border-t border-border-default text-xs"
    >
      {/* Context 사용량 — 클릭 시 비용 탭으로 이동 */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setActiveTab('cost')}
        title="비용 대시보드 열기"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setActiveTab('cost')}
      >
        <span className="text-pink-400 font-medium">CTX</span>
        <MiniProgressBar percent={contextPercent} type="context" width="w-20" />
        <span className={`font-bold ${getTextColor(contextPercent)}`}>
          {contextPercent.toFixed(0)}%
        </span>
        <span className="text-text-muted">
          ({formatTokens(tokensUsed)})
        </span>
      </div>

      {/* 구분선 */}
      <div className="w-px h-4 bg-border-default" />

      {/* 5시간 사용량 — 클릭 시 비용 탭으로 이동 */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setActiveTab('cost')}
        title="비용 대시보드 열기"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setActiveTab('cost')}
      >
        <span className="text-indigo-400 font-medium">5H</span>
        {fiveHourUsage !== null && fiveHourUsage !== undefined ? (
          <>
            <MiniProgressBar percent={fiveHourUsage} type="5h" />
            <span className={`font-bold ${getTextColor(fiveHourUsage)}`}>
              {fiveHourUsage}%
            </span>
            {fiveHourReset && (
              <span className="text-text-muted">({fiveHourReset})</span>
            )}
          </>
        ) : (
          <span className="text-text-disabled">--</span>
        )}
      </div>

      {/* 구분선 */}
      <div className="w-px h-4 bg-border-default" />

      {/* 7일 사용량 — 클릭 시 비용 탭으로 이동 */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setActiveTab('cost')}
        title="비용 대시보드 열기"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setActiveTab('cost')}
      >
        <span className="text-amber-400 font-medium">7D</span>
        {sevenDayUsage !== null && sevenDayUsage !== undefined ? (
          <>
            <MiniProgressBar percent={sevenDayUsage} type="7d" />
            <span className={`font-bold ${getTextColor(sevenDayUsage)}`}>
              {sevenDayUsage}%
            </span>
            {sevenDayReset && (
              <span className="text-text-muted">({sevenDayReset})</span>
            )}
          </>
        ) : (
          <span className="text-text-disabled">--</span>
        )}
      </div>

      {/* 스페이서 */}
      <div className="flex-1" />

      {/* 태스크 시간 */}
      <div className="flex items-center gap-2">
        <span className="text-text-muted">Task</span>
        <span className="font-mono text-accent font-medium">
          {formatDuration(taskDuration)}
        </span>
      </div>

      {/* 구분선 */}
      <div className="w-px h-4 bg-border-default" />

      {/* 설정 버튼 */}
      <button
        onClick={onSettingsClick}
        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
        title="설정"
      >
        <SettingsIcon />
        <span>설정</span>
      </button>
    </div>
  );
};

export default StatusBar;
