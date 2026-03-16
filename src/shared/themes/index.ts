// 테마 시스템 통합 모듈

import type { Theme, ThemeId } from './types';
import { defaultDark } from './presets/default-dark';
import { gruvboxDark } from './presets/gruvbox-dark';
import { gruvboxLight } from './presets/gruvbox-light';
import { dracula } from './presets/dracula';
import { oneDark } from './presets/one-dark';
import { nord } from './presets/nord';
import { solarizedDark } from './presets/solarized-dark';
import { solarizedLight } from './presets/solarized-light';
import { tokyoNight } from './presets/tokyo-night';
import { catppuccinMocha } from './presets/catppuccin-mocha';
import { catppuccinLatte } from './presets/catppuccin-latte';
import { monokaiPro } from './presets/monokai-pro';
import { materialDark } from './presets/material-dark';
import { rosePine } from './presets/rose-pine';
import { githubDark } from './presets/github-dark';

// 모든 테마 목록
export const themes: Record<ThemeId, Theme> = {
  'default-dark': defaultDark,
  'gruvbox-dark': gruvboxDark,
  'gruvbox-light': gruvboxLight,
  'dracula': dracula,
  'one-dark': oneDark,
  'nord': nord,
  'solarized-dark': solarizedDark,
  'solarized-light': solarizedLight,
  'tokyo-night': tokyoNight,
  'catppuccin-mocha': catppuccinMocha,
  'catppuccin-latte': catppuccinLatte,
  'monokai-pro': monokaiPro,
  'material-dark': materialDark,
  'rose-pine': rosePine,
  'github-dark': githubDark,
};

// 테마 목록 배열 (UI에서 사용)
export const themeList: Theme[] = Object.values(themes);

// 테마 ID로 테마 조회
export function getTheme(themeId: ThemeId | string): Theme {
  return themes[themeId as ThemeId] || defaultDark;
}

// 기본 테마
export const DEFAULT_THEME_ID: ThemeId = 'default-dark';
export const DEFAULT_THEME = defaultDark;

// 타입 및 프리셋 재내보내기
export type { Theme, ThemeId, ThemeColors, TerminalTheme } from './types';
export { defaultDark } from './presets/default-dark';
export { gruvboxDark } from './presets/gruvbox-dark';
export { gruvboxLight } from './presets/gruvbox-light';
export { dracula } from './presets/dracula';
export { oneDark } from './presets/one-dark';
export { nord } from './presets/nord';
export { solarizedDark } from './presets/solarized-dark';
export { solarizedLight } from './presets/solarized-light';
export { tokyoNight } from './presets/tokyo-night';
export { catppuccinMocha } from './presets/catppuccin-mocha';
export { catppuccinLatte } from './presets/catppuccin-latte';
export { monokaiPro } from './presets/monokai-pro';
export { materialDark } from './presets/material-dark';
export { rosePine } from './presets/rose-pine';
export { githubDark } from './presets/github-dark';
