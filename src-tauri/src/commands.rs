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
// Orchestrator Commands
// ─────────────────────────────────────────────────────────────

/// Open a new Clabs instance (Cmd+Shift+N)
#[tauri::command]
pub async fn open_new_instance() -> Result<(), String> {
    // macOS: open -n to force new instance
    #[cfg(target_os = "macos")]
    {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        // Find the .app bundle (go up from MacOS/clabs to Clabs.app)
        let app_path = exe.parent() // MacOS/
            .and_then(|p| p.parent()) // Contents/
            .and_then(|p| p.parent()); // Clabs.app/

        if let Some(app) = app_path {
            std::process::Command::new("open")
                .args(["-n", &app.to_string_lossy()])
                .spawn()
                .map_err(|e| format!("Failed to open new instance: {}", e))?;
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        std::process::Command::new(&exe)
            .spawn()
            .map_err(|e| format!("Failed to open new instance: {}", e))?;
    }

    Ok(())
}

/// Update instance name when project opens
#[tauri::command]
pub async fn orchestrate_set_instance_name(
    _state: State<'_, AppState>,
    name: String,
) -> Result<(), String> {
    crate::orchestrator::OrchestratorServer::update_instance_name(&name);
    Ok(())
}

/// Register a pane name for name-based addressing
#[tauri::command]
pub async fn orchestrate_pane_name(
    state: State<'_, AppState>,
    pane_id: String,
    name: String,
) -> Result<(), String> {
    let mut names = state.pane_names.lock().unwrap();
    // Remove old entry for this pane_id
    names.retain(|_, v| v != &pane_id);
    names.insert(name.to_lowercase(), pane_id);
    Ok(())
}

/// Called by the renderer after splitting a pane to report the new pane ID
#[tauri::command]
pub async fn orchestrate_split_result(
    state: State<'_, AppState>,
    request_id: String,
    new_pane_id: String,
) -> Result<(), String> {
    let tx = state.split_waiters.lock().unwrap().remove(&request_id);
    if let Some(tx) = tx {
        tx.send(new_pane_id).ok();
    }
    Ok(())
}

// ─────────────────────────────────────────────────────────────
// Slack Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn slack_connect(
    state: State<'_, AppState>,
    app_token: String,
    bot_token: String,
    bot_user_id: String,
) -> Result<Value, String> {
    // Save tokens to settings.json
    state.setup_service.setup_slack_tokens(&app_token, &bot_token, &bot_user_id);

    // Start SlackBridge
    let bridge = crate::slack_bridge::SlackBridge::start(
        app_token,
        bot_token,
        bot_user_id,
        state.pty_pool.clone(),
    );
    *state.slack_bridge.lock().unwrap() = Some(bridge);

    Ok(serde_json::json!({"connected": true}))
}

#[tauri::command]
pub async fn slack_disconnect(state: State<'_, AppState>) -> Result<(), String> {
    let mut bridge = state.slack_bridge.lock().unwrap();
    if let Some(ref mut b) = *bridge {
        b.stop();
    }
    *bridge = None;
    Ok(())
}

#[tauri::command]
pub async fn slack_status(state: State<'_, AppState>) -> Result<Value, String> {
    let bridge = state.slack_bridge.lock().unwrap();
    let connected = bridge.is_some();
    Ok(serde_json::json!({"connected": connected}))
}

#[tauri::command]
pub async fn slack_send(
    state: State<'_, AppState>,
    channel: String,
    text: String,
) -> Result<(), String> {
    let bot_token = {
        let bridge = state.slack_bridge.lock().unwrap();
        match &*bridge {
            Some(b) => b.bot_token().to_string(),
            None => return Err("Slack not connected".into()),
        }
    }; // Mutex guard dropped here

    let client = reqwest::Client::new();
    crate::slack_bridge::responder::post_message(&client, &bot_token, &channel, &text).await
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
        "model": session_usage.model,
        "isLongContext": session_usage.is_long_context,
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
// Session Persistence Commands
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn session_save(data: String) -> Result<(), String> {
    let path = session_path();
    fs::write(&path, &data).map_err(|e| format!("세션 저장 실패: {}", e))
}

#[tauri::command]
pub async fn session_load() -> Result<Option<String>, String> {
    let path = session_path();
    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| format!("세션 로드 실패: {}", e))?;
        Ok(Some(content))
    } else {
        Ok(None)
    }
}

