// 글로벌 모달 카운터.
// 모든 모달 컴포넌트는 열려있는 동안 useEffect로 open/close 호출:
//
//   useEffect(() => {
//     if (!isOpen) return;
//     useModalStore.getState().open();
//     return () => useModalStore.getState().close();
//   }, [isOpen]);
//
// AlacTerminalView가 openCount > 0이면 alac NSView를 hidden 처리해서
// 모달이 NSView 뒤에 깔려 안 보이는 문제를 해결.

import { create } from 'zustand';

interface ModalStore {
  openCount: number;
  open: () => void;
  close: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  openCount: 0,
  open: () => set((s) => ({ openCount: s.openCount + 1 })),
  close: () => set((s) => ({ openCount: Math.max(0, s.openCount - 1) })),
}));
