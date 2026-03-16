// 비용 관련 타입 정의

export interface UsageSnapshot {
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalCost: number; // USD
}

export interface CostHistory {
  snapshots: UsageSnapshot[];
  sessionStart: number;
  sessionTotalCost: number;
}
