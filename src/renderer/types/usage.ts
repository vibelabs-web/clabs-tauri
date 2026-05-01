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
  /** 마지막 API 응답에서 추출된 model id (예: "claude-opus-4-7", "claude-sonnet-4-5"). */
  model?: string | null;
  /** 1M context 모드 여부 — Sonnet/Opus 4의 200K 초과분 가산가격 적용. */
  isLongContext?: boolean;
  // Anthropic API 사용량 (5시간/7일)
  fiveHourUsage?: number | null;
  fiveHourReset?: string | null;
  sevenDayUsage?: number | null;
  sevenDayReset?: string | null;
}
