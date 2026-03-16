// @TASK WU-1 - 대화 타임라인 패널
// 터미널 버퍼의 대화 턴을 스크롤 가능한 카드 목록으로 표시

import React, { useCallback } from 'react';
import { useTimelineStore } from '@renderer/stores/timeline';
import { scrollToLine } from '@renderer/utils/terminal-registry';
import type { ConversationTurn } from '@renderer/types/timeline';

// ─────────────────────────────────────────────────────────────
// 아이콘 컴포넌트
// ─────────────────────────────────────────────────────────────

const UserIcon: React.FC = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const AssistantIcon: React.FC = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// 타임스탬프 포맷
// ─────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────
// 턴 카드 컴포넌트
// ─────────────────────────────────────────────────────────────

interface TurnCardProps {
  turn: ConversationTurn;
  onClick: (turn: ConversationTurn) => void;
}

const TurnCard: React.FC<TurnCardProps> = ({ turn, onClick }) => {
  const isUser = turn.type === 'user';

  return (
    <button
      onClick={() => onClick(turn)}
      className={`w-full text-left px-3 py-2.5 rounded-lg border-l-2 bg-bg-tertiary hover:bg-bg-tertiary/70 focus:outline-none focus:ring-1 focus:ring-accent transition-all ${
        isUser
          ? 'border-l-blue-500 hover:border-l-blue-400'
          : 'border-l-green-500 hover:border-l-green-400'
      }`}
      title={`줄 ${turn.startLine}으로 이동`}
      aria-label={`${isUser ? '사용자' : '어시스턴트'} 턴: ${turn.preview}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={isUser ? 'text-blue-400' : 'text-green-400'}>
          {isUser ? <UserIcon /> : <AssistantIcon />}
        </span>
        <span className={`text-xs font-semibold ${isUser ? 'text-blue-400' : 'text-green-400'}`}>
          {isUser ? '사용자' : '어시스턴트'}
        </span>
        <span className="text-xs text-text-muted ml-auto">
          {formatTimestamp(turn.timestamp)}
        </span>
      </div>
      <p className="text-xs text-text-secondary truncate pl-6">
        {turn.preview || '(내용 없음)'}
      </p>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
// TimelinePanel 메인 컴포넌트
// ─────────────────────────────────────────────────────────────

export const TimelinePanel: React.FC = () => {
  const turns = useTimelineStore((s) => s.turns);

  // 카드 클릭 시 해당 줄로 스크롤
  const handleTurnClick = useCallback((turn: ConversationTurn) => {
    scrollToLine(turn.paneId, turn.startLine);
  }, []);

  return (
    <div
      role="region"
      aria-label="대화 타임라인"
      className="flex flex-col h-full overflow-hidden"
    >
      {/* 패널 헤더 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border-default">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          대화 타임라인
        </h2>
        {turns.length > 0 && (
          <span className="text-xs text-text-muted mt-0.5 block">
            {turns.length}개 턴
          </span>
        )}
      </div>

      {/* 턴 목록 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {turns.length === 0 ? (
          // 빈 상태
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <svg
              className="w-10 h-10 text-text-muted mb-3 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs text-text-muted leading-relaxed">
              대화가 시작되면 타임라인이 표시됩니다
            </p>
          </div>
        ) : (
          turns.map((turn) => (
            <TurnCard key={turn.id} turn={turn} onClick={handleTurnClick} />
          ))
        )}
      </div>
    </div>
  );
};
