#![allow(non_snake_case)]
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalConfig {
    #[serde(default = "default_font_size")]
    pub fontSize: u32,
    #[serde(default = "default_font_family")]
    pub fontFamily: String,
    #[serde(default = "default_cursor_style")]
    pub cursorStyle: String,
    #[serde(default = "default_true")]
    pub cursorBlink: bool,
    #[serde(default = "default_scrollback")]
    pub scrollback: u32,
    #[serde(default)]
    pub autoTheme: bool,
    #[serde(default = "default_dark_theme")]
    pub darkThemeId: String,
    #[serde(default = "default_light_theme")]
    pub lightThemeId: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillpackConfig {
    #[serde(default = "default_true")]
    pub autoUpdate: bool,
    #[serde(default = "default_skills_path")]
    pub skillsPath: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolbarShortcut {
    pub command: String,
    pub label: String,
    #[serde(default)]
    pub category: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_language")]
    pub language: String,
    #[serde(default)]
    pub terminal: TerminalConfig,
    #[serde(default)]
    pub skillpack: SkillpackConfig,
    #[serde(default)]
    pub toolbarShortcuts: Vec<ToolbarShortcut>,
}

fn default_font_size() -> u32 { 14 }
fn default_font_family() -> String { "monospace".to_string() }
fn default_cursor_style() -> String { "block".to_string() }
fn default_true() -> bool { true }
fn default_scrollback() -> u32 { 5000 }
fn default_skills_path() -> String {
    dirs::home_dir()
        .map(|h| h.join(".claude").join("skills").to_string_lossy().to_string())
        .unwrap_or_default()
}
fn default_dark_theme() -> String { "default-dark".to_string() }
fn default_light_theme() -> String { "solarized-light".to_string() }
fn default_theme() -> String { "default-dark".to_string() }
fn default_language() -> String { "ko".to_string() }

impl Default for TerminalConfig {
    fn default() -> Self {
        Self {
            fontSize: default_font_size(),
            fontFamily: default_font_family(),
            cursorStyle: default_cursor_style(),
            cursorBlink: true,
            scrollback: default_scrollback(),
            autoTheme: false,
            darkThemeId: default_dark_theme(),
            lightThemeId: default_light_theme(),
        }
    }
}

impl Default for SkillpackConfig {
    fn default() -> Self {
        Self {
            autoUpdate: true,
            skillsPath: default_skills_path(),
        }
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            language: default_language(),
            terminal: TerminalConfig::default(),
            skillpack: SkillpackConfig::default(),
            toolbarShortcuts: vec![],
        }
    }
}

pub struct ConfigStore {
    config: Mutex<Config>,
    path: PathBuf,
}

impl ConfigStore {
    pub fn new() -> Self {
        let config_dir = dirs::config_dir()
            .unwrap_or_else(|| dirs::home_dir().unwrap().join(".config"))
            .join("com.claudelabs.clabs");

        fs::create_dir_all(&config_dir).ok();

        let path = config_dir.join("clabs-config.json");

        let config = if path.exists() {
            match fs::read_to_string(&path) {
                Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
                Err(_) => Config::default(),
            }
        } else {
            Config::default()
        };

        Self {
            config: Mutex::new(config),
            path,
        }
    }

    fn save(&self, config: &Config) {
        if let Ok(json) = serde_json::to_string_pretty(config) {
            fs::write(&self.path, json).ok();
        }
    }

    pub fn get_all(&self) -> Config {
        self.config.lock().unwrap().clone()
    }

    pub fn get_value(&self, key: &str) -> serde_json::Value {
        let config = self.config.lock().unwrap();
        let full = serde_json::to_value(&*config).unwrap_or_default();
        full.get(key).cloned().unwrap_or(serde_json::Value::Null)
    }

    pub fn set_value(&self, key: &str, value: serde_json::Value) {
        let mut config = self.config.lock().unwrap();
        let mut full = serde_json::to_value(&*config).unwrap_or_default();
        if let Some(obj) = full.as_object_mut() {
            obj.insert(key.to_string(), value);
        }
        if let Ok(updated) = serde_json::from_value(full) {
            *config = updated;
            self.save(&config);
        }
    }
}
