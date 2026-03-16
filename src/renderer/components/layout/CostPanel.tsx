// @TASK WU-3 - 비용/토큰 대시보드 패널
// @SPEC Claude Sonnet 4 가격 기준 실시간 비용 추적 + 시간별 차트

import React, { useEffect } from 'react';
import { useCostStore, calculateCost } from '@renderer/stores/cost';
import type { UsageData } from '@renderer/types/usage';

interface CostPanelProps {
  usage: UsageData;
}

// SVG 바 차트 컴포넌트 (외부 라이브러리 없이)
const HourlyChart: React.FC<{ data: { hour: string; cost: number }[] }> = ({ data }) => {
  const maxCost = Math.max(...data.map((d) => d.cost), 0.001);
  const chartHeight = 120;
  const barWidth = 8;
  const gap = 2;

  return (
    <div className="mt-3">
      <h3 className="text-xs font-semibold text-text-secondary mb-2">최근 24시간 비용</h3>
      <svg
        width="100%"
        height={chartHeight + 20}
        viewBox={`0 0 ${data.length * (barWidth + gap)} ${chartHeight + 20}`}
        className="overflow-visible"
        aria-label="최근 24시간 시간별 비용 차트"
      >
        {data.map((d, i) => {
          const barHeight = (d.cost / maxCost) * chartHeight;
          const x = i * (barWidth + gap);
          const y = chartHeight - barHeight;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={1}
                className="fill-accent/60 hover:fill-accent transition-colors"
              />
              {/* 6시간마다 시간 레이블 표시 */}
              {i % 6 === 0 && (
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 14}
                  textAnchor="middle"
                  fontSize="8"
                  className="fill-text-muted"
                >
                  {d.hour}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const CostPanel: React.FC<CostPanelProps> = ({ usage }) => {
  const { snapshots, addSnapshot, getSessionCost, getHourlyData, loadFromStorage } = useCostStore();

  // 초기 로드: localStorage에서 히스토리 복원
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 사용량 업데이트 시 스냅샷 추가 (5분 간격 throttle은 스토어에서 처리)
  useEffect(() => {
    if (usage.inputTokens || usage.outputTokens) {
      addSnapshot({
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
        cacheReadTokens: usage.cacheReadTokens || 0,
        cacheCreationTokens: usage.cacheCreationTokens || 0,
      });
    }
  }, [usage.inputTokens, usage.outputTokens, usage.cacheReadTokens, addSnapshot]);

  const sessionCost = getSessionCost();
  const hourlyData = getHourlyData();

  // 현재 누적 비용 계산 (토큰 기준)
  const currentCost = calculateCost(
    usage.inputTokens || 0,
    usage.outputTokens || 0,
    usage.cacheReadTokens || 0
  );

  // 비용 포맷팅: 0.01 미만이면 소수점 4자리
  const formatCost = (cost: number): string => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
  };

  // 토큰 수 포맷팅: M/K 단위
  const formatTokens = (tokens: number): string => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      {/* 세션 비용 요약 */}
      <div className="bg-bg-tertiary rounded-lg p-4">
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
          현재 세션 비용
        </h2>
        <div className="text-2xl font-bold text-accent">
          {formatCost(currentCost)}
        </div>
        <div className="text-xs text-text-muted mt-1">
          누적: {formatCost(sessionCost)} · 스냅샷: {snapshots.length}개
        </div>
      </div>

      {/* 토큰 분석 카드 (2x2 그리드) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Input 토큰 */}
        <div className="bg-bg-tertiary rounded-lg p-3">
          <div className="text-xs text-blue-400 font-medium">Input</div>
          <div className="text-sm font-bold text-text-primary">
            {formatTokens(usage.inputTokens || 0)}
          </div>
          <div className="text-[10px] text-text-muted">
            {formatCost((usage.inputTokens || 0) * 3 / 1_000_000)}
          </div>
        </div>

        {/* Output 토큰 */}
        <div className="bg-bg-tertiary rounded-lg p-3">
          <div className="text-xs text-emerald-400 font-medium">Output</div>
          <div className="text-sm font-bold text-text-primary">
            {formatTokens(usage.outputTokens || 0)}
          </div>
          <div className="text-[10px] text-text-muted">
            {formatCost((usage.outputTokens || 0) * 15 / 1_000_000)}
          </div>
        </div>

        {/* Cache Read 토큰 */}
        <div className="bg-bg-tertiary rounded-lg p-3">
          <div className="text-xs text-amber-400 font-medium">Cache Read</div>
          <div className="text-sm font-bold text-text-primary">
            {formatTokens(usage.cacheReadTokens || 0)}
          </div>
          <div className="text-[10px] text-text-muted">
            {formatCost((usage.cacheReadTokens || 0) * 0.30 / 1_000_000)}
          </div>
        </div>

        {/* 메시지 수 */}
        <div className="bg-bg-tertiary rounded-lg p-3">
          <div className="text-xs text-pink-400 font-medium">Messages</div>
          <div className="text-sm font-bold text-text-primary">
            {usage.messageCount || 0}
          </div>
          <div className="text-[10px] text-text-muted">대화 턴 수</div>
        </div>
      </div>

      {/* 시간별 SVG 바 차트 */}
      <div className="bg-bg-tertiary rounded-lg p-3">
        <HourlyChart data={hourlyData} />
      </div>

      {/* Claude Sonnet 4 모델 가격 정보 */}
      <div className="bg-bg-tertiary/50 rounded-lg p-3 text-[10px] text-text-muted space-y-1">
        <div className="font-semibold text-text-secondary text-xs mb-1">Claude Sonnet 4 가격</div>
        <div>Input: $3.00/MTok</div>
        <div>Output: $15.00/MTok</div>
        <div>Cache Read: $0.30/MTok</div>
      </div>
    </div>
  );
};
