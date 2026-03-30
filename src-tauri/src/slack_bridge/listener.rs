use futures_util::{SinkExt, StreamExt};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;

use super::responder;
use crate::pty::PtyPoolManager;
use crate::orchestrator::response_collector::ResponseCollector;
use crate::orchestrator::cli_profiles::CliProfile;

#[derive(Deserialize, Debug)]
struct ConnectionOpenResponse {
    ok: bool,
    url: Option<String>,
    error: Option<String>,
}

#[derive(Deserialize, Debug)]
struct SlackEnvelope {
    envelope_id: Option<String>,
    #[serde(rename = "type")]
    event_type: Option<String>,
    payload: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct AckResponse {
    envelope_id: String,
}

#[derive(Clone, Debug, Serialize)]
pub struct IncomingSlackMessage {
    pub channel: String,
    pub user: String,
    pub text: String,
    pub ts: String,
}

/// Start the Socket Mode listener loop
pub async fn run_socket_mode(
    app_token: String,
    bot_token: String,
    bot_user_id: String,
    pty_pool: Arc<PtyPoolManager>,
    message_tx: mpsc::Sender<IncomingSlackMessage>,
    mut shutdown_rx: mpsc::Receiver<()>,
) {
    let http_client = Client::new();
    let collector = Arc::new(ResponseCollector::new(pty_pool.clone()));

    loop {
        // 1. Get WSS URL via apps.connections.open
        let wss_url = match get_wss_url(&http_client, &app_token).await {
            Ok(url) => url,
            Err(e) => {
                log::error!("[slack] Failed to get WSS URL: {}", e);
                tokio::time::sleep(std::time::Duration::from_secs(10)).await;
                continue;
            }
        };

        log::info!("[slack] Connecting to WSS: {}...", &wss_url[..50.min(wss_url.len())]);

        // 2. Connect WebSocket
        let ws = match tokio_tungstenite::connect_async(&wss_url).await {
            Ok((ws, _)) => ws,
            Err(e) => {
                log::error!("[slack] WebSocket connection failed: {}", e);
                tokio::time::sleep(std::time::Duration::from_secs(10)).await;
                continue;
            }
        };

        let (mut ws_write, mut ws_read) = ws.split();
        log::info!("[slack] WebSocket connected");

        // 3. Event loop
        loop {
            tokio::select! {
                msg = ws_read.next() => {
                    match msg {
                        Some(Ok(Message::Text(text))) => {
                            handle_ws_message(
                                &text,
                                &mut ws_write,
                                &http_client,
                                &bot_token,
                                &bot_user_id,
                                &pty_pool,
                                &collector,
                                &message_tx,
                            ).await;
                        }
                        Some(Ok(Message::Close(_))) => {
                            log::info!("[slack] WebSocket closed by server, reconnecting...");
                            break;
                        }
                        Some(Err(e)) => {
                            log::error!("[slack] WebSocket error: {}", e);
                            break;
                        }
                        None => {
                            log::info!("[slack] WebSocket stream ended, reconnecting...");
                            break;
                        }
                        _ => {} // Ping/Pong handled automatically
                    }
                }
                _ = shutdown_rx.recv() => {
                    log::info!("[slack] Shutdown signal received");
                    ws_write.close().await.ok();
                    return;
                }
            }
        }

        // Wait before reconnecting
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
    }
}

async fn get_wss_url(client: &Client, app_token: &str) -> Result<String, String> {
    let resp = client
        .post("https://slack.com/api/apps.connections.open")
        .bearer_auth(app_token)
        .header("Content-Type", "application/x-www-form-urlencoded")
        .send()
        .await
        .map_err(|e| format!("HTTP error: {}", e))?;

    let body: ConnectionOpenResponse = resp
        .json()
        .await
        .map_err(|e| format!("JSON parse error: {}", e))?;

    if !body.ok {
        return Err(format!("Slack API error: {}", body.error.unwrap_or_default()));
    }

    body.url.ok_or_else(|| "No URL in response".to_string())
}

async fn handle_ws_message(
    text: &str,
    ws_write: &mut futures_util::stream::SplitSink<
        tokio_tungstenite::WebSocketStream<
            tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
        >,
        Message,
    >,
    http_client: &Client,
    bot_token: &str,
    bot_user_id: &str,
    pty_pool: &Arc<PtyPoolManager>,
    collector: &Arc<ResponseCollector>,
    message_tx: &mpsc::Sender<IncomingSlackMessage>,
) {
    let envelope: SlackEnvelope = match serde_json::from_str(text) {
        Ok(e) => e,
        Err(_) => return,
    };

    // Send ack immediately (3s deadline)
    if let Some(envelope_id) = &envelope.envelope_id {
        let ack = serde_json::to_string(&AckResponse {
            envelope_id: envelope_id.clone(),
        })
        .unwrap();
        ws_write.send(Message::Text(ack.into())).await.ok();
    }

    // Handle hello
    if envelope.event_type.as_deref() == Some("hello") {
        log::info!("[slack] Received hello — connection established");
        return;
    }

    // Handle events_api
    if envelope.event_type.as_deref() == Some("events_api") {
        if let Some(payload) = &envelope.payload {
            if let Some(event) = payload.get("event") {
                let event_type = event["type"].as_str().unwrap_or("");
                let subtype = event["subtype"].as_str();

                // Only handle user messages (skip bot messages, system messages)
                if event_type == "message" && subtype.is_none() {
                    let text = event["text"].as_str().unwrap_or("").to_string();
                    let channel = event["channel"].as_str().unwrap_or("").to_string();
                    let user = event["user"].as_str().unwrap_or("").to_string();
                    let ts = event["ts"].as_str().unwrap_or("").to_string();
                    let channel_type = event["channel_type"].as_str().unwrap_or("");

                    // Skip bot's own messages
                    if user == bot_user_id || user.is_empty() {
                        return;
                    }

                    // Skip empty messages
                    if text.trim().is_empty() {
                        return;
                    }

                    // Determine if we should process this message:
                    // - DM (channel_type "im"): always process (no @mention needed)
                    // - Channel: only if @mentioned
                    let mention_tag = format!("<@{}>", bot_user_id);
                    let is_dm = channel_type == "im" || channel.starts_with('D');
                    let is_mentioned = text.contains(&mention_tag);

                    if is_dm || is_mentioned {
                        let clean_text = text.replace(&mention_tag, "").trim().to_string();

                        if clean_text.is_empty() {
                            return;
                        }

                        log::info!("[slack] {} from {}: {}", if is_dm { "DM" } else { "Mention" }, user, clean_text);

                        // Notify frontend
                        message_tx
                            .send(IncomingSlackMessage {
                                channel: channel.clone(),
                                user: user.clone(),
                                text: clean_text.clone(),
                                ts: ts.clone(),
                            })
                            .await
                            .ok();

                        // Process in background
                        let http = http_client.clone();
                        let token = bot_token.to_string();
                        let pool = pty_pool.clone();
                        let coll = collector.clone();
                        let chan = channel.clone();

                        tokio::spawn(async move {
                            process_slack_command(&http, &token, &chan, &clean_text, &pool, &coll).await;
                        });
                    }
                }
            }
        }
    }
}

async fn process_slack_command(
    http: &Client,
    bot_token: &str,
    channel: &str,
    text: &str,
    pty_pool: &Arc<PtyPoolManager>,
    _collector: &Arc<ResponseCollector>,
) {
    // 1. Send "processing" message
    responder::post_message(http, bot_token, channel, &format!("> {}\n_처리 중..._", text))
        .await
        .ok();

    // 2. Find active pane
    let panes = pty_pool.get_pane_info_list();
    let active_pane = match panes.first() {
        Some(p) => p.pane_id.clone(),
        None => {
            responder::post_message(http, bot_token, channel, "No active terminal pane found.")
                .await
                .ok();
            return;
        }
    };

    // 3. Strategy: Tell Claude Code to write result to a file, then read it
    // This avoids PTY buffer noise (spinners, ANSI codes, tool output)
    let result_file = format!("/tmp/slack-response-{}.md", std::process::id());

    // Build the augmented prompt: original request + file output instruction
    let augmented = format!(
        "{}\n\n위 작업을 수행한 후, 결과 요약을 {} 파일에 마크다운으로 작성해. 파일에는 핵심 결과만 간결하게 담아.",
        text, result_file
    );

    // 4. Send to Claude Code (text + Enter with delay)
    let trimmed = augmented.trim();
    match pty_pool.write(&active_pane, trimmed) {
        Ok(()) => {
            let delay_ms = if trimmed.len() > 1000 { 2000 }
                else if trimmed.len() > 200 { 1000 }
                else { 300 };
            tokio::time::sleep(std::time::Duration::from_millis(delay_ms as u64)).await;
            pty_pool.write(&active_pane, "\r").ok();
        }
        Err(e) => {
            responder::post_message(http, bot_token, channel, &format!("PTY error: {}", e))
                .await.ok();
            return;
        }
    }

    // 5. Poll for result file (check every 10s, up to 10 minutes)
    let max_wait = 600; // seconds
    let poll_interval = 10; // seconds
    let mut elapsed = 0;

    loop {
        tokio::time::sleep(std::time::Duration::from_secs(poll_interval)).await;
        elapsed += poll_interval;

        if let Ok(content) = tokio::fs::read_to_string(&result_file).await {
            if !content.trim().is_empty() {
                // Result file exists and has content — send to Slack
                let truncated = if content.len() > 3500 {
                    format!("{}...\n\n_({}자 중 일부)_", &content[..3500], content.len())
                } else {
                    content
                };
                responder::post_message(http, bot_token, channel, &truncated)
                    .await.ok();

                // Clean up
                tokio::fs::remove_file(&result_file).await.ok();
                return;
            }
        }

        if elapsed >= max_wait {
            // Timeout — try reading PTY buffer as fallback
            let fallback = pty_pool.get_recent_output(&active_pane, 30)
                .map(|chunks| {
                    let raw = chunks.join("");
                    let cleaned = clean_slack_response(&crate::orchestrator::ansi::strip_ansi(&raw));
                    if cleaned.len() > 100 { cleaned } else { String::new() }
                })
                .unwrap_or_default();

            if !fallback.is_empty() {
                responder::post_message(http, bot_token, channel, &format!("_10분 경과. 마지막 출력:_\n```\n{}\n```", fallback))
                    .await.ok();
            } else {
                responder::post_message(http, bot_token, channel, "_10분 경과. 작업이 아직 진행 중일 수 있습니다. Clabs 앱에서 확인해주세요._")
                    .await.ok();
            }
            return;
        }
    }
}

/// Clean PTY output for Slack — remove spinner fragments, ANSI artifacts, noise
fn clean_slack_response(raw: &str) -> String {
    let lines: Vec<&str> = raw.lines()
        .filter(|line| {
            let trimmed = line.trim();
            // Skip empty lines
            if trimmed.is_empty() { return false; }
            // Skip spinner/loading patterns
            if trimmed.len() <= 3 && !trimmed.chars().all(|c| c.is_alphanumeric() || c == ' ') { return false; }
            // Skip lines that are just asterisks, dots, or symbols
            if trimmed.chars().all(|c| "*·.…•─│┌┐└┘├┤▶▷◀◁●○◉⏺→←↑↓⏳✓✗✅❌🔧📋".contains(c) || c == ' ') { return false; }
            // Skip ANSI remnants
            if trimmed.starts_with('\x1b') { return false; }
            // Skip very short fragments (likely spinner chars)
            if trimmed.len() <= 2 { return false; }
            // Skip common loading patterns
            let lower = trimmed.to_lowercase();
            if lower.contains("skedaddling") || lower.contains("nesting") || lower.contains("stewing")
                || lower.contains("brewing") || lower.contains("thinking") { return false; }
            true
        })
        .collect();

    lines.join("\n").trim().to_string()
}
