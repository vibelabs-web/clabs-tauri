// @TASK P2-S4-T1 - 사용량 데이터 타입 정의

export interface UsageData {
  tokensUsed: number;
  contextLimit: number;
  dailyTokensUsed: number;
  taskDuration: number; // 초 단위
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  messageCount?: number;
  // Anthropic API 사용량 (5시간/7일)
  fiveHourUsage?: number | null;
  fiveHourReset?: string | null;
  sevenDayUsage?: number | null;
  sevenDayReset?: string | null;
}
