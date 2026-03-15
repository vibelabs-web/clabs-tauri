// Toolbar shortcuts store - 바로가기 칩 영구 저장/관리

import { create } from 'zustand';
import type { ToolbarShortcut } from '@shared/types';

interface ToolbarState {
  shortcuts: ToolbarShortcut[];
  addShortcut: (shortcut: ToolbarShortcut) => void;
  removeShortcut: (command: string) => void;
  hasShortcut: (command: string) => boolean;
  loadFromConfig: () => Promise<void>;
  saveToConfig: () => Promise<void>;
}

export const useToolbarStore = create<ToolbarState>((set, get) => ({
  shortcuts: [],

  addShortcut: (shortcut) => {
    const { shortcuts } = get();
    if (shortcuts.some((s) => s.command === shortcut.command)) return;
    set({ shortcuts: [...shortcuts, shortcut] });
    get().saveToConfig();
  },

  removeShortcut: (command) => {
    set({ shortcuts: get().shortcuts.filter((s) => s.command !== command) });
    get().saveToConfig();
  },

  hasShortcut: (command) => {
    return get().shortcuts.some((s) => s.command === command);
  },

  loadFromConfig: async () => {
    try {
      const saved = await window.api.config.get('toolbarShortcuts');
      if (Array.isArray(saved)) {
        set({ shortcuts: saved });
      }
    } catch (error) {
      console.error('툴바 바로가기 로드 실패:', error);
    }
  },

  saveToConfig: async () => {
    try {
      await window.api.config.set('toolbarShortcuts', get().shortcuts);
    } catch (error) {
      console.error('툴바 바로가기 저장 실패:', error);
    }
  },
}));
