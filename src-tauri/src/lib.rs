#![allow(non_snake_case)]
mod commands;
mod pty;
mod session;
mod setup;
mod skills;
mod stores;
mod file_watcher;
mod usage_api;

use commands::{load_command_history, load_projects, CommandHistoryEntry};
use file_watcher::FileWatcherManager;
use pty::PtyPoolManager;
use session::SessionWatcher;
use setup::SetupService;
use stores::config::ConfigStore;
use stores::license::LicenseStore;
use stores::usage::UsageStore;
use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub pty_pool: PtyPoolManager,
    pub config_store: ConfigStore,
    pub license_store: LicenseStore,
    pub usage_store: UsageStore,
    pub session_watcher: SessionWatcher,
    pub setup_service: SetupService,
    pub projects_store: Mutex<Vec<serde_json::Value>>,
    pub command_history: Mutex<Vec<CommandHistoryEntry>>,
    pub file_watcher: FileWatcherManager,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            let resources_path = app
                .path()
                .resource_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."))
                .join("resources")
                .join("skillpack");

            let app_version = app.config().version.clone().unwrap_or_else(|| "1.9.3".to_string());

            let setup_service = SetupService::new(resources_path, app_version);

            // Run setup if needed
            if setup_service.is_first_launch() || setup_service.needs_upgrade() {
                log::info!("Running skillpack setup or upgrade...");
                let result = setup_service.run_setup();
                if !result.success {
                    log::error!("Setup failed: {}", result.message);
                }
            }

            let state = AppState {
                pty_pool: PtyPoolManager::new(),
                config_store: ConfigStore::new(),
                license_store: LicenseStore::new(),
                usage_store: UsageStore::new(),
                session_watcher: SessionWatcher::new(),
                setup_service,
                projects_store: Mutex::new(load_projects()),
                command_history: Mutex::new(load_command_history()),
                file_watcher: FileWatcherManager::new(),
            };

            app.manage(state);

            // DevTools 열기 (개발 모드에서만)
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // PTY
            commands::pty_spawn,
            commands::pty_write,
            commands::pty_write_command,
            commands::pty_start_claude,
            commands::pty_resize,
            commands::pty_kill,
            commands::pty_kill_all,
            // Usage
            commands::usage_get,
            // Skills
            commands::skills_list,
            commands::skills_categorized,
            commands::skills_execute,
            // MCP
            commands::mcp_list,
            // Config
            commands::config_get,
            commands::config_set,
            commands::config_get_all,
            // License
            commands::license_activate,
            commands::license_get,
            commands::license_validate,
            // Projects
            commands::projects_list,
            commands::projects_add,
            commands::projects_remove,
            commands::projects_open,
            commands::projects_select_folder,
            // Dialog
            commands::dialog_show_open,
            // Update
            commands::update_check,
            commands::update_download,
            commands::update_install,
            // Window
            commands::window_minimize,
            commands::window_maximize,
            commands::window_close,
            // Setup
            commands::setup_status,
            commands::setup_run,
            commands::setup_check_cli,
            commands::setup_cli_instructions,
            commands::setup_version,
            commands::setup_mcp_status,
            commands::setup_mcp_context7,
            commands::setup_mcp_stitch,
            commands::setup_mcp_gemini,
            commands::setup_mcp_github,
            commands::setup_slack_webhook,
            commands::setup_gcloud_auth,
            commands::setup_check_gcloud_auth,
            commands::setup_open_oauth,
            // Command History
            commands::command_history_list,
            commands::command_history_add,
            commands::command_history_remove,
            commands::command_history_clear,
            // Filesystem & PTY CWD
            commands::fs_list_dir,
            commands::pty_get_cwd,
            // Filesystem Context
            commands::fs_read_tree,
            commands::fs_read_file_preview,
            commands::fs_read_file,
            commands::fs_write_file,
            commands::fs_create_file,
            commands::fs_create_dir,
            // File Watcher
            commands::file_watcher_start,
            commands::file_watcher_stop,
        ])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let app = window.app_handle();
                if let Some(state) = app.try_state::<AppState>() {
                    log::info!("Window destroyed, cleaning up...");
                    state.session_watcher.stop();
                    state.file_watcher.stop();
                    state.pty_pool.kill_all();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