// ─────────────────────────────────────────────────────────────
// Debug: JS → Rust logging bridge
// ─────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn log_from_js(message: String) -> Result<(), String> {
    log::warn!("[JS] {}", message);
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

fn session_path() -> PathBuf {
    let config_dir = dirs::config_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap().join(".config"))
        .join("com.claudelabs.clabs");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("session.json")
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

// ─────────────────────────────────────────────────────────────
// Ghostty Native Terminal Commands
// @TASK P2-COMMANDS - Tauri commands for ghostty terminal management
// @SPEC docs/spike-phase2-ghostty-manager.md
// ─────────────────────────────────────────────────────────────

#[cfg(target_os = "macos")]
mod ghostty_commands {
    use super::*;
    use std::collections::HashMap;

    /// Helper: get NSWindow pointer from tauri::Window.
    ///
    /// On macOS, tauri::Window provides ns_window() via the raw window handle.
    /// We use objc2 to get the NSWindow pointer safely.
    fn get_ns_window(window: &tauri::Window) -> Result<*mut std::ffi::c_void, String> {
        use objc2::msg_send;
        use objc2_app_kit::NSView;

        // Tauri v2: Window has a method to get the raw window handle via HasWindowHandle
        // We need to use raw_window_handle to get the NSView, then find its NSWindow
        use raw_window_handle::HasWindowHandle;
        let handle = window
            .window_handle()
            .map_err(|e| format!("failed to get window handle: {}", e))?;
        let raw = handle.as_raw();

        match raw {
            raw_window_handle::RawWindowHandle::AppKit(appkit) => {
                // appkit.ns_view is a NonNull<c_void> pointing to the NSView
                let ns_view_ptr = appkit.ns_view.as_ptr() as *mut NSView;
                unsafe {
                    // Get the NSWindow from the NSView
                    let ns_window: *mut std::ffi::c_void =
                        msg_send![&*ns_view_ptr, window];
                    if ns_window.is_null() {
                        return Err("NSView has no window".to_string());
                    }
                    Ok(ns_window)
                }
            }
            _ => Err("not an AppKit window handle".to_string()),
        }
    }

    // ghostty 명령: 동기적으로 main thread에서 직접 실행
    // run_on_main_thread + await는 데드락을 유발하므로 사용하지 않음

    #[tauri::command]
    pub async fn ghostty_create(
        window: tauri::Window,
        state: State<'_, AppState>,
        pane_id: String,
        config: Option<serde_json::Value>,
    ) -> Result<(), String> {
        log::info!("ghostty_create called for pane={}", pane_id);

        // Phase 1: get ns_window on current thread (may not be main)
        let ns_window = get_ns_window(&window)?;
        log::info!("ghostty_create: got ns_window for pane={}", pane_id);

        let config_map = config.and_then(|v| {
            v.as_object().map(|obj| {
                obj.iter()
                    .filter_map(|(k, v)| {
                        let val = match v {
                            serde_json::Value::String(s) => s.clone(),
                            serde_json::Value::Number(n) => n.to_string(),
                            serde_json::Value::Bool(b) => b.to_string(),
                            _ => return None,
                        };
                        Some((k.clone(), val))
                    })
                    .collect::<HashMap<String, String>>()
            })
        });

        // Fire-and-forget on main thread — do NOT await
        // Awaiting deadlocks because main thread is blocked by WKWebView event loop
        let mgr = state.ghostty_manager.clone();
        let ns_window_usize = ns_window as usize;
        let pid = pane_id.clone();

        window.run_on_main_thread(move || {
            log::info!("ghostty_create: on main thread for pane={}", pid);
            match mgr.create(&pid, ns_window_usize as *mut std::ffi::c_void, config_map) {
                Ok(()) => log::info!("ghostty_create: OK pane={}", pid),
                Err(e) => log::error!("ghostty_create: FAIL pane={}: {}", pid, e),
            }
        }).map_err(|e| format!("dispatch failed: {}", e))?;

        Ok(()) // return immediately
    }

