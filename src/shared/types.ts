// clabs 공통 타입 정의
import type { CommandHistoryEntry } from './claude-cli';

// ─────────────────────────────────────────────────────────────
// 기본 타입
// ─────────────────────────────────────────────────────────────

// 기본 테마 타입 (하위 호환성 유지)
export type Theme = 'dark' | 'light';

// 확장 테마 ID (15개 테마 지원)
export type ThemeId =
  | 'default-dark'
  | 'gruvbox-dark'
  | 'gruvbox-light'
  | 'dracula'
  | 'one-dark'
  | 'nord'
  | 'solarized-dark'
  | 'solarized-light'
  | 'tokyo-night'
  | 'catppuccin-mocha'
  | 'catppuccin-latte'
  | 'monokai-pro'
  | 'material-dark'
  | 'rose-pine'
  | 'github-dark';
export type Language = 'ko' | 'en';
export type CursorStyle = 'block' | 'underline' | 'bar';

// ─────────────────────────────────────────────────────────────
// 스킬 관련 타입
// ─────────────────────────────────────────────────────────────

export type SkillCategory = 'planning' | 'implementation' | 'verification' | 'utility';

export interface Skill {
  name: string;
  command: string;
  category: SkillCategory;
  description: string;
  icon?: string;
}

// ─────────────────────────────────────────────────────────────
// 워크플로우 관련 타입
// ─────────────────────────────────────────────────────────────

export type WorkflowStatus = 'pending' | 'current' | 'completed';

export interface WorkflowStep {
  name: string;
  skill: string;
  status: WorkflowStatus;
}

// ─────────────────────────────────────────────────────────────
// 터미널 관련 타입
// ─────────────────────────────────────────────────────────────

export type TerminalStatus = 'idle' | 'running' | 'waiting_input' | 'waiting_selection';

export interface SelectionOption {
  label: string;
  value: string;
  selected: boolean;
}

// ─────────────────────────────────────────────────────────────
// 사용량 관련 타입
// ─────────────────────────────────────────────────────────────

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface ContextUsage {
  used: number;
  max: number;
  percentage: number;
}

export type UsageLevel = 'green' | 'yellow' | 'orange' | 'red';

export interface UsageUpdateData {
  tokensUsed: number;
  contextLimit: number;
  dailyTokensUsed: number;
  taskDuration?: number;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  messageCount?: number;
  // Anthropic API 사용량
  fiveHourUsage?: number | null;
  fiveHourReset?: string | null;
  sevenDayUsage?: number | null;
  sevenDayReset?: string | null;
}

export function getUsageLevel(percentage: number): UsageLevel {
  if (percentage < 50) return 'green';
  if (percentage < 75) return 'yellow';
  if (percentage < 90) return 'orange';
  return 'red';
}

// ─────────────────────────────────────────────────────────────
// 프로젝트 관련 타입
// ─────────────────────────────────────────────────────────────

export interface Project {
  path: string;
  name: string;
  lastOpened: Date;
  skillpackVersion: string;
}

// ─────────────────────────────────────────────────────────────
// 툴바 바로가기 타입
// ─────────────────────────────────────────────────────────────

export interface ToolbarShortcut {
  command: string;   // "/{trigger}" 또는 빌트인 명령어
  label: string;     // 표시 이름
  category?: string; // 아이콘 색상 구분용
}

// ─────────────────────────────────────────────────────────────
// 설정 관련 타입
// ─────────────────────────────────────────────────────────────

export interface Config {
  theme: ThemeId | Theme; // 확장 테마 ID 또는 기존 테마 타입
  language: Language;
  terminal: TerminalConfig;
  skillpack: SkillpackConfig;
  toolbarShortcuts: ToolbarShortcut[];
}

export interface TerminalConfig {
  fontSize: number;
  fontFamily: string;
  cursorStyle: CursorStyle;
  cursorBlink: boolean;
  scrollback: number;
  // 자동 테마 전환
  autoTheme?: boolean;
  darkThemeId?: string;
  lightThemeId?: string;
}

export interface SkillpackConfig {
  autoUpdate: boolean;
  skillsPath: string;
}

// ─────────────────────────────────────────────────────────────
// 라이선스 관련 타입
// ─────────────────────────────────────────────────────────────

export interface License {
  key: string;
  activatedAt: Date;
  expiresAt: Date;
  upgradeExpiresAt: Date;
  email: string;
  machineId: string;
}

export interface LicenseValidationResult {
  isValid: boolean;
  error?: string;
  remainingDays?: number;
}

// ─────────────────────────────────────────────────────────────
// 업데이트 관련 타입
// ─────────────────────────────────────────────────────────────

export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
  publishedAt: Date;
}

export type UpdateStatus =
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'not_available'
  | 'error';

// ─────────────────────────────────────────────────────────────
// IPC 채널 타입
// ─────────────────────────────────────────────────────────────

export type IPCChannel =
  | 'pty:spawn'
  | 'pty:write'
  | 'pty:data'
  | 'pty:resize'
  | 'pty:exit'
  | 'pty:kill-all'
  | 'skills:list'
  | 'skills:execute'
  | 'config:get'
  | 'config:set'
  | 'license:validate'
  | 'license:activate'
  | 'projects:list'
  | 'projects:add'
  | 'projects:remove'
  | 'update:check'
  | 'update:download'
  | 'window:minimize'
  | 'window:maximize'
  | 'window:close';

