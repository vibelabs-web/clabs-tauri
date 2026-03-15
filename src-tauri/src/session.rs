use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SessionUsage {
    #[serde(rename = "inputTokens")]
    pub input_tokens: u64,
    #[serde(rename = "outputTokens")]
    pub output_tokens: u64,
    #[serde(rename = "cacheReadTokens")]
    pub cache_read_tokens: u64,
    #[serde(rename = "cacheCreationTokens")]
    pub cache_creation_tokens: u64,
    #[serde(rename = "totalTokens")]
    pub total_tokens: u64,
    #[serde(rename = "messageCount")]
    pub message_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsageUpdateData {
    pub tokens_used: u64,
    pub context_limit: u64,
    pub daily_tokens_used: u64,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub cache_read_tokens: u64,
    pub cache_creation_tokens: u64,
    pub message_count: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub five_hour_usage: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub five_hour_reset: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seven_day_usage: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seven_day_reset: Option<String>,
}

struct WatcherState {
    running: bool,
    usage: SessionUsage,
    project_path: Option<String>,
}

pub struct SessionWatcher {
    state: Arc<Mutex<WatcherState>>,
}

impl SessionWatcher {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(WatcherState {
                running: false,
                usage: SessionUsage::default(),
                project_path: None,
            })),
        }
    }

    pub fn start(&self, project_path: &str, app: AppHandle) {
        self.stop();

        {
            let mut state = self.state.lock().unwrap();
            state.running = true;
            state.project_path = Some(project_path.to_string());
            state.usage = SessionUsage::default();
        }

        let state = self.state.clone();
        let project_path = project_path.to_string();

        thread::spawn(move || {
            loop {
                {
                    let s = state.lock().unwrap();
                    if !s.running {
                        break;
                    }
                }

                // Find and parse the newest session file
                if let Some(session_file) = find_newest_session_file(&project_path) {
                    let new_usage = parse_session_file(&session_file);

                    let mut s = state.lock().unwrap();
                    if new_usage.total_tokens != s.usage.total_tokens {
                        s.usage = new_usage.clone();

                        let data = UsageUpdateData {
                            tokens_used: new_usage.total_tokens,
                            context_limit: 1_000_000,
                            daily_tokens_used: new_usage.total_tokens,
                            input_tokens: new_usage.input_tokens,
                            output_tokens: new_usage.output_tokens,
                            cache_read_tokens: new_usage.cache_read_tokens,
                            cache_creation_tokens: new_usage.cache_creation_tokens,
                            message_count: new_usage.message_count,
                            five_hour_usage: None,
                            five_hour_reset: None,
                            seven_day_usage: None,
                            seven_day_reset: None,
                        };

                        app.emit("usage:update", &data).ok();
                    }
                }

                thread::sleep(Duration::from_millis(500));
            }
        });
    }

    pub fn stop(&self) {
        let mut state = self.state.lock().unwrap();
        state.running = false;
        state.usage = SessionUsage::default();
    }

    pub fn get_usage(&self) -> SessionUsage {
        self.state.lock().unwrap().usage.clone()
    }
}

fn find_git_root(start: &Path) -> Option<PathBuf> {
    let mut current = start.to_path_buf();
    loop {
        if current.join(".git").exists() {
            return Some(current);
        }
        if !current.pop() {
            return None;
        }
    }
}

fn find_newest_session_file(project_path: &str) -> Option<PathBuf> {
    let home = dirs::home_dir()?;
    let resolved = if project_path == "~" || project_path.starts_with("~/") {
        PathBuf::from(project_path.replacen("~", &home.to_string_lossy(), 1))
    } else {
        PathBuf::from(project_path)
    };

    let mut paths_to_try = vec![resolved.clone()];
    if let Some(git_root) = find_git_root(&resolved) {
        if git_root != resolved {
            paths_to_try.push(git_root);
        }
    }

    let mut newest: Option<(PathBuf, std::time::SystemTime)> = None;

    for try_path in &paths_to_try {
        let encoded = try_path
            .to_string_lossy()
            .replace('/', "-")
            .replace('_', "-");
        let project_dir = home.join(".claude").join("projects").join(&encoded);

        if !project_dir.exists() {
            continue;
        }

        if let Ok(entries) = fs::read_dir(&project_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().is_some_and(|e| e == "jsonl") {
                    if let Ok(meta) = fs::metadata(&path) {
                        if let Ok(modified) = meta.modified() {
                            if newest.as_ref().is_none_or(|(_, t)| modified > *t) {
                                newest = Some((path, modified));
                            }
                        }
                    }
                }
            }
        }
    }

    newest.map(|(p, _)| p)
}

fn parse_session_file(path: &Path) -> SessionUsage {
    let mut usage = SessionUsage::default();

    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(_) => return usage,
    };

    let mut latest_input = 0u64;
    let mut latest_cache_read = 0u64;
    let mut latest_cache_create = 0u64;
    let mut total_output = 0u64;
    let mut message_count = 0u64;

    for line in content.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        if let Ok(entry) = serde_json::from_str::<serde_json::Value>(line) {
            if let Some(u) = entry
                .get("message")
                .and_then(|m| m.get("usage"))
            {
                if let Some(input) = u.get("input_tokens").and_then(|v| v.as_u64()) {
                    if input > 0 {
                        latest_input = input;
                        latest_cache_read = u
                            .get("cache_read_input_tokens")
                            .and_then(|v| v.as_u64())
                            .unwrap_or(0);
                        latest_cache_create = u
                            .get("cache_creation_input_tokens")
                            .and_then(|v| v.as_u64())
                            .unwrap_or(0);
                    }
                }

                if let Some(output) = u.get("output_tokens").and_then(|v| v.as_u64()) {
                    total_output = output;
                }
                message_count += 1;
            }
        }
    }

    usage.input_tokens = latest_input;
    usage.cache_read_tokens = latest_cache_read;
    usage.cache_creation_tokens = latest_cache_create;
    usage.total_tokens = latest_input + latest_cache_read + latest_cache_create;
    usage.output_tokens = total_output;
    usage.message_count = message_count;

    usage
}