    // ghostty FFI는 macOS main thread에서만 안전 (Metal/Cocoa는 main 큐 어서션).
    // 기존엔 ghostty_create만 run_on_main_thread로 감쌌는데, 나머지 커맨드도
    // tokio 워커에서 ghostty FFI를 직접 부르면서 libdispatch assertion으로 즉사했다.
    // 모두 fire-and-forget으로 main에 dispatch한다 (await는 WKWebView 데드락 유발).

    #[tauri::command]
    pub async fn ghostty_destroy(window: tauri::Window, state: State<'_, AppState>, pane_id: String) -> Result<(), String> {
        let mgr = state.ghostty_manager.clone();
        window.run_on_main_thread(move || { mgr.destroy(&pane_id); })
            .map_err(|e| format!("dispatch failed: {}", e))
    }

    #[tauri::command]
    pub async fn ghostty_set_frame(
        window: tauri::Window,
        state: State<'_, AppState>, pane_id: String,
        x: f64, y: f64, width: f64, height: f64,
    ) -> Result<(), String> {
        log::info!("ghostty_set_frame: pane={} {}x{} at ({},{})", pane_id, width, height, x, y);
        let mgr = state.ghostty_manager.clone();
        window.run_on_main_thread(move || { mgr.set_frame(&pane_id, x, y, width, height); })
            .map_err(|e| format!("dispatch failed: {}", e))
    }

    #[tauri::command]
    pub async fn ghostty_set_visible(window: tauri::Window, state: State<'_, AppState>, pane_id: String, visible: bool) -> Result<(), String> {
        let mgr = state.ghostty_manager.clone();
        window.run_on_main_thread(move || { mgr.set_visible(&pane_id, visible); })
            .map_err(|e| format!("dispatch failed: {}", e))
    }

    #[tauri::command]
    pub async fn ghostty_focus(window: tauri::Window, state: State<'_, AppState>, pane_id: String) -> Result<(), String> {
        let mgr = state.ghostty_manager.clone();
        window.run_on_main_thread(move || { mgr.focus(&pane_id); })
            .map_err(|e| format!("dispatch failed: {}", e))
    }

    #[tauri::command]
    pub async fn ghostty_apply_theme(window: tauri::Window, state: State<'_, AppState>, pane_id: String, theme: HashMap<String, String>) -> Result<(), String> {
        let mgr = state.ghostty_manager.clone();
        window.run_on_main_thread(move || { mgr.apply_theme(&pane_id, theme); })
            .map_err(|e| format!("dispatch failed: {}", e))
    }

    #[tauri::command]
    pub async fn ghostty_search(window: tauri::Window, state: State<'_, AppState>, pane_id: String, query: String, direction: Option<String>) -> Result<(), String> {
        let mgr = state.ghostty_manager.clone();
        let dir = direction.unwrap_or_else(|| "next".to_string());
        window.run_on_main_thread(move || { mgr.search(&pane_id, &query, &dir); })
            .map_err(|e| format!("dispatch failed: {}", e))
    }

    #[tauri::command]
    pub async fn ghostty_search_clear(window: tauri::Window, state: State<'_, AppState>, pane_id: String) -> Result<(), String> {
        let mgr = state.ghostty_manager.clone();
        window.run_on_main_thread(move || { mgr.search_clear(&pane_id); })
            .map_err(|e| format!("dispatch failed: {}", e))
    }

    #[tauri::command]
    pub async fn ghostty_get_selection(state: State<'_, AppState>, pane_id: String) -> Result<String, String> {
        state.ghostty_manager.get_selection(&pane_id).ok_or_else(|| "no selection".to_string())
    }

    #[tauri::command]
    pub async fn ghostty_get_buffer_text(state: State<'_, AppState>, pane_id: String, max_lines: Option<usize>) -> Result<Vec<String>, String> {
        Ok(state.ghostty_manager.get_buffer_text(&pane_id, max_lines.unwrap_or(1000)))
    }

    #[tauri::command]
    pub async fn ghostty_copy(state: State<'_, AppState>, pane_id: String) -> Result<String, String> {
        state.ghostty_manager.copy(&pane_id).ok_or_else(|| "no selection to copy".to_string())
    }

