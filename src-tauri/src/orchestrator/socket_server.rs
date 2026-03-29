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
    message: Option<String>,
    timeout_ms: Option<u64>,
    cli_type: Option<String>,
    max_lines: Option<usize>,
    direction: Option<String>,
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

async fn handle_request(
    req: Request,
    pty_pool: &Arc<PtyPoolManager>,
    collector: &Arc<ResponseCollector>,
    app: &AppHandle,
) -> Response {
    match req.action.as_str() {
        "list-panes" => {
            let panes = pty_pool.get_pane_info_list();
            Response::success(req.id, serde_json::to_value(panes).unwrap())
        }

        "send" => {
            let pane_id = match &req.pane_id {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id required".into()),
            };
            let message = match &req.message {
                Some(m) => m,
                None => return Response::error(req.id, "message required".into()),
            };
            // Send text first, then Enter separately after delay
            // TUI-based CLIs need time to process paste before receiving Enter
            let trimmed = message.trim();
            match pty_pool.write(pane_id, trimmed) {
                Ok(()) => {
                    // Longer text needs more delay (CLI paste processing time)
                    let delay_ms = if trimmed.len() > 1000 { 2000 }
                        else if trimmed.len() > 200 { 1000 }
                        else { 300 };
                    tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
                    pty_pool.write(pane_id, "\r").ok();
                    Response::success(req.id, serde_json::json!({"sent": true}))
                }
                Err(e) => Response::error(req.id, e),
            }
        }

        "read-buffer" => {
            let pane_id = match &req.pane_id {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id required".into()),
            };
            let max_lines = req.max_lines.unwrap_or(100);
            match pty_pool.get_recent_output(pane_id, max_lines) {
                Ok(lines) => Response::success(req.id, serde_json::to_value(lines).unwrap()),
                Err(e) => Response::error(req.id, e),
            }
        }

        "wait-response" => {
            let pane_id = match &req.pane_id {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id required".into()),
            };
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
            let pane_id = match &req.pane_id {
                Some(id) => id,
                None => return Response::error(req.id, "pane_id required".into()),
            };
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
            let pane_id = match &req.pane_id {
                Some(id) => id.clone(),
                None => return Response::error(req.id, "pane_id required".into()),
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

        _ => Response::error(req.id, format!("Unknown action: {}", req.action)),
    }
}
