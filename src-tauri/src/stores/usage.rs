use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TokenUsage {
    pub input: u64,
    pub output: u64,
    pub total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DailyUsage {
    date: String,
    input: u64,
    output: u64,
    total: u64,
}

pub struct UsageStore {
    data: Mutex<HashMap<String, DailyUsage>>,
    path: PathBuf,
    active_tasks: Mutex<HashMap<String, std::time::Instant>>,
}

impl UsageStore {
    pub fn new() -> Self {
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| dirs::home_dir().unwrap().join(".config"))
            .join("com.claudelabs.clabs");

        fs::create_dir_all(&config_dir).ok();

        let path = config_dir.join("clabs-usage.json");

        let data = if path.exists() {
            fs::read_to_string(&path)
                .ok()
                .and_then(|c| serde_json::from_str(&c).ok())
                .unwrap_or_default()
        } else {
            HashMap::new()
        };

        Self {
            data: Mutex::new(data),
            path,
            active_tasks: Mutex::new(HashMap::new()),
        }
    }

    fn save(&self) {
        let data = self.data.lock().unwrap();
        if let Ok(json) = serde_json::to_string_pretty(&*data) {
            fs::write(&self.path, json).ok();
        }
    }

    pub fn add_tokens(&self, input: u64, output: u64) {
        let today = today_key();
        let mut data = self.data.lock().unwrap();

        let entry = data.entry(today.clone()).or_insert(DailyUsage {
            date: today,
            input: 0,
            output: 0,
            total: 0,
        });

        entry.input += input;
        entry.output += output;
        entry.total = entry.input + entry.output;
        drop(data);
        self.save();
    }

    pub fn get_today(&self) -> TokenUsage {
        let today = today_key();
        let data = self.data.lock().unwrap();

        data.get(&today)
            .map(|d| TokenUsage {
                input: d.input,
                output: d.output,
                total: d.total,
            })
            .unwrap_or_default()
    }

    pub fn start_task(&self, task_id: &str) {
        self.active_tasks
            .lock()
            .unwrap()
            .insert(task_id.to_string(), std::time::Instant::now());
    }

    pub fn end_task(&self, task_id: &str) -> f64 {
        self.active_tasks
            .lock()
            .unwrap()
            .remove(task_id)
            .map(|start| start.elapsed().as_secs_f64())
            .unwrap_or(0.0)
    }
}

fn today_key() -> String {
    chrono::Local::now().format("%Y-%m-%d").to_string()
}