// ─────────────────────────────────────────────────────────────
// Dialog 관련 타입
// ─────────────────────────────────────────────────────────────

export interface OpenDialogOptions {
  properties?: Array<'openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles'>;
  defaultPath?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export interface OpenDialogResult {
  canceled: boolean;
  filePaths: string[];
}

// ─────────────────────────────────────────────────────────────
// IPC API 타입 (Preload에서 노출)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// 스킬 스캐너 타입
// ─────────────────────────────────────────────────────────────

export interface SkillInfo {
  name: string;
  description: string;
  trigger: string;
  category?: string;
  version?: string;
  author?: string;
  path: string;
}

export interface MCPServer {
  name: string;
  command?: string;
  args?: string[];
  status: 'configured' | 'unknown';
}

// ─────────────────────────────────────────────────────────────
// Setup 관련 타입
// ─────────────────────────────────────────────────────────────

export interface SetupStatus {
  isSetup: boolean;
  version: string | null;
  skillsDir: string;
  hasSkills: boolean;
  skillCount: number;
}

export interface SetupResult {
  success: boolean;
  message: string;
  details?: string[];
}

export interface SetupVersionInfo {
  installed: string | null;
  current: string;
  needsUpgrade: boolean;
}

export interface McpStatus {
  gemini: 'configured' | 'not_configured' | 'error';
  stitch: 'configured' | 'not_configured' | 'error';
  context7: 'configured' | 'not_configured' | 'error';
  github: 'configured' | 'not_configured' | 'error';
}

export interface McpSetupResult {
  success: boolean;
  message: string;
  needsAuth?: boolean;
}

export interface IPCApi {
  pty: {
    spawn: (command: string, cwd: string, paneId?: string) => Promise<void>;
    write: (data: string, paneId?: string) => void;
    writeCommand: (text: string, paneId?: string) => Promise<boolean>;
    resize: (cols: number, rows: number, paneId?: string) => void;
    kill: (paneId?: string) => void;
    killAll: () => void;
    getCwd: (paneId: string) => Promise<string>;
    startClaude: (cwd: string) => Promise<{ success: boolean }>;
    onData: (callback: (paneId: string, data: string) => void) => () => void;
    onExit: (callback: (paneId: string, code: number) => void) => () => void;
  };
  config: {
    get: <K extends keyof Config>(key: K) => Promise<Config[K]>;
    set: <K extends keyof Config>(key: K, value: Config[K]) => Promise<void>;
    getAll: () => Promise<Config>;
  };
  license: {
    validate: () => Promise<LicenseValidationResult>;
    activate: (key: string) => Promise<LicenseValidationResult>;
    get: () => Promise<License | null>;
  };
  skills: {
    list: () => Promise<SkillInfo[]>;
    categorized: () => Promise<Record<string, SkillInfo[]>>;
    execute: (command: string) => void;
  };
  mcp: {
    list: () => Promise<MCPServer[]>;
  };
  usage: {
    get: () => Promise<UsageUpdateData>;
    onUpdate: (callback: (data: UsageUpdateData) => void) => () => void;
  };
  projects: {
    list: () => Promise<Project[]>;
    add: (path: string) => Promise<Project>;
    remove: (path: string) => Promise<void>;
    open: (path: string) => Promise<void>;
    selectFolder: () => Promise<string | null>;
  };
  dialog: {
    showOpenDialog: (options: OpenDialogOptions) => Promise<OpenDialogResult>;
  };
  update: {
    check: () => Promise<UpdateInfo | null>;
    download: () => Promise<void>;
    install: () => Promise<void>;
    onProgress: (callback: (progress: number) => void) => () => void;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  setup: {
    status: () => Promise<SetupStatus>;
    run: () => Promise<SetupResult>;
    checkCli: () => Promise<boolean>;
    cliInstructions: () => Promise<string>;
    version: () => Promise<SetupVersionInfo>;
    // MCP 설정
    mcpStatus: () => Promise<McpStatus>;
    setupContext7: () => Promise<McpSetupResult>;
    setupStitch: (gcpProjectId: string, apiKey?: string) => Promise<McpSetupResult>;
    setupGemini: () => Promise<McpSetupResult>;
    setupGithub: (token: string) => Promise<McpSetupResult>;
    setupSlackWebhook: (webhookUrl: string) => Promise<McpSetupResult>;
    gcloudAuth: () => Promise<McpSetupResult>;
    checkGcloudAuth: () => Promise<boolean>;
    openOAuth: (service: 'google' | 'github') => Promise<void>;
  };
  commandHistory: {
    list: () => Promise<CommandHistoryEntry[]>;
    add: (command: string) => Promise<void>;
    remove: (command: string) => Promise<void>;
    clear: () => Promise<void>;
  };
  fs: {
    listDir: (path: string) => Promise<{ name: string; is_dir: boolean }[]>;
    readTree: (path: string, maxDepth?: number) => Promise<any[]>;
    readFilePreview: (path: string, maxLines?: number) => Promise<any>;
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    createFile: (path: string) => Promise<void>;
    createDir: (path: string) => Promise<void>;
  };
  fileWatcher: {
    start: (path: string) => Promise<void>;
    stop: () => Promise<void>;
    onChanged: (callback: (change: { path: string; diff: string; change_type: string; timestamp: number }) => void) => () => void;
  };
  session: {
    save: (data: string) => Promise<void>;
    load: () => Promise<string | null>;
  };
}

declare global {
  interface Window {
    api: IPCApi;
  }
}
