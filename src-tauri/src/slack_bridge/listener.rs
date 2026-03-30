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
    collector: &Arc<ResponseCollector>,
) {
    // 1. Send "processing" message
    responder::post_message(http, bot_token, channel, &format!(">> {}\n\n_Processing..._", text))
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

    // 3. Send to Claude Code and wait for response
    let _profile = CliProfile::get("claude");
    match collector.get_response(&active_pane, text, 300_000, "claude").await {
        Ok(response) => {
            // 4. Send response back to Slack (truncate if too long)
            let truncated = if response.len() > 3000 {
                format!("{}...\n\n_(truncated, {} chars total)_", &response[..3000], response.len())
            } else {
                response
            };
            responder::post_message(
                http,
                bot_token,
                channel,
                &format!("```\n{}\n```", truncated),
            )
            .await
            .ok();
        }
        Err(e) => {
            responder::post_message(http, bot_token, channel, &format!("Error: {}", e))
                .await
                .ok();
        }
    }
}
