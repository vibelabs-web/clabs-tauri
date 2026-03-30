use regex::Regex;
use reqwest::Client;
use serde_json::json;

/// Convert Markdown to Slack mrkdwn format
pub fn md_to_slack(md: &str) -> String {
    let mut in_code_block = false;
    let lines: Vec<String> = md.lines().map(|line| {
        // Don't transform inside code blocks
        if line.trim_start().starts_with("```") {
            in_code_block = !in_code_block;
            return line.to_string();
        }
        if in_code_block {
            return line.to_string();
        }

        let mut l = line.to_string();

        // Headers: # Title → *Title*
        if let Some(caps) = Regex::new(r"^#{1,6}\s+(.+)$").unwrap().captures(&l) {
            l = format!("*{}*", &caps[1]);
        }

        // Bold: **text** → *text*
        l = Regex::new(r"\*\*(.+?)\*\*").unwrap().replace_all(&l, "*$1*").to_string();

        l
    }).collect();

    lines.join("\n")
}

/// Send a message to a Slack channel via Web API
pub async fn post_message(
    client: &Client,
    bot_token: &str,
    channel: &str,
    text: &str,
) -> Result<(), String> {
    let resp = client
        .post("https://slack.com/api/chat.postMessage")
        .bearer_auth(bot_token)
        .json(&json!({
            "channel": channel,
            "text": text,
        }))
        .send()
        .await
        .map_err(|e| format!("Slack API request failed: {}", e))?;

    let body: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Slack API response parse failed: {}", e))?;

    if body["ok"].as_bool() != Some(true) {
        return Err(format!("Slack API error: {}", body["error"].as_str().unwrap_or("unknown")));
    }

    Ok(())
}

/// Update an existing message (for progress updates)
#[allow(dead_code)]
pub async fn update_message(
    client: &Client,
    bot_token: &str,
    channel: &str,
    ts: &str,
    text: &str,
) -> Result<(), String> {
    let resp = client
        .post("https://slack.com/api/chat.update")
        .bearer_auth(bot_token)
        .json(&json!({
            "channel": channel,
            "ts": ts,
            "text": text,
        }))
        .send()
        .await
        .map_err(|e| format!("Slack update failed: {}", e))?;

    let body: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    if body["ok"].as_bool() != Some(true) {
        return Err(format!("Slack update error: {}", body["error"].as_str().unwrap_or("unknown")));
    }

    Ok(())
}
