use serde::{Deserialize, Serialize};
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageData {
    pub five_hour: UsagePeriod,
    pub seven_day: UsagePeriod7d,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsagePeriod {
    pub utilization: u64,
    pub resets_at: Option<String>,
    pub remaining_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsagePeriod7d {
    pub utilization: u64,
    pub resets_at: Option<String>,
    pub reset_day: String,
}

struct CachedUsage {
    data: UsageData,
    fetched_at: Instant,
}

static CACHE: Mutex<Option<CachedUsage>> = Mutex::new(None);
const CACHE_TTL: Duration = Duration::from_secs(300); // 5 minutes

/// Get OAuth token from macOS Keychain
fn get_oauth_token() -> Option<String> {
    let output = Command::new("security")
        .args(["find-generic-password", "-s", "Claude Code-credentials", "-w"])
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let creds: serde_json::Value = serde_json::from_str(&stdout).ok()?;
    creds
        .get("claudeAiOauth")
        .and_then(|o| o.get("accessToken"))
        .and_then(|t| t.as_str())
        .map(String::from)
}

fn format_time_remaining(iso: &Option<String>) -> String {
    match iso {
        None => "--".to_string(),
        Some(ts) => {
            if let Ok(reset_time) = chrono::DateTime::parse_from_rfc3339(ts) {
                let now = chrono::Utc::now();
                let remaining = (reset_time.timestamp() - now.timestamp()).max(0);
                let hours = remaining / 3600;
                let minutes = (remaining % 3600) / 60;
                format!("{}h{}m", hours, minutes)
            } else {
                "--".to_string()
            }
        }
    }
}

fn format_reset_day(iso: &Option<String>) -> String {
    match iso {
        None => "--".to_string(),
        Some(ts) => {
            if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(ts) {
                dt.format("%a").to_string()
            } else {
                "--".to_string()
            }
        }
    }
}

pub async fn get_usage_data() -> Option<UsageData> {
    // Check cache
    {
        let cache = CACHE.lock().unwrap();
        if let Some(ref cached) = *cache {
            if cached.fetched_at.elapsed() < CACHE_TTL {
                return Some(cached.data.clone());
            }
        }
    }

    let token = get_oauth_token()?;

    let client = reqwest::Client::new();
    let resp = client
        .get("https://api.anthropic.com/api/oauth/usage")
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .header("anthropic-beta", "oauth-2025-04-20")
        .timeout(Duration::from_secs(5))
        .send()
        .await
        .ok()?;

    let json: serde_json::Value = resp.json().await.ok()?;

    let five_hour = json.get("five_hour")?;
    let seven_day = json.get("seven_day");

    let resets_at_5h = five_hour
        .get("resets_at")
        .and_then(|v| v.as_str())
        .map(String::from);
    let resets_at_7d = seven_day
        .and_then(|s| s.get("resets_at"))
        .and_then(|v| v.as_str())
        .map(String::from);

    let data = UsageData {
        five_hour: UsagePeriod {
            utilization: five_hour
                .get("utilization")
                .and_then(|v| v.as_f64())
                .map(|v| v.round() as u64)
                .unwrap_or(0),
            remaining_time: format_time_remaining(&resets_at_5h),
            resets_at: resets_at_5h,
        },
        seven_day: UsagePeriod7d {
            utilization: seven_day
                .and_then(|s| s.get("utilization"))
                .and_then(|v| v.as_f64())
                .map(|v| v.round() as u64)
                .unwrap_or(0),
            reset_day: format_reset_day(&resets_at_7d),
            resets_at: resets_at_7d,
        },
    };

    // Update cache
    {
        let mut cache = CACHE.lock().unwrap();
        *cache = Some(CachedUsage {
            data: data.clone(),
            fetched_at: Instant::now(),
        });
    }

    Some(data)
}
