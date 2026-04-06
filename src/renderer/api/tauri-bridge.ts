/**
 * Tauri Bridge - window.api 호환 래퍼
 *
 * Electron의 contextBridge.exposeInMainWorld('api', ...) 인터페이스를
 * Tauri의 invoke/listen으로 매핑하여 Renderer 변경 최소화
 */
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { IPCApi, Config, Skill, Project, License, LicenseValidationResult, UpdateInfo, OpenDialogOptions, OpenDialogResult, UsageUpdateData } from '@shared/types';
import type { CommandHistoryEntry } from '@shared/claude-cli';

const api: IPCApi = {
  pty: {
    spawn: (command: string, cwd: string, paneId?: string) =>
      invoke('pty_spawn', { command, cwd, paneId: paneId || 'pane-default' }),

    write: (data: string, paneId?: string) => {
      const id = paneId || 'pane-default';
      invoke('pty_write', { paneId: id, data }).catch((err) => {
        console.error('[tauri-bridge] pty_write error:', err, { paneId: id, dataLen: data.length });
      });
    },

    writeCommand: (text: string, paneId?: string) =>
      invoke('pty_write_command', { paneId: paneId || 'pane-default', text }),

    resize: (cols: number, rows: number, paneId?: string) => {
      invoke('pty_resize', { paneId: paneId || 'pane-default', cols, rows }).catch(() => {});
    },

    kill: (paneId?: string) => {
      invoke('pty_kill', { paneId: paneId || 'pane-default' }).catch(() => {});
    },

    killAll: () => {
      invoke('pty_kill_all').catch(() => {});
    },

    getCwd: (paneId: string) => invoke('pty_get_cwd', { paneId }) as Promise<string>,

    startClaude: (cwd: string) =>
      invoke('pty_start_claude', { cwd }),

    onData: (callback: (paneId: string, data: string) => void) => {
      let unlisten: UnlistenFn | null = null;
      listen<{ paneId: string; data: string }>('pty:data', (event) => {
        callback(event.payload.paneId, event.payload.data);
      }).then(fn => { unlisten = fn; });

      return () => { unlisten?.(); };
    },

    onExit: (callback: (paneId: string, code: number) => void) => {
      let unlisten: UnlistenFn | null = null;
      listen<{ paneId: string; code: number }>('pty:exit', (event) => {
        callback(event.payload.paneId, event.payload.code);
      }).then(fn => { unlisten = fn; });

      return () => { unlisten?.(); };
    },
  },

  config: {
    get: <K extends keyof Config>(key: K) =>
      invoke('config_get', { key }) as Promise<Config[K]>,

    set: <K extends keyof Config>(key: K, value: Config[K]) =>
      invoke('config_set', { key, value }) as Promise<void>,

    getAll: () =>
      invoke('config_get_all') as Promise<Config>,
  },

  license: {
    validate: () =>
      invoke('license_validate') as Promise<LicenseValidationResult>,

    activate: (key: string) =>
      invoke('license_activate', { key }) as Promise<LicenseValidationResult>,

    get: () =>
      invoke('license_get') as Promise<License | null>,
  },

  skills: {
    list: () => invoke('skills_list'),
    categorized: () => invoke('skills_categorized'),
    execute: (command: string) => {
      invoke('skills_execute', { command }).catch(() => {});
    },
  },

  mcp: {
    list: () => invoke('mcp_list'),
  },

  usage: {
    get: () => invoke('usage_get') as Promise<UsageUpdateData>,
    onUpdate: (callback: (data: UsageUpdateData) => void) => {
      let unlisten: UnlistenFn | null = null;
      listen<UsageUpdateData>('usage:update', (event) => {
        callback(event.payload);
      }).then(fn => { unlisten = fn; });

      return () => { unlisten?.(); };
    },
  },

  projects: {
    list: () => invoke('projects_list') as Promise<Project[]>,
    add: (path: string) => invoke('projects_add', { path }) as Promise<Project>,
    remove: (path: string) => invoke('projects_remove', { path }) as Promise<void>,
    open: (path: string) => invoke('projects_open', { path }) as Promise<void>,
    selectFolder: async () => {
      // Use Tauri dialog plugin directly
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const selected = await open({ directory: true, title: '프로젝트 폴더 선택' });
        return selected as string | null;
      } catch {
        return null;
      }
    },
  },

  dialog: {
    showOpenDialog: async (options: OpenDialogOptions) => {
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const isDir = options.properties?.includes('openDirectory');
        const multiple = options.properties?.includes('multiSelections');

        const selected = await open({
          directory: isDir,
          multiple,
          defaultPath: options.defaultPath,
          title: '파일 선택',
        });

        if (!selected) {
          return { canceled: true, filePaths: [] };
        }

        const filePaths = Array.isArray(selected) ? selected : [selected];
        return { canceled: false, filePaths };
      } catch {
        return { canceled: true, filePaths: [] };
      }
    },
  },

  update: {
    check: () => invoke('update_check') as Promise<UpdateInfo | null>,
    download: () => invoke('update_download') as Promise<void>,
    install: () => invoke('update_install') as Promise<void>,
    onProgress: (callback: (progress: number) => void) => {
      let unlisten: UnlistenFn | null = null;
      listen<number>('update:progress', (event) => {
        callback(event.payload);
      }).then(fn => { unlisten = fn; });

      return () => { unlisten?.(); };
    },
  },

  window: {
    minimize: () => { invoke('window_minimize').catch(() => {}); },
    maximize: () => { invoke('window_maximize').catch(() => {}); },
    close: () => { invoke('window_close').catch(() => {}); },
  },

  setup: {
    status: () => invoke('setup_status'),
    run: () => invoke('setup_run'),
    checkCli: () => invoke('setup_check_cli') as Promise<boolean>,
    cliInstructions: () => invoke('setup_cli_instructions') as Promise<string>,
    version: () => invoke('setup_version'),
    mcpStatus: () => invoke('setup_mcp_status'),
    setupContext7: () => invoke('setup_mcp_context7'),
    setupStitch: (gcpProjectId: string, apiKey?: string) =>
      invoke('setup_mcp_stitch', { gcpProjectId, apiKey }),
    setupGemini: () => invoke('setup_mcp_gemini'),
    setupGithub: (token: string) => invoke('setup_mcp_github', { token }),
    setupSlackWebhook: (webhookUrl: string) =>
      invoke('setup_slack_webhook', { webhookUrl }),
    gcloudAuth: () => invoke('setup_gcloud_auth'),
    checkGcloudAuth: () => invoke('setup_check_gcloud_auth') as Promise<boolean>,
    openOAuth: (service: 'google' | 'github') =>
      invoke('setup_open_oauth', { service }) as Promise<void>,
  },

  commandHistory: {
    list: () => invoke('command_history_list') as Promise<CommandHistoryEntry[]>,
    add: (command: string) => invoke('command_history_add', { command }) as Promise<void>,
    remove: (command: string) => invoke('command_history_remove', { command }) as Promise<void>,
    clear: () => invoke('command_history_clear') as Promise<void>,
  },

  fs: {
    listDir: (path: string) => invoke('fs_list_dir', { path }) as Promise<{ name: string; is_dir: boolean }[]>,
    readTree: (path: string, maxDepth?: number) =>
      invoke('fs_read_tree', { path, maxDepth: maxDepth || 3 }) as Promise<any[]>,
    readFilePreview: (path: string, maxLines?: number) =>
      invoke('fs_read_file_preview', { path, maxLines: maxLines || 100 }) as Promise<any>,
    readFile: (path: string) => invoke('fs_read_file', { path }) as Promise<string>,
    writeFile: (path: string, content: string) => invoke('fs_write_file', { path, content }) as Promise<void>,
    createFile: (path: string) => invoke('fs_create_file', { path }) as Promise<void>,
    createDir: (path: string) => invoke('fs_create_dir', { path }) as Promise<void>,
  },

  fileWatcher: {
    start: (path: string) => invoke('file_watcher_start', { path }),
    stop: () => invoke('file_watcher_stop'),
    onChanged: (callback: (change: { path: string; diff: string; change_type: string; timestamp: number }) => void) => {
      let unlisten: UnlistenFn | null = null;
      listen<{ path: string; diff: string; change_type: string; timestamp: number }>('file:changed', (event) => {
        callback(event.payload);
      }).then(fn => { unlisten = fn; });
      return () => { unlisten?.(); };
    },
  },

  session: {
    save: (data: string) => invoke('session_save', { data }) as Promise<void>,
    load: () => invoke('session_load') as Promise<string | null>,
  },

  ghostty: {
    create: (paneId: string, config: Record<string, unknown>) =>
      invoke('ghostty_create', { paneId, config }) as Promise<void>,

    destroy: (paneId: string) =>
      invoke('ghostty_destroy', { paneId }) as Promise<void>,

    setFrame: (paneId: string, x: number, y: number, width: number, height: number) =>
      invoke('ghostty_set_frame', { paneId, x, y, width, height }) as Promise<void>,

    setVisible: (paneId: string, visible: boolean) =>
      invoke('ghostty_set_visible', { paneId, visible }) as Promise<void>,

    focus: (paneId: string) =>
      invoke('ghostty_focus', { paneId }) as Promise<void>,

    applyTheme: (paneId: string, theme: Record<string, string>) =>
      invoke('ghostty_apply_theme', { paneId, theme }) as Promise<void>,

    search: (paneId: string, query: string, direction: 'next' | 'prev') =>
      invoke('ghostty_search', { paneId, query, direction }) as Promise<void>,

    searchClear: (paneId: string) =>
      invoke('ghostty_search_clear', { paneId }) as Promise<void>,

    getSelection: (paneId: string) =>
      invoke('ghostty_get_selection', { paneId }) as Promise<string>,

    getBufferText: (paneId: string, maxLines: number) =>
      invoke('ghostty_get_buffer_text', { paneId, maxLines }) as Promise<string[]>,

    copy: (paneId: string) =>
      invoke('ghostty_copy', { paneId }) as Promise<string>,

    paste: (paneId: string, text: string) =>
      invoke('ghostty_paste', { paneId, text }) as Promise<void>,
  },
};

// Expose as window.api for compatibility
(window as any).api = api;

console.log('[tauri-bridge] window.api initialized', Object.keys(api));

export default api;
