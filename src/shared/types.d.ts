export type Theme = 'dark' | 'light';
export type Language = 'ko' | 'en';
export type CursorStyle = 'block' | 'underline' | 'bar';
export type SkillCategory = 'planning' | 'implementation' | 'verification' | 'utility';
export interface Skill {
    name: string;
    command: string;
    category: SkillCategory;
    description: string;
    icon?: string;
}
export type WorkflowStatus = 'pending' | 'current' | 'completed';
export interface WorkflowStep {
    name: string;
    skill: string;
    status: WorkflowStatus;
}
export type TerminalStatus = 'idle' | 'running' | 'waiting_input' | 'waiting_selection';
export interface SelectionOption {
    label: string;
    value: string;
    selected: boolean;
}
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
export declare function getUsageLevel(percentage: number): UsageLevel;
export interface Project {
    path: string;
    name: string;
    lastOpened: Date;
    skillpackVersion: string;
}
export interface Config {
    theme: Theme;
    language: Language;
    terminal: TerminalConfig;
    skillpack: SkillpackConfig;
}
export interface TerminalConfig {
    fontSize: number;
    fontFamily: string;
    cursorStyle: CursorStyle;
    cursorBlink: boolean;
    scrollback: number;
}
export interface SkillpackConfig {
    autoUpdate: boolean;
    skillsPath: string;
}
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
export interface UpdateInfo {
    version: string;
    releaseNotes: string;
    downloadUrl: string;
    publishedAt: Date;
}
export type UpdateStatus = 'checking' | 'available' | 'downloading' | 'ready' | 'not_available' | 'error';
export type IPCChannel = 'pty:spawn' | 'pty:write' | 'pty:data' | 'pty:resize' | 'pty:exit' | 'skills:list' | 'skills:execute' | 'config:get' | 'config:set' | 'license:validate' | 'license:activate' | 'projects:list' | 'projects:add' | 'projects:remove' | 'update:check' | 'update:download' | 'window:minimize' | 'window:maximize' | 'window:close';
export interface IPCApi {
    pty: {
        spawn: (command: string, cwd: string) => Promise<void>;
        write: (data: string) => void;
        resize: (cols: number, rows: number) => void;
        kill: () => void;
        onData: (callback: (data: string) => void) => () => void;
        onExit: (callback: (code: number) => void) => () => void;
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
        list: () => Promise<Skill[]>;
        execute: (command: string) => void;
    };
    projects: {
        list: () => Promise<Project[]>;
        add: (path: string) => Promise<Project>;
        remove: (path: string) => Promise<void>;
        open: (path: string) => Promise<void>;
    };
    update: {
        check: () => Promise<UpdateInfo | null>;
        download: () => Promise<void>;
        onProgress: (callback: (progress: number) => void) => () => void;
    };
    window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
    };
}
declare global {
    interface Window {
        api: IPCApi;
    }
}
//# sourceMappingURL=types.d.ts.map