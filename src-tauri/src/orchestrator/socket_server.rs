use super::response_collector::ResponseCollector;
use crate::pty::PtyPoolManager;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::UnixListener;

#[derive(Deserialize)]
struct Request {
    id: String,
    action: String,
    pane_id: Option<String>,
    name: Option<String>,  // name-based addressing (resolve to pane_id)
    message: Option<String>,
    key: Option<String>,   // for "keys" action
    timeout_ms: Option<u64>,
    cli_type: Option<String>,
    max_lines: Option<usize>,
    direction: Option<String>,
    instance_id: Option<String>,  // for cross-instance communication
    cmux_target: Option<String>,  // for cmux send
}

#[derive(Serialize)]
struct Response {
    id: String,
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

impl Response {
    fn success(id: String, data: serde_json::Value) -> Self {
        Self { id, ok: true, data: Some(data), error: None }
    }

    fn error(id: String, msg: String) -> Self {
        Self { id, ok: false, data: None, error: Some(msg) }
    }
}

#[derive(Clone, Serialize)]
struct SplitPaneRequest {
    #[serde(rename = "paneId")]
    pane_id: String,
    direction: String,
    #[serde(rename = "requestId")]
    request_id: String,
}


/// Start the Unix socket server for inter-pane orchestration
pub async fn run_socket_server(
    socket_path: std::path::PathBuf,
    pty_pool: Arc<PtyPoolManager>,
    app: AppHandle,
) {
    // Ensure parent directory exists
    if let Some(parent) = socket_path.parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            log::error!("Failed to create orchestrator dir: {}", e);
            return;
        }
    }

    // Remove stale socket file
    std::fs::remove_file(&socket_path).ok();

    let listener = match UnixListener::bind(&socket_path) {
        Ok(l) => l,
        Err(e) => {
            log::error!("Failed to bind orchestrator socket at {:?}: {}", socket_path, e);
            return;
        }
    };

    // Set permissions to 0600 (owner only)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&socket_path, std::fs::Permissions::from_mode(0o600)).ok();
    }

    log::info!("Orchestrator socket listening at {:?}", socket_path);

    let collector = Arc::new(ResponseCollector::new(pty_pool.clone()));

    loop {
        match listener.accept().await {
            Ok((stream, _)) => {
                let pool = pty_pool.clone();
                let coll = collector.clone();
                let app_clone = app.clone();
                tokio::spawn(async move {
                    handle_connection(stream, pool, coll, app_clone).await;
                });
            }
            Err(e) => {
                log::error!("Socket accept error: {}", e);
            }
        }
    }
}

async fn handle_connection(
    stream: tokio::net::UnixStream,
    pty_pool: Arc<PtyPoolManager>,
    collector: Arc<ResponseCollector>,
    app: AppHandle,
) {
    let (reader, mut writer) = stream.into_split();
    let mut lines = BufReader::new(reader).lines();

    while let Ok(Some(line)) = lines.next_line().await {
        let resp = match serde_json::from_str::<Request>(&line) {
            Ok(req) => handle_request(req, &pty_pool, &collector, &app).await,
            Err(e) => Response::error("unknown".into(), format!("Invalid JSON: {}", e)),
        };

        let mut json = serde_json::to_string(&resp).unwrap_or_default();
        json.push('\n');
        if writer.write_all(json.as_bytes()).await.is_err() {
            break;
        }
    }
}

/// Resolve pane_id from either pane_id or name field
fn resolve_pane_id(req: &Request, app: &AppHandle) -> Option<String> {
    // Direct pane_id takes priority
    if let Some(id) = &req.pane_id {
        return Some(id.clone());
    }
    // Try resolve by name
    if let Some(name) = &req.name {
        if let Some(state) = app.try_state::<crate::AppState>() {
            let names = state.pane_names.lock().unwrap();
            if let Some(id) = names.get(&name.to_lowercase()) {
                return Some(id.clone());
            }
        }
    }
    None
}

