// @TASK Settings Store - 설정 상태 관리
// @SPEC SettingsPage.tsx의 로컬 상태를 Zustand store로 이동
// 참고: 테마 관리는 theme.ts로 이동됨

import { create } from 'zustand';
import type { CursorStyle } from '@shared/types';

interface SettingsState {
  // 설정 값 (테마는 theme store에서 관리)
  fontSize: number;
  cursorStyle: CursorStyle;
  autoUpdate: boolean;

  // 액션
  setFontSize: (size: number) => void;
  setCursorStyle: (style: CursorStyle) => void;
  setAutoUpdate: (enabled: boolean) => void;
  loadFromConfig: () => Promise<void>;
  saveToConfig: () => Promise<void>;
}

const initialState = {
  fontSize: 14,
  cursorStyle: 'block' as CursorStyle,
  autoUpdate: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...initialState,

  setFontSize: (size) => {
    set({ fontSize: size });
    get().saveToConfig();
  },

  setCursorStyle: (style) => {
    set({ cursorStyle: style });
    get().saveToConfig();
  },

  setAutoUpdate: (enabled) => {
    set({ autoUpdate: enabled });
    get().saveToConfig();
  },

  loadFromConfig: async () => {
    try {
      // IPC를 통해 Main Process의 config store에서 설정 로드
      const config = await window.api.config.getAll();
      if (config) {
        set({
          fontSize: config.terminal?.fontSize || initialState.fontSize,
          cursorStyle: config.terminal?.cursorStyle || initialState.cursorStyle,
          autoUpdate: config.skillpack?.autoUpdate ?? initialState.autoUpdate,
        });
      }
    } catch (error) {
      console.error('설정 로드 실패:', error);
    }
  },

  saveToConfig: async () => {
    try {
      const state = get();
      // IPC를 통해 Main Process의 config store에 설정 저장

      const terminalConfig = await window.api.config.get('terminal');
      await window.api.config.set('terminal', {
        ...terminalConfig,
        fontSize: state.fontSize,
        cursorStyle: state.cursorStyle,
      });

      const skillpackConfig = await window.api.config.get('skillpack');
      await window.api.config.set('skillpack', {
        ...skillpackConfig,
        autoUpdate: state.autoUpdate,
      });
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  },
}));
