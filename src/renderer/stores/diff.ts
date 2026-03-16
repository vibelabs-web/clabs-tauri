// 파일 변경 diff 스토어
// @TASK WU-2 - File Change Detection + Diff Preview
import { create } from 'zustand';

export interface FileChange {
  path: string;
  diff: string;
  changeType: 'modified' | 'created' | 'deleted';
  timestamp: number;
}

interface DiffState {
  changes: FileChange[];
  selectedFile: string | null;
  addChange: (change: FileChange) => void;
  removeChange: (path: string) => void;
  selectFile: (path: string | null) => void;
  clearChanges: () => void;
}

export const useDiffStore = create<DiffState>((set) => ({
  changes: [],
  selectedFile: null,

  addChange: (change) =>
    set((state) => {
      // 같은 파일의 이전 변경 교체
      const filtered = state.changes.filter((c) => c.path !== change.path);
      // diff가 비어있으면 (원본과 동일) 추가하지 않음
      if (!change.diff.trim()) return { changes: filtered };
      return { changes: [...filtered, change] };
    }),

  removeChange: (path) =>
    set((state) => ({
      changes: state.changes.filter((c) => c.path !== path),
      selectedFile: state.selectedFile === path ? null : state.selectedFile,
    })),

  selectFile: (path) => set({ selectedFile: path }),
  clearChanges: () => set({ changes: [], selectedFile: null }),
}));