    #[tauri::command]
    pub async fn ghostty_paste(
        state: State<'_, AppState>,
        pane_id: String,
        text: String,
    ) -> Result<(), String> {
        state.ghostty_manager.paste(&pane_id, &text);
        Ok(())
    }
}

// Re-export ghostty commands on macOS
#[cfg(target_os = "macos")]
pub use ghostty_commands::*;

// ────────────────────────────────────────────────────────────────────────
// alacritty_terminal 기반 네이티브 터미널 명령
// 모두 main thread에서 실행되어야 함 (NSView/CoreGraphics).
// ────────────────────────────────────────────────────────────────────────
#[cfg(target_os = "macos")]
mod alac_commands {
    use super::*;
    use crate::alac;
    use objc2_foundation::{NSPoint, NSRect, NSSize};
    use std::ffi::c_void;

    fn get_ns_window(window: &tauri::Window) -> Result<*mut c_void, String> {
        use objc2::msg_send;
        use objc2_app_kit::NSView;
        use raw_window_handle::HasWindowHandle;
        let handle = window
            .window_handle()
            .map_err(|e| format!("failed to get window handle: {}", e))?;
        match handle.as_raw() {
            raw_window_handle::RawWindowHandle::AppKit(appkit) => {
                let ns_view_ptr = appkit.ns_view.as_ptr() as *mut NSView;
                unsafe {
                    let ns_window: *mut c_void = msg_send![&*ns_view_ptr, window];
                    if ns_window.is_null() {
                        Err("NSView has no window".into())
                    } else {
                        Ok(ns_window)
                    }
                }
            }
            _ => Err("not AppKit window handle".into()),
        }
    }

    #[tauri::command]
    pub async fn alac_create(
        window: tauri::Window,
        state: State<'_, AppState>,
        pane_id: String,
        cwd: Option<String>,
    ) -> Result<(), String> {
        log::info!("alac_create called for pane={}", pane_id);
        let ns_window = get_ns_window(&window)?;
        let ns_window_us = ns_window as usize;

        let mgr = state.alac_manager.clone();
        let pid = pane_id.clone();
        let pid_for_view = pane_id.clone();

        // 셀 크기 측정/뷰 생성은 main 스레드에서 먼저 수행 → 결과로 cols/rows 알려줌.
        // 그 다음 manager.create로 PTY+Term 시작.
        let (tx, rx) = std::sync::mpsc::channel::<Result<(u16, u16, u16, u16), String>>();
        let cwd_clone = cwd.clone();
        window
            .run_on_main_thread(move || unsafe {
                // 임시 frame; 실제 크기는 set_frame에서 잡음.
                let frame = NSRect {
                    origin: NSPoint { x: 0.0, y: 0.0 },
                    size: NSSize { width: 800.0, height: 600.0 },
                };
                let view = alac::view::create_view(
                    &pid_for_view,
                    ns_window_us as *mut c_void,
                    frame,
                );
                if view.is_null() {
                    let _ = tx.send(Err("create_view returned null".into()));
                    return;
                }
                let size = alac::view::current_size(&pid_for_view).unwrap_or((80, 24, 8, 16));
                let _ = tx.send(Ok(size));
            })
            .map_err(|e| format!("dispatch failed: {}", e))?;

        let (cols, rows, cell_w, cell_h) = rx
            .recv_timeout(std::time::Duration::from_secs(3))
            .map_err(|e| format!("create_view timeout: {}", e))??;

        // PTY + Term 인스턴스화 (background OK).
        let working_directory = cwd_clone.map(std::path::PathBuf::from);
        let opts = alac::CreateOptions {
            cols,
            rows,
            cell_width: cell_w,
            cell_height: cell_h,
            working_directory,
            shell_program: None,
            shell_args: vec![],
            window_id: 0,
        };
        mgr.create(&pid, opts)?;
        log::info!("alac_create OK pane={} {}x{}", pid, cols, rows);
        Ok(())
    }

    #[tauri::command]
    pub async fn alac_destroy(
        window: tauri::Window,
        state: State<'_, AppState>,
        pane_id: String,
    ) -> Result<(), String> {
        // 1) PTY/EventLoop 종료
        state.alac_manager.destroy(&pane_id);
        // 2) NSView 제거 (main thread)
        let pid = pane_id.clone();
        window
            .run_on_main_thread(move || unsafe {
                alac::view::destroy_view(&pid);
            })
            .map_err(|e| format!("dispatch failed: {}", e))?;
        Ok(())
    }

