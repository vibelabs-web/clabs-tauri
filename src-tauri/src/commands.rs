use crate::AppState;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, State};

// ─────────────────────────────────────────────────────────────
// PTY Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn pty_spawn(
    state: State<'_, AppState>,
    app: AppHandle,
    _command: String,
    cwd: String,
    pane_id: Option<String>,
) -> Result<u32, String> {
    let pane_id = pane_id.unwrap_or_else(|| "pane-default".to_string());
    let home = dirs::home_dir().unwrap_or_default();

    let resolved_cwd = if cwd == "." {
        std::env::current_dir()
            .unwrap_or(home.clone())
            .to_string_lossy()
            .to_string()
    } else if cwd == "~" || cwd.starts_with("~/") {
        cwd.replacen("~", &home.to_string_lossy(), 1)
    } else {
        cwd
    };

    // Start task tracking on first pane
    if !state.pty_pool.has_any_running() {
        state.usage_store.start_task("current-session");
    }

    state.pty_pool.spawn(&pane_id, &resolved_cwd, app)
}

#[tauri::command]
pub async fn pty_write(
    state: State<'_, AppState>,
    pane_id: String,
    data: String,
) -> Result<bool, String> {
    // Backward compat: if data is empty, treat pane_id as data
    let (target_pane, target_data) = if data.is_empty() {
        ("pane-default".to_string(), pane_id)
    } else {
        (pane_id, data)
    };

    match state.pty_pool.write(&target_pane, &target_data) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn pty_write_command(
    state: State<'_, AppState>,
    pane_id: String,
    text: String,
) -> Result<bool, String> {
    let (target_pane, target_text) = if text.is_empty() {
        ("pane-default".to_string(), pane_id)
    } else {
        (pane_id, text)
    };

    match state.pty_pool.write_command(&target_pane, &target_text) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn pty_start_claude(
    state: State<'_, AppState>,
    app: AppHandle,
    cwd: String,
) -> Result<Value, String> {
    if !state.pty_pool.has_any_running() {
        return Err("PTY not running".to_string());
    }

    state.session_watcher.start(&cwd, app);
    Ok(serde_json::json!({"success": true}))
}

#[tauri::command]
pub async fn pty_resize(
    state: State<'_, AppState>,
    pane_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    state.pty_pool.resize(&pane_id, cols, rows)
}

#[tauri::command]
pub async fn pty_kill(state: State<'_, AppState>, pane_id: Option<String>) -> Result<(), String> {
    let pane_id = pane_id.unwrap_or_else(|| "pane-default".to_string());
    state.pty_pool.kill(&pane_id);
    if !state.pty_pool.has_any_running() {
        state.session_watcher.stop();
    }
    Ok(())
}

#[tauri::command]
pub async fn pty_kill_all(state: State<'_, AppState>) -> Result<(), String> {
    state.session_watcher.stop();
    state.pty_pool.kill_all();
    Ok(())
}

// ─────────────────────────────────────────────────────────────
// Usage Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn usage_get(state: State<'_, AppState>) -> Result<Value, String> {
    let session_usage = state.session_watcher.get_usage();
    let api_usage = crate::usage_api::get_usage_data().await;

    Ok(serde_json::json!({
        "tokensUsed": session_usage.total_tokens,
        "contextLimit": 1_000_000u64,
        "dailyTokensUsed": session_usage.total_tokens,
        "inputTokens": session_usage.input_tokens,
        "outputTokens": session_usage.output_tokens,
        "cacheReadTokens": session_usage.cache_read_tokens,
        "cacheCreationTokens": session_usage.cache_creation_tokens,
        "messageCount": session_usage.message_count,
        "fiveHourUsage": api_usage.as_ref().map(|u| u.five_hour.utilization),
        "fiveHourReset": api_usage.as_ref().and_then(|u| u.five_hour.resets_at.clone()),
        "sevenDayUsage": api_usage.as_ref().map(|u| u.seven_day.utilization),
        "sevenDayReset": api_usage.as_ref().and_then(|u| u.seven_day.resets_at.clone()),
    }))
}

// ─────────────────────────────────────────────────────────────
// Skills Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn skills_list(_state: State<'_, AppState>) -> Result<Value, String> {
    let scanner = crate::skills::SkillScanner::new();
    let skills = scanner.scan();
    serde_json::to_value(&skills).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skills_categorized(_state: State<'_, AppState>) -> Result<Value, String> {
    let scanner = crate::skills::SkillScanner::new();
    let skills = scanner.scan();
    let categorized = scanner.categorize(&skills);
    serde_json::to_value(&categorized).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn skills_execute(state: State<'_, AppState>, command: String) -> Result<(), String> {
    let pane_ids = state.pty_pool.get_running_pane_ids();
    if let Some(pane_id) = pane_ids.first() {
        let clean = command.trim();
        // Write char by char
        for ch in clean.chars() {
            if !state.pty_pool.is_running(pane_id) {
                break;
            }
            state.pty_pool.write(pane_id, &ch.to_string())?;
            tokio::time::sleep(tokio::time::Duration::from_millis(5)).await;
        }
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
        if state.pty_pool.is_running(pane_id) {
            state.pty_pool.write(pane_id, "\r")?;
        }
    }
    Ok(())
}

// ─────────────────────────────────────────────────────────────
// MCP Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn mcp_list() -> Result<Value, String> {
    let home = dirs::home_dir().unwrap_or_default();
    let mut mcp_servers: Vec<Value> = Vec::new();

    // 1. Check settings.local.json
    let local_path = home.join(".claude").join("settings.local.json");
    if let Ok(content) = fs::read_to_string(&local_path) {
        if let Ok(settings) = serde_json::from_str::<Value>(&content) {
            if let Some(servers) = settings.get("enabledMcpjsonServers").and_then(|v| v.as_array()) {
                for name in servers {
                    if let Some(n) = name.as_str() {
                        mcp_servers.push(serde_json::json!({
                            "name": n,
                            "status": "configured"
                        }));
                    }
                }
            }
        }
    }

    // 2. Check settings.json
    let settings_path = home.join(".claude").join("settings.json");
    if let Ok(content) = fs::read_to_string(&settings_path) {
        if let Ok(settings) = serde_json::from_str::<Value>(&content) {
            if let Some(servers) = settings.get("mcpServers").and_then(|v| v.as_object()) {
                for (name, _config) in servers {
                    if !mcp_servers.iter().any(|s| s.get("name").and_then(|n| n.as_str()) == Some(name)) {
                        mcp_servers.push(serde_json::json!({
                            "name": name,
                            "status": "configured"
                        }));
                    }
                }
            }
        }
    }

    Ok(serde_json::to_value(&mcp_servers).unwrap_or_default())
}

// ─────────────────────────────────────────────────────────────
// Config Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn config_get(state: State<'_, AppState>, key: String) -> Result<Value, String> {
    Ok(state.config_store.get_value(&key))
}

#[tauri::command]
pub async fn config_set(
    state: State<'_, AppState>,
    key: String,
    value: Value,
) -> Result<(), String> {
    state.config_store.set_value(&key, value);
    Ok(())
}

#[tauri::command]
pub async fn config_get_all(state: State<'_, AppState>) -> Result<Value, String> {
    let config = state.config_store.get_all();
    serde_json::to_value(&config).map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────
// License Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn license_activate(
    state: State<'_, AppState>,
    key: String,
) -> Result<Value, String> {
    let pattern = regex::Regex::new(r"^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$").unwrap();
    if !pattern.is_match(&key) {
        return Ok(serde_json::json!({
            "isValid": false,
            "error": "라이선스 키 형식이 올바르지 않습니다."
        }));
    }

    let valid = state.license_store.validate(&key).await;
    if !valid {
        return Ok(serde_json::json!({
            "isValid": false,
            "error": "유효하지 않은 라이선스 키입니다."
        }));
    }

    state.license_store.set(&key).map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "isValid": true,
        "remainingDays": 365
    }))
}

#[tauri::command]
pub async fn license_get(state: State<'_, AppState>) -> Result<Value, String> {
    match state.license_store.get() {
        Some(key) => Ok(serde_json::json!({
            "key": key,
            "activatedAt": chrono::Utc::now().to_rfc3339(),
            "expiresAt": (chrono::Utc::now() + chrono::Duration::days(365)).to_rfc3339(),
            "upgradeExpiresAt": (chrono::Utc::now() + chrono::Duration::days(365)).to_rfc3339(),
            "email": "user@example.com",
            "machineId": "machine-id-placeholder"
        })),
        None => Ok(Value::Null),
    }
}

#[tauri::command]
pub async fn license_validate(state: State<'_, AppState>) -> Result<Value, String> {
    match state.license_store.get() {
        None => Ok(serde_json::json!({
            "isValid": false,
            "error": "라이선스가 등록되지 않았습니다."
        })),
        Some(key) => {
            let valid = state.license_store.validate(&key).await;
            if valid {
                Ok(serde_json::json!({
                    "isValid": true,
                    "remainingDays": 365
                }))
            } else {
                Ok(serde_json::json!({
                    "isValid": false,
                    "error": "라이선스가 유효하지 않습니다."
                }))
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────
// Projects Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn projects_list(state: State<'_, AppState>) -> Result<Value, String> {
    let projects = state.projects_store.lock().unwrap().clone();
    serde_json::to_value(&projects).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn projects_add(
    state: State<'_, AppState>,
    path: String,
) -> Result<Value, String> {
    if !std::path::Path::new(&path).exists() {
        return Err("프로젝트 디렉토리를 찾을 수 없습니다.".to_string());
    }

    let name = std::path::Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let project = serde_json::json!({
        "path": path,
        "name": name,
        "lastOpened": chrono::Utc::now().to_rfc3339(),
        "skillpackVersion": "1.8.0"
    });

    let mut projects = state.projects_store.lock().unwrap();
    projects.retain(|p| p.get("path").and_then(|v| v.as_str()) != Some(&path));
    projects.insert(0, project.clone());
    projects.truncate(20);

    // Save to disk
    save_projects(&projects);

    Ok(project)
}

#[tauri::command]
pub async fn projects_remove(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let mut projects = state.projects_store.lock().unwrap();
    projects.retain(|p| p.get("path").and_then(|v| v.as_str()) != Some(&path));
    save_projects(&projects);
    Ok(())
}

#[tauri::command]
pub async fn projects_open(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let name = std::path::Path::new(&path)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let project = serde_json::json!({
        "path": path,
        "name": name,
        "lastOpened": chrono::Utc::now().to_rfc3339(),
        "skillpackVersion": "1.8.0"
    });

    let mut projects = state.projects_store.lock().unwrap();
    projects.retain(|p| p.get("path").and_then(|v| v.as_str()) != Some(&path));
    projects.insert(0, project);
    projects.truncate(20);
    save_projects(&projects);
    Ok(())
}

#[tauri::command]
pub async fn projects_select_folder() -> Result<Value, String> {
    // Use tauri dialog plugin
    Ok(Value::Null) // Will be handled by frontend using @tauri-apps/plugin-dialog
}

// ─────────────────────────────────────────────────────────────
// Dialog Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn dialog_show_open(_options: Value) -> Result<Value, String> {
    // Frontend will use @tauri-apps/plugin-dialog directly
    Ok(serde_json::json!({"canceled": true, "filePaths": []}))
}

// ─────────────────────────────────────────────────────────────
// Update Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn update_check() -> Result<Value, String> {
    // TODO: tauri-plugin-updater integration
    Ok(Value::Null)
}

#[tauri::command]
pub async fn update_download() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn update_install() -> Result<(), String> {
    Ok(())
}

// ─────────────────────────────────────────────────────────────
// Window Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn window_minimize(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn window_maximize(window: tauri::Window) -> Result<(), String> {
    if window.is_maximized().unwrap_or(false) {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub async fn window_close(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────
// Setup Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn setup_status(state: State<'_, AppState>) -> Result<Value, String> {
    let status = state.setup_service.get_setup_status();
    serde_json::to_value(&status).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_run(state: State<'_, AppState>) -> Result<Value, String> {
    let result = state.setup_service.run_setup();
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_check_cli(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(state.setup_service.check_claude_cli())
}

#[tauri::command]
pub async fn setup_cli_instructions(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.setup_service.get_cli_instructions())
}

#[tauri::command]
pub async fn setup_version(state: State<'_, AppState>) -> Result<Value, String> {
    let info = crate::setup::SetupVersionInfo {
        installed: state.setup_service.get_installed_version(),
        current: state.setup_service.get_current_version(),
        needs_upgrade: state.setup_service.needs_upgrade(),
    };
    serde_json::to_value(&info).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_mcp_status(state: State<'_, AppState>) -> Result<Value, String> {
    let status = state.setup_service.get_mcp_status();
    serde_json::to_value(&status).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_mcp_context7(state: State<'_, AppState>) -> Result<Value, String> {
    let result = state.setup_service.setup_context7();
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_mcp_stitch(
    state: State<'_, AppState>,
    gcp_project_id: String,
    api_key: Option<String>,
) -> Result<Value, String> {
    let result = state.setup_service.setup_stitch(&gcp_project_id, api_key.as_deref());
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_mcp_gemini(state: State<'_, AppState>) -> Result<Value, String> {
    let result = state.setup_service.setup_gemini();
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_mcp_github(
    state: State<'_, AppState>,
    token: String,
) -> Result<Value, String> {
    let result = state.setup_service.setup_github(&token);
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_slack_webhook(
    state: State<'_, AppState>,
    webhook_url: String,
) -> Result<Value, String> {
    let result = state.setup_service.setup_slack_webhook(&webhook_url);
    serde_json::to_value(&result).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn setup_gcloud_auth(state: State<'_, AppState>) -> Result<Value, String> {
    let result = if state.setup_service.check_gcloud_auth() {
        serde_json::json!({"success": true, "message": "이미 인증되어 있습니다."})
    } else {
        serde_json::json!({"success": false, "message": "gcloud 인증이 필요합니다."})
    };
    Ok(result)
}

#[tauri::command]
pub async fn setup_check_gcloud_auth(state: State<'_, AppState>) -> Result<bool, String> {
    Ok(state.setup_service.check_gcloud_auth())
}

#[tauri::command]
pub async fn setup_open_oauth(
    state: State<'_, AppState>,
    service: String,
) -> Result<(), String> {
    state.setup_service.open_oauth_url(&service);
    Ok(())
}

// ─────────────────────────────────────────────────────────────
// Command History Commands
// ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandHistoryEntry {
    pub command: String,
    pub timestamp: u64,
}

#[tauri::command]
pub async fn command_history_list(state: State<'_, AppState>) -> Result<Value, String> {
    let history = state.command_history.lock().unwrap().clone();
    serde_json::to_value(&history).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn command_history_add(
    state: State<'_, AppState>,
    command: String,
) -> Result<(), String> {
    let mut history = state.command_history.lock().unwrap();
    history.retain(|h| h.command != command);
    history.insert(
        0,
        CommandHistoryEntry {
            command,
            timestamp: chrono::Utc::now().timestamp_millis() as u64,
        },
    );
    history.truncate(50);
    save_command_history(&history);
    Ok(())
}

#[tauri::command]
pub async fn command_history_remove(
    state: State<'_, AppState>,
    command: String,
) -> Result<(), String> {
    let mut history = state.command_history.lock().unwrap();
    history.retain(|h| h.command != command);
    save_command_history(&history);
    Ok(())
}

#[tauri::command]
pub async fn command_history_clear(state: State<'_, AppState>) -> Result<(), String> {
    let mut history = state.command_history.lock().unwrap();
    history.clear();
    save_command_history(&history);
    Ok(())
}

// ─────────────────────────────────────────────────────────────
// Filesystem (Tab completion)
// ─────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct DirEntry {
    name: String,
    is_dir: bool,
}

/// PTY 프로세스의 현재 작업 디렉토리 조회
#[tauri::command]
pub fn pty_get_cwd(state: State<'_, AppState>, pane_id: String) -> Result<String, String> {
    state.pty_pool.get_cwd(&pane_id)
}

/// 디렉토리 내 항목 목록 반환 (InputBox 탭 자동완성용)
#[tauri::command]
pub fn fs_list_dir(path: String) -> Result<Vec<DirEntry>, String> {
    let target = if path.is_empty() || path == "." {
        std::env::current_dir().map_err(|e| e.to_string())?
    } else {
        let expanded = if path.starts_with("~/") {
            let home = dirs::home_dir().unwrap_or_default();
            home.join(&path[2..])
        } else if path == "~" {
            dirs::home_dir().unwrap_or_default()
        } else {
            PathBuf::from(&path)
        };
        expanded
    };

    let entries = fs::read_dir(&target).map_err(|e| format!("{}: {}", target.display(), e))?;
    let mut result: Vec<DirEntry> = Vec::new();
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();
        let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
        result.push(DirEntry { name, is_dir });
    }
    result.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(result)
}

// ─────────────────────────────────────────────────────────────
// Filesystem Context Commands
// ─────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct FileTreeNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileTreeNode>>,
}

#[tauri::command]
pub async fn fs_read_tree(path: String, max_depth: Option<u32>) -> Result<Vec<FileTreeNode>, String> {
    let root = std::path::Path::new(&path);
    if !root.exists() || !root.is_dir() {
        return Err("유효하지 않은 디렉토리입니다".to_string());
    }

    let depth = max_depth.unwrap_or(3);
    Ok(read_tree_recursive(root, 0, depth))
}

fn read_tree_recursive(dir: &std::path::Path, current_depth: u32, max_depth: u32) -> Vec<FileTreeNode> {
    if current_depth >= max_depth {
        return Vec::new();
    }

    let ignore_dirs = [".git", "node_modules", "target", ".next", "dist", "__pycache__", ".DS_Store"];

    let mut entries: Vec<FileTreeNode> = Vec::new();

    if let Ok(read_dir) = fs::read_dir(dir) {
        let mut items: Vec<_> = read_dir.flatten().collect();
        items.sort_by(|a, b| {
            let a_is_dir = a.file_type().map(|t| t.is_dir()).unwrap_or(false);
            let b_is_dir = b.file_type().map(|t| t.is_dir()).unwrap_or(false);
            // 디렉토리 우선, 그 다음 이름순
            b_is_dir.cmp(&a_is_dir).then_with(|| {
                a.file_name().to_string_lossy().to_lowercase().cmp(
                    &b.file_name().to_string_lossy().to_lowercase()
                )
            })
        });

        for entry in items {
            let name = entry.file_name().to_string_lossy().to_string();

            // 무시할 항목
            if ignore_dirs.contains(&name.as_str()) || name.starts_with('.') {
                continue;
            }

            let path = entry.path();
            let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);

            let children = if is_dir {
                Some(read_tree_recursive(&path, current_depth + 1, max_depth))
            } else {
                None
            };

            entries.push(FileTreeNode {
                name,
                path: path.to_string_lossy().to_string(),
                is_dir,
                children,
            });
        }
    }

    entries
}

#[derive(Serialize)]
pub struct FilePreview {
    content: String,
    total_lines: usize,
    file_size: u64,
    extension: String,
}

#[tauri::command]
pub async fn fs_read_file_preview(path: String, max_lines: Option<usize>) -> Result<FilePreview, String> {
    let file_path = std::path::Path::new(&path);
    if !file_path.exists() || !file_path.is_file() {
        return Err("파일을 찾을 수 없습니다".to_string());
    }

    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    let file_size = metadata.len();

    // 너무 큰 파일은 거부 (5MB)
    if file_size > 5_242_880 {
        return Ok(FilePreview {
            content: "(파일이 너무 큽니다)".to_string(),
            total_lines: 0,
            file_size,
            extension: file_path.extension().unwrap_or_default().to_string_lossy().to_string(),
        });
    }

    let content = fs::read_to_string(&path).map_err(|_| "바이너리 파일은 미리보기할 수 없습니다".to_string())?;
    let lines: Vec<&str> = content.lines().collect();
    let total_lines = lines.len();
    let limit = max_lines.unwrap_or(100);
    let preview = lines[..std::cmp::min(limit, total_lines)].join("\n");

    Ok(FilePreview {
        content: preview,
        total_lines,
        file_size,
        extension: file_path.extension().unwrap_or_default().to_string_lossy().to_string(),
    })
}

// ─────────────────────────────────────────────────────────────
// Filesystem Read/Write Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn fs_read_file(path: String) -> Result<String, String> {
    let file_path = std::path::Path::new(&path);
    if !file_path.exists() || !file_path.is_file() {
        return Err("파일을 찾을 수 없습니다".to_string());
    }

    let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
    if metadata.len() > 5_242_880 {
        return Err("파일이 너무 큽니다 (5MB 제한)".to_string());
    }

    fs::read_to_string(&path).map_err(|_| "바이너리 파일은 읽을 수 없습니다".to_string())
}

#[tauri::command]
pub async fn fs_write_file(path: String, content: String) -> Result<(), String> {
    let file_path = std::path::Path::new(&path);
    if !file_path.exists() || !file_path.is_file() {
        return Err("파일을 찾을 수 없습니다".to_string());
    }

    fs::write(&path, &content).map_err(|e| format!("파일 저장 실패: {}", e))
}

#[tauri::command]
pub async fn fs_create_file(path: String) -> Result<(), String> {
    let file_path = std::path::Path::new(&path);
    if file_path.exists() {
        return Err("이미 존재하는 파일입니다".to_string());
    }

    // 부모 디렉토리가 있는지 확인
    if let Some(parent) = file_path.parent() {
        if !parent.exists() {
            return Err("부모 디렉토리가 존재하지 않습니다".to_string());
        }
    }

    fs::write(&path, "").map_err(|e| format!("파일 생성 실패: {}", e))
}

#[tauri::command]
pub async fn fs_create_dir(path: String) -> Result<(), String> {
    let dir_path = std::path::Path::new(&path);
    if dir_path.exists() {
        return Err("이미 존재하는 디렉토리입니다".to_string());
    }

    if let Some(parent) = dir_path.parent() {
        if !parent.exists() {
            return Err("부모 디렉토리가 존재하지 않습니다".to_string());
        }
    }

    fs::create_dir(&path).map_err(|e| format!("디렉토리 생성 실패: {}", e))
}

// ─────────────────────────────────────────────────────────────
// File Watcher Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn file_watcher_start(
    state: State<'_, AppState>,
    app: AppHandle,
    path: String,
) -> Result<(), String> {
    state.file_watcher.start(&path, app)
}

#[tauri::command]
pub async fn file_watcher_stop(state: State<'_, AppState>) -> Result<(), String> {
    state.file_watcher.stop();
    Ok(())
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

fn projects_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap().join(".config"))
        .join("com.claudelabs.clabs");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("projects.json")
}

fn save_projects(projects: &[Value]) {
    let path = projects_path();
    if let Ok(json) = serde_json::to_string_pretty(projects) {
        fs::write(path, json).ok();
    }
}

pub fn load_projects() -> Vec<Value> {
    let path = projects_path();
    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|c| serde_json::from_str(&c).ok())
            .unwrap_or_default()
    } else {
        Vec::new()
    }
}

fn command_history_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap().join(".config"))
        .join("com.claudelabs.clabs");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("command-history.json")
}

fn save_command_history(history: &[CommandHistoryEntry]) {
    let path = command_history_path();
    if let Ok(json) = serde_json::to_string_pretty(history) {
        fs::write(path, json).ok();
    }
}

pub fn load_command_history() -> Vec<CommandHistoryEntry> {
    let path = command_history_path();
    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|c| serde_json::from_str(&c).ok())
            .unwrap_or_default()
    } else {
        Vec::new()
    }
}
