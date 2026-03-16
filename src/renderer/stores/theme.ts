// @TASK Theme Store - 테마 상태 관리
// 9개 테마 지원 + 시스템 다크/라이트 모드 자동 전환

import { create } from 'zustand';
import { themes, getTheme, DEFAULT_THEME_ID } from '@shared/themes';
import type { Theme, ThemeId } from '@shared/themes';

interface ThemeState {
  currentThemeId: ThemeId;
  currentTheme: Theme;

  // 자동 테마 전환
  autoTheme: boolean;
  darkThemeId: ThemeId;
  lightThemeId: ThemeId;

  // 액션
  setTheme: (themeId: ThemeId | string) => Promise<void>;
  setAutoTheme: (enabled: boolean) => Promise<void>;
  setDarkThemeId: (themeId: ThemeId) => Promise<void>;
  setLightThemeId: (themeId: ThemeId) => Promise<void>;
  loadFromConfig: () => Promise<void>;
}

// DOM에 테마 적용
function applyThemeToDOM(themeId: string): void {
  document.documentElement.setAttribute('data-theme', themeId);
}

// OS 다크 모드 감지
function isDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

let mediaQueryCleanup: (() => void) | null = null;

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentThemeId: DEFAULT_THEME_ID,
  currentTheme: getTheme(DEFAULT_THEME_ID),
  autoTheme: false,
  darkThemeId: 'default-dark' as ThemeId,
  lightThemeId: 'solarized-light' as ThemeId,

  setTheme: async (themeId: ThemeId | string) => {
    const theme = getTheme(themeId);
    const validThemeId = theme.id as ThemeId;

    applyThemeToDOM(validThemeId);

    set({
      currentThemeId: validThemeId,
      currentTheme: theme,
    });

    try {
      if (window.api?.config?.set) {
        await window.api.config.set('theme', validThemeId);
      }
    } catch (error) {
      console.error('테마 저장 실패:', error);
    }
  },

  setAutoTheme: async (enabled: boolean) => {
    set({ autoTheme: enabled });

    if (enabled) {
      // 자동 전환 활성화: 현재 OS 모드에 맞는 테마 적용
      const { darkThemeId, lightThemeId, setTheme } = get();
      const targetThemeId = isDarkMode() ? darkThemeId : lightThemeId;
      await setTheme(targetThemeId);
      startAutoThemeListener();
    } else {
      // 리스너 해제
      if (mediaQueryCleanup) {
        mediaQueryCleanup();
        mediaQueryCleanup = null;
      }
    }

    try {
      if (window.api?.config?.set) {
        const terminalConfig = await window.api.config.get('terminal');
        await window.api.config.set('terminal', {
          ...terminalConfig,
          autoTheme: enabled,
        });
      }
    } catch { /* ignore */ }
  },

  setDarkThemeId: async (themeId: ThemeId) => {
    set({ darkThemeId: themeId });
    const { autoTheme, setTheme } = get();
    if (autoTheme && isDarkMode()) {
      await setTheme(themeId);
    }
    try {
      if (window.api?.config?.set) {
        const terminalConfig = await window.api.config.get('terminal');
        await window.api.config.set('terminal', { ...terminalConfig, darkThemeId: themeId });
      }
    } catch { /* ignore */ }
  },

  setLightThemeId: async (themeId: ThemeId) => {
    set({ lightThemeId: themeId });
    const { autoTheme, setTheme } = get();
    if (autoTheme && !isDarkMode()) {
      await setTheme(themeId);
    }
    try {
      if (window.api?.config?.set) {
        const terminalConfig = await window.api.config.get('terminal');
        await window.api.config.set('terminal', { ...terminalConfig, lightThemeId: themeId });
      }
    } catch { /* ignore */ }
  },

  loadFromConfig: async () => {
    try {
      if (window.api?.config?.get) {
        const savedThemeId = await window.api.config.get('theme');
        const terminalConfig = await window.api.config.get('terminal');

        const autoTheme = (terminalConfig as any)?.autoTheme ?? false;
        const darkThemeId = ((terminalConfig as any)?.darkThemeId || 'default-dark') as ThemeId;
        const lightThemeId = ((terminalConfig as any)?.lightThemeId || 'solarized-light') as ThemeId;

        set({ autoTheme, darkThemeId, lightThemeId });

        if (autoTheme) {
          const targetThemeId = isDarkMode() ? darkThemeId : lightThemeId;
          const theme = getTheme(targetThemeId);
          applyThemeToDOM(theme.id);
          set({ currentThemeId: theme.id as ThemeId, currentTheme: theme });
          startAutoThemeListener();
        } else if (savedThemeId && themes[savedThemeId as ThemeId]) {
          const theme = getTheme(savedThemeId);
          applyThemeToDOM(theme.id);
          set({ currentThemeId: theme.id as ThemeId, currentTheme: theme });
        } else {
          applyThemeToDOM(DEFAULT_THEME_ID);
        }
      } else {
        applyThemeToDOM(DEFAULT_THEME_ID);
      }
    } catch (error) {
      console.error('테마 로드 실패:', error);
      applyThemeToDOM(DEFAULT_THEME_ID);
    }
  },
}));

// 시스템 테마 변경 리스너
function startAutoThemeListener() {
  if (mediaQueryCleanup) {
    mediaQueryCleanup();
    mediaQueryCleanup = null;
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    const { autoTheme, darkThemeId, lightThemeId, setTheme } = useThemeStore.getState();
    if (!autoTheme) return;
    const targetThemeId = e.matches ? darkThemeId : lightThemeId;
    setTheme(targetThemeId);
  };

  mediaQuery.addEventListener('change', handler);
  mediaQueryCleanup = () => mediaQuery.removeEventListener('change', handler);
}

// 테마 목록 가져오기 (UI용)
export { themes, getTheme, DEFAULT_THEME_ID };
export type { Theme, ThemeId };
