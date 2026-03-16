// 사이드바 탭 상태 관리
import { create } from 'zustand';

export type SidebarTabId = 'skills' | 'timeline' | 'files' | 'cost' | 'diff';

interface SidebarState {
  activeTab: SidebarTabId;
  setActiveTab: (tab: SidebarTabId) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  activeTab: 'skills',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
