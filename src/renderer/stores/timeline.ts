// 대화 타임라인 스토어
import { create } from 'zustand';
import type { ConversationTurn } from '@renderer/types/timeline';

interface TimelineState {
  turns: ConversationTurn[];
  setTurns: (turns: ConversationTurn[]) => void;
  addTurn: (turn: ConversationTurn) => void;
  clearTurns: () => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
  turns: [],
  setTurns: (turns) => set({ turns }),
  addTurn: (turn) => set((state) => ({ turns: [...state.turns, turn] })),
  clearTurns: () => set({ turns: [] }),
}));
