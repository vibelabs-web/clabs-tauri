// @TASK Theme Store - 테마 상태 관리
// 9개 테마 지원 (Default Dark, Gruvbox Dark/Light, Dracula, One Dark, Nord, Solarized Dark/Light, Tokyo Night)

import { create } from 'zustand';
import { themes, getTheme, DEFAULT_THEME_ID } from '@shared/themes';
import type { Theme, ThemeId } from '@shared/themes';

interface ThemeState {
  // 현재 테마
  currentThemeId: ThemeId;
  currentTheme: Theme;

  // 액션
  setTheme: (themeId: ThemeId | string) => Promise<void>;
  loadFromConfig: () => Promise<void>;
}

// DOM에 테마 적용
function applyThemeToDOM(themeId: string): void {
  document.documentElement.setAttribute('data-theme', themeId);
}

export const useThemeStore = create<ThemeState>((set) => ({
  currentThemeId: DEFAULT_THEME_ID,
  currentTheme: getTheme(DEFAULT_THEME_ID),

  setTheme: async (themeId: ThemeId | string) => {
    const theme = getTheme(themeId);
    const validThemeId = theme.id as ThemeId;

    // DOM에 테마 적용
    applyThemeToDOM(validThemeId);

    // 상태 업데이트
    set({
      currentThemeId: validThemeId,
      currentTheme: theme,
    });

    // electron-store에 저장
    try {
      if (window.api?.config?.set) {
        await window.api.config.set('theme', validThemeId);
      }
    } catch (error) {
      console.error('테마 저장 실패:', error);
    }
  },

  loadFromConfig: async () => {
    try {
      if (window.api?.config?.get) {
        const savedThemeId = await window.api.config.get('theme');
        if (savedThemeId && themes[savedThemeId as ThemeId]) {
          const theme = getTheme(savedThemeId);
          applyThemeToDOM(theme.id);
          set({
            currentThemeId: theme.id as ThemeId,
            currentTheme: theme,
          });
        } else {
          // 기본 테마 적용
          applyThemeToDOM(DEFAULT_THEME_ID);
        }
      } else {
        // API 없으면 기본 테마 적용
        applyThemeToDOM(DEFAULT_THEME_ID);
      }
    } catch (error) {
      console.error('테마 로드 실패:', error);
      applyThemeToDOM(DEFAULT_THEME_ID);
    }
  },
}));

// 테마 목록 가져오기 (UI용)
export { themes, getTheme, DEFAULT_THEME_ID };
export type { Theme, ThemeId };