async fn handle_request(
    req: Request,
    pty_pool: &Arc<PtyPoolManager>,
    collector: &Arc<ResponseCollector>,
    app: &AppHandle,
) -> Response {
    match req.action.as_str() {
        "list-panes" => {
            let panes = pty_pool.get_pane_info_list();
            // Include names in response
            let names: std::collections::HashMap<String, String> = if let Some(state) = app.try_state::<crate::AppState>() {
                state.pane_names.lock().unwrap().clone()
            } else {
                std::collections::HashMap::new()
            };
            Response::success(req.id, serde_json::json!({
                "panes": panes,
                "names": names,
            }))
        }

        // send = type + Enter (convenience)
        "send" => {
            let pane_id = match resolve_pane_id(&req, app) {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id or name required".into()),
            };
            let message = match &req.message {
                Some(m) => m,
                None => return Response::error(req.id, "message required".into()),
            };
            let trimmed = message.trim();
            match pty_pool.write(&pane_id, trimmed) {
                Ok(()) => {
                    let delay_ms = if trimmed.len() > 1000 { 2000 }
                        else if trimmed.len() > 200 { 1000 }
                        else { 300 };
                    tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                    pty_pool.write(&pane_id, "\r").ok();
                    Response::success(req.id, serde_json::json!({"sent": true}))
                }
                Err(e) => Response::error(req.id, e),
            }
        }

        // type = text only, no Enter (smux-style)
        "type" => {
            let pane_id = match resolve_pane_id(&req, app) {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id or name required".into()),
            };
            let message = match &req.message {
                Some(m) => m,
                None => return Response::error(req.id, "message required".into()),
            };
            match pty_pool.write(&pane_id, message) {
                Ok(()) => Response::success(req.id, serde_json::json!({"typed": true})),
                Err(e) => Response::error(req.id, e),
            }
        }

        // keys = send special keys (Enter, Escape, Ctrl+C, etc.)
        "keys" => {
            let pane_id = match resolve_pane_id(&req, app) {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id or name required".into()),
            };
            let key = match &req.key {
                Some(k) => k.as_str(),
                None => return Response::error(req.id, "key required".into()),
            };
            let bytes = match key.to_lowercase().as_str() {
                "enter" | "return" => "\r",
                "escape" | "esc" => "\x1b",
                "tab" => "\t",
                "backspace" => "\x7f",
                "c-c" | "ctrl-c" | "ctrl+c" => "\x03",
                "c-d" | "ctrl-d" | "ctrl+d" => "\x04",
                "c-z" | "ctrl-z" | "ctrl+z" => "\x1a",
                "c-l" | "ctrl-l" | "ctrl+l" => "\x0c",
                "up" => "\x1b[A",
                "down" => "\x1b[B",
                "right" => "\x1b[C",
                "left" => "\x1b[D",
                "space" => " ",
                _ => return Response::error(req.id, format!("Unknown key: {}", key)),
            };
            match pty_pool.write(&pane_id, bytes) {
                Ok(()) => Response::success(req.id, serde_json::json!({"key_sent": key})),
                Err(e) => Response::error(req.id, e),
            }
        }

        // resolve = name → pane_id
        "resolve" => {
            let name = match &req.name {
                Some(n) => n.to_lowercase(),
                None => return Response::error(req.id, "name required".into()),
            };
            if let Some(state) = app.try_state::<crate::AppState>() {
                let names = state.pane_names.lock().unwrap();
                match names.get(&name) {
                    Some(id) => Response::success(req.id, serde_json::json!({"pane_id": id})),
                    None => Response::error(req.id, format!("Name '{}' not found", name)),
                }
            } else {
                Response::error(req.id, "AppState not available".into())
            }
        }

        "read-buffer" => {
            let pane_id = match resolve_pane_id(&req, app) {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id or name required".into()),
            };
            let pane_id = &pane_id;
            let max_lines = req.max_lines.unwrap_or(100);
            match pty_pool.get_recent_output(pane_id, max_lines) {
                Ok(lines) => Response::success(req.id, serde_json::to_value(lines).unwrap()),
                Err(e) => Response::error(req.id, e),
            }
        }

        "wait-response" => {
            let pane_id = match resolve_pane_id(&req, app) {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id or name required".into()),
            };
            let pane_id = &pane_id;
            let timeout = req.timeout_ms.unwrap_or(60_000);
            let cli_type = req.cli_type.as_deref().unwrap_or("generic");
            let profile = super::cli_profiles::CliProfile::get(cli_type);

            match collector.wait_for_idle(pane_id, timeout, &profile).await {
                Ok(raw) => {
                    let cleaned = super::ansi::strip_ansi(&raw);
                    Response::success(req.id, serde_json::json!({"response": cleaned}))
                }
                Err(e) => Response::error(req.id, e),
            }
        }

        "get-response" => {
            let pane_id = match resolve_pane_id(&req, app) {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id or name required".into()),
            };
            let pane_id = &pane_id;
            let message = match &req.message {
                Some(m) => m,
                None => return Response::error(req.id, "message required".into()),
            };
            let timeout = req.timeout_ms.unwrap_or(120_000);
            let cli_type = req.cli_type.as_deref().unwrap_or("generic");

            match collector.get_response(pane_id, message, timeout, cli_type).await {
                Ok(response) => Response::success(req.id, serde_json::json!({"response": response})),
                Err(e) => Response::error(req.id, e),
            }
        }

        "split" => {
            let pane_id = match resolve_pane_id(&req, app) {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id or name required".into()),
            };
            let direction = req.direction.as_deref().unwrap_or("horizontal").to_string();
            let request_id = req.id.clone();

            // Create oneshot channel and register it in AppState
            let (tx, rx) = tokio::sync::oneshot::channel::<String>();
            {
                if let Some(state) = app.try_state::<crate::AppState>() {
                    state.split_waiters.lock().unwrap().insert(request_id.clone(), tx);
                } else {
                    return Response::error(req.id, "AppState not available".into());
                }
            }

            // Emit event to renderer to perform the split
            let split_req = SplitPaneRequest {
                pane_id,
                direction,
                request_id: request_id.clone(),
            };

            if let Err(e) = app.emit("orchestrate:split-pane", split_req) {
                // Clean up waiter on error
                if let Some(state) = app.try_state::<crate::AppState>() {
                    state.split_waiters.lock().unwrap().remove(&request_id);
                }
                return Response::error(req.id, format!("Failed to emit split event: {}", e));
            }

            // Wait for renderer to call orchestrate_split_result (up to 15s)
            match tokio::time::timeout(std::time::Duration::from_secs(15), rx).await {
                Ok(Ok(new_pane_id)) => {
                    Response::success(req.id, serde_json::json!({"new_pane_id": new_pane_id}))
                }
                Ok(Err(_)) => Response::error(req.id, "Split response channel closed".into()),
                Err(_) => {
                    // Clean up on timeout
                    if let Some(state) = app.try_state::<crate::AppState>() {
                        state.split_waiters.lock().unwrap().remove(&request_id);
                    }
                    Response::error(req.id, "Split request timed out (15s)".into())
                }
            }
        }

        // List all running Clabs instances
        "list-instances" => {
            let home = dirs::home_dir().unwrap_or_default();
            let registry_path = home.join(".clabs").join("instances.json");
            let instances = if let Ok(content) = std::fs::read_to_string(&registry_path) {
                serde_json::from_str::<serde_json::Value>(&content).unwrap_or(serde_json::json!({}))
            } else {
                serde_json::json!({})
            };
            Response::success(req.id, instances)
        }

        // Send message to another Clabs instance
        "send-external" => {
            let target_instance = match &req.instance_id {
                Some(id) => id.clone(),
                None => return Response::error(req.id, "instance_id required".into()),
            };
            let pane_id = req.pane_id.as_deref().or(req.name.as_deref());
            let message = match &req.message {
                Some(m) => m.clone(),
                None => return Response::error(req.id, "message required".into()),
            };

            // Find target instance's socket from registry (by ID or by name)
            let home = dirs::home_dir().unwrap_or_default();
            let registry_path = home.join(".clabs").join("instances.json");
            let socket_path = match std::fs::read_to_string(&registry_path) {
                Ok(content) => {
                    let instances: serde_json::Value = serde_json::from_str(&content).unwrap_or_default();
                    // Try direct ID match first (PID alive check)
                    let direct = instances[&target_instance]["socket"].as_str()
                        .and_then(|s| {
                            let pid = instances[&target_instance]["pid"].as_u64().unwrap_or(0) as u32;
                            if pid > 0 && super::is_pid_alive(pid) {
                                Some(s.to_string())
                            } else { None }
                        });
                    if direct.is_some() { direct } else {
                        // Try name match (case-insensitive, only alive processes)
                        let target_lower = target_instance.to_lowercase();
                        instances.as_object().and_then(|obj| {
                            obj.values().find(|v| {
                                let name_match = v["name"].as_str().map(|n| n.to_lowercase() == target_lower).unwrap_or(false);
                                let pid_alive = v["pid"].as_u64()
                                    .map(|pid| super::is_pid_alive(pid as u32))
                                    .unwrap_or(false);
                                name_match && pid_alive
                            }).and_then(|v| v["socket"].as_str().map(|s| s.to_string()))
                        })
                    }
                }
                Err(_) => None,
            };

            let socket_path = match socket_path {
                Some(p) => p,
                None => return Response::error(req.id, format!("Instance '{}' not found", target_instance)),
            };

            // 발신자 인스턴스 이름 조회 (회신 주소용)
            let sender_name: String = if let Some(state) = app.try_state::<crate::AppState>() {
                let instance_id = format!("{}", std::process::id());
                let home = dirs::home_dir().unwrap_or_default();
                let registry_path_s = home.join(".clabs").join("instances.json");
                std::fs::read_to_string(&registry_path_s).ok()
                    .and_then(|c| serde_json::from_str::<serde_json::Value>(&c).ok())
                    .and_then(|v| v[&instance_id]["name"].as_str().map(|s| s.to_string()))
                    .unwrap_or_else(|| instance_id)
            } else {
                format!("{}", std::process::id())
            };

            // 메시지에 발신자 정보 + /bridge 스킬로 회신 지시
            let wrapped_message = format!(
                "[다른 Clabs 인스턴스 \"{}\"에서 온 메시지]\n{}\n\n[필수] 완료 후 /bridge @{} 응답내용 으로 회신하라.",
                sender_name, message, sender_name
            );

            // Connect to target instance's socket and forward the send command
            match std::os::unix::net::UnixStream::connect(&socket_path) {
                Ok(mut stream) => {
                    use std::io::{Write, BufRead, BufReader};
                    // Forward with both pane_id and name for proper resolution
                    let fwd_req = serde_json::json!({
                        "id": "fwd-1",
                        "action": "send",
                        "pane_id": req.pane_id,
                        "name": req.name.as_deref().or(pane_id.as_deref()),
                        "message": wrapped_message,
                    });
                    let mut json = serde_json::to_string(&fwd_req).unwrap();
                    json.push('\n');
                    stream.write_all(json.as_bytes()).ok();
                    stream.flush().ok();

                    let mut reader = BufReader::new(stream);
                    let mut resp_line = String::new();
                    reader.read_line(&mut resp_line).ok();

                    Response::success(req.id, serde_json::json!({"forwarded": true, "target": target_instance}))
                }
                Err(e) => Response::error(req.id, format!("Cannot connect to instance '{}': {}", target_instance, e)),
            }
        }

        // Send message to cmux (one-way: clabs → cmux)
        "send-cmux" => {
            let target = match &req.cmux_target {
                Some(t) => t.clone(),
                None => return Response::error(req.id, "cmux_target required".into()),
            };
            let message = match &req.message {
                Some(m) => m.clone(),
                None => return Response::error(req.id, "message required".into()),
            };

            // Use cmux CLI to send (cmux send-surface)
            let output = std::process::Command::new("cmux")
                .args(["send", &target, &message])
                .output();

            match output {
                Ok(out) if out.status.success() => {
                    Response::success(req.id, serde_json::json!({"cmux_sent": true, "target": target}))
                }
                Ok(out) => {
                    let err = String::from_utf8_lossy(&out.stderr);
                    Response::error(req.id, format!("cmux error: {}", err))
                }
                Err(e) => Response::error(req.id, format!("cmux not found or failed: {}", e)),
            }
        }

        _ => Response::error(req.id, format!("Unknown action: {}", req.action)),
    }
}