    #[tauri::command]
    pub async fn alac_set_frame(
        window: tauri::Window,
        _state: State<'_, AppState>,
        pane_id: String,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
    ) -> Result<(), String> {
        let pid = pane_id.clone();
        window
            .run_on_main_thread(move || unsafe {
                let rect = NSRect {
                    origin: NSPoint { x, y },
                    size: NSSize { width, height },
                };
                alac::view::set_frame(&pid, rect);
            })
            .map_err(|e| format!("dispatch failed: {}", e))?;
        Ok(())
    }

    #[tauri::command]
    pub async fn alac_focus(
        window: tauri::Window,
        _state: State<'_, AppState>,
        pane_id: String,
    ) -> Result<(), String> {
        let pid = pane_id.clone();
        window
            .run_on_main_thread(move || unsafe {
                alac::view::focus(&pid);
            })
            .map_err(|e| format!("dispatch failed: {}", e))?;
        Ok(())
    }

    #[tauri::command]
    pub async fn alac_set_visible(
        window: tauri::Window,
        _state: State<'_, AppState>,
        pane_id: String,
        visible: bool,
    ) -> Result<(), String> {
        let pid = pane_id.clone();
        window
            .run_on_main_thread(move || unsafe {
                alac::view::set_visible(&pid, visible);
            })
            .map_err(|e| format!("dispatch failed: {}", e))?;
        Ok(())
    }

    /// React 측 모달이 열리거나 닫힐 때 호출.
    /// 모달이 열려있는 동안 모든 alac NSView는 강제로 hidden 처리.
    #[tauri::command]
    pub async fn alac_set_modal_open(
        window: tauri::Window,
        _state: State<'_, AppState>,
        open: bool,
    ) -> Result<(), String> {
        window
            .run_on_main_thread(move || {
                alac::view::set_modal_open(open);
            })
            .map_err(|e| format!("dispatch failed: {}", e))?;
        Ok(())
    }

    /// 외부(InputBox 등)에서 alac PTY로 직접 입력 바이트 전송.
    /// xterm 모드의 window.api.pty.write 와 같은 역할 — alac은 자체 PTY를 가지므로 별도 명령.
    #[tauri::command]
    pub async fn alac_write(
        window: tauri::Window,
        state: State<'_, AppState>,
        pane_id: String,
        data: String,
    ) -> Result<(), String> {
        log::info!(
            "alac_write pane={} len={} preview={:?}",
            pane_id,
            data.len(),
            data.chars().take(40).collect::<String>()
        );
        state.alac_manager.write_input(&pane_id, data.into_bytes());

        // 진단: 200ms 후 Term grid 상태 캡처 — shell echo가 들어왔는지 확인.
        let mgr = state.alac_manager.clone();
        let pid_diag = pane_id.clone();
        tokio::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_millis(200)).await;
            let _ = mgr.with_term(&pid_diag, |term| {
                use alacritty_terminal::grid::Dimensions as _;
                let content = term.renderable_content();
                let cursor = content.cursor.point;
                let cols = term.columns();
                let lines = term.screen_lines();
                // 마지막 row 30 columns
                let mut row_text = String::new();
                let cursor_row = cursor.line.0;
                for col in 0..cols.min(60) {
                    let cell_iter = term
                        .renderable_content()
                        .display_iter
                        .filter(|c| c.point.line.0 == cursor_row && c.point.column.0 == col)
                        .next();
                    if let Some(cell) = cell_iter {
                        row_text.push(if cell.c == '\0' { ' ' } else { cell.c });
                    }
                }
                log::info!(
                    "alac diag pane={} cursor=({},{}) {}x{} row={:?}",
                    pid_diag,
                    cursor.line.0,
                    cursor.column.0,
                    cols,
                    lines,
                    row_text
                );
            });
        });

        let pid = pane_id.clone();
        let _ = window.run_on_main_thread(move || {
            alac::view::nudge_visible(&pid);
        });
        Ok(())
    }
}

#[cfg(target_os = "macos")]
pub use alac_commands::*;
