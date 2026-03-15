// 테마 시스템 타입 정의

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  accent: string;
  accentHover: string;
  accentLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  borderDefault: string;
  borderHover: string;
}

export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  cursorAccent: string;
  selectionBackground: string;
  // ANSI colors
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  // Bright ANSI colors
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: ThemeColors;
  terminal: TerminalTheme;
}

export type ThemeId =
  | 'default-dark'
  | 'gruvbox-dark'
  | 'gruvbox-light'
  | 'dracula'
  | 'one-dark'
  | 'nord'
  | 'solarized-dark'
  | 'solarized-light'
  | 'tokyo-night';
