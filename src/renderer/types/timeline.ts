// 대화 턴 타입 정의
export interface ConversationTurn {
  id: number;
  type: 'user' | 'assistant';
  preview: string; // 첫 줄 또는 요약
  startLine: number; // 터미널 버퍼에서의 시작 줄
  endLine: number;
  timestamp: number;
  paneId: string;
}
