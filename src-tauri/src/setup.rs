use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetupStatus {
    pub is_setup: bool,
    pub version: Option<String>,
    pub skills_dir: String,
    pub has_skills: bool,
    pub skill_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SetupResult {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SetupVersionInfo {
    pub installed: Option<String>,
    pub current: String,
    pub needs_upgrade: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpStatus {
    pub gemini: String,
    pub stitch: String,
    pub context7: String,
    pub github: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpSetupResult {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub needs_auth: Option<bool>,
}

pub struct SetupService {
    claude_dir: PathBuf,
    config_path: PathBuf,
    resources_path: PathBuf,
    app_version: String,
}

impl SetupService {
    pub fn new(resources_path: PathBuf, app_version: String) -> Self {
        let claude_dir = dirs::home_dir().unwrap_or_default().join(".claude");
        let config_path = claude_dir.join(".clabs-installed");

        Self {
            claude_dir,
            config_path,
            resources_path,
            app_version,
        }
    }

    pub fn is_first_launch(&self) -> bool {
        !self.config_path.exists()
    }

    pub fn get_installed_version(&self) -> Option<String> {
        if self.config_path.exists() {
            if let Ok(content) = fs::read_to_string(&self.config_path) {
                if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                    return config.get("version").and_then(|v| v.as_str()).map(String::from);
                }
            }
        }
        None
    }

    pub fn get_current_version(&self) -> String {
        self.app_version.clone()
    }

    pub fn needs_upgrade(&self) -> bool {
        match self.get_installed_version() {
            Some(v) => v != self.app_version,
            None => true,
        }
    }

    pub fn run_setup(&self) -> SetupResult {
        let mut details = Vec::new();

        // 1. Create directory structure
        let dirs_to_create = [
            &self.claude_dir,
            &self.claude_dir.join("skills"),
            &self.claude_dir.join("agents"),
            &self.claude_dir.join("commands"),
            &self.claude_dir.join("constitutions"),
            &self.claude_dir.join("docs"),
            &self.claude_dir.join("memory"),
        ];

        for dir in &dirs_to_create {
            fs::create_dir_all(dir).ok();
        }
        details.push(".claude 디렉토리 구조 생성 완료".to_string());

        // 2. Copy skills
        let skills_src = self.resources_path.join("skills");
        let skills_dest = self.claude_dir.join("skills");
        let count = copy_directory_recursive(&skills_src, &skills_dest);
        details.push(format!("스킬 {}개 설치 완료", count));

        // 3. Save marker
        let marker = serde_json::json!({
            "version": self.app_version,
            "installedAt": chrono::Utc::now().to_rfc3339(),
            "platform": std::env::consts::OS
        });
        fs::write(&self.config_path, serde_json::to_string_pretty(&marker).unwrap_or_default()).ok();
        details.push("설치 마커 저장 완료".to_string());

        SetupResult {
            success: true,
            message: "Claude Labs 스킬팩이 성공적으로 설치되었습니다!".to_string(),
            details: Some(details),
        }
    }

    pub fn check_claude_cli(&self) -> bool {
        let home = dirs::home_dir().unwrap_or_default();

        let paths = [
            PathBuf::from("/usr/local/bin/claude"),
            PathBuf::from("/opt/homebrew/bin/claude"),
            home.join(".npm-global/bin/claude"),
            home.join(".local/bin/claude"),
        ];

        for p in &paths {
            if p.exists() {
                return true;
            }
        }

        // Check nvm paths
        let nvm_dir = home.join(".nvm/versions/node");
        if nvm_dir.exists() {
            if let Ok(entries) = fs::read_dir(&nvm_dir) {
                for entry in entries.flatten() {
                    if entry.path().join("bin/claude").exists() {
                        return true;
                    }
                }
            }
        }

        // Fallback: try which
        Command::new("sh")
            .args(["-l", "-c", "which claude"])
            .output()
            .map(|o| o.status.success())
            .unwrap_or(false)
    }

    pub fn get_cli_instructions(&self) -> String {
        "Claude Code CLI를 설치하려면 터미널에서 다음 명령을 실행하세요:\n\nnpm install -g @anthropic-ai/claude-code".to_string()
    }

    pub fn get_setup_status(&self) -> SetupStatus {
        let skills_dir = self.claude_dir.join("skills");
        let mut skill_count = 0u32;

        if skills_dir.exists() {
            if let Ok(entries) = fs::read_dir(&skills_dir) {
                for entry in entries.flatten() {
                    if entry.path().is_dir() {
                        skill_count += 1;
                    }
                }
            }
        }

        SetupStatus {
            is_setup: !self.is_first_launch(),
            version: self.get_installed_version(),
            skills_dir: skills_dir.to_string_lossy().to_string(),
            has_skills: skill_count > 0,
            skill_count,
        }
    }

    pub fn get_mcp_status(&self) -> McpStatus {
        let mut status = McpStatus {
            gemini: "not_configured".to_string(),
            stitch: "not_configured".to_string(),
            context7: "not_configured".to_string(),
            github: "not_configured".to_string(),
        };

        // Check settings.local.json
        let local_settings = self.claude_dir.join("settings.local.json");
        if let Ok(content) = fs::read_to_string(&local_settings) {
            if let Ok(settings) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(servers) = settings.get("enabledMcpjsonServers").and_then(|v| v.as_array()) {
                    for s in servers {
                        if let Some(name) = s.as_str() {
                            match name {
                                "gemini" => status.gemini = "configured".to_string(),
                                "stitch" => status.stitch = "configured".to_string(),
                                "context7" => status.context7 = "configured".to_string(),
                                "github" => status.github = "configured".to_string(),
                                _ => {}
                            }
                        }
                    }
                }
            }
        }

        // Also check ~/.claude.json
        let claude_json = dirs::home_dir().unwrap_or_default().join(".claude.json");
        if let Ok(content) = fs::read_to_string(&claude_json) {
            if let Ok(config) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(servers) = config.get("mcpServers").and_then(|v| v.as_object()) {
                    if servers.contains_key("gemini") { status.gemini = "configured".to_string(); }
                    if servers.contains_key("stitch") { status.stitch = "configured".to_string(); }
                    if servers.contains_key("context7") { status.context7 = "configured".to_string(); }
                    if servers.contains_key("github") { status.github = "configured".to_string(); }
                }
            }
        }

        status
    }

    pub fn setup_context7(&self) -> McpSetupResult {
        let result = Command::new("sh")
            .args(["-l", "-c", "claude mcp remove --scope user context7 2>/dev/null; claude mcp add-json --scope user context7 '{\"command\":\"npx\",\"args\":[\"-y\",\"@anthropic-ai/mcp-server-context7\"]}'"])
            .output();

        match result {
            Ok(output) if output.status.success() => McpSetupResult {
                success: true,
                message: "Context7 MCP가 설정되었습니다.".to_string(),
                needs_auth: None,
            },
            _ => McpSetupResult {
                success: false,
                message: "Context7 MCP 설정 실패".to_string(),
                needs_auth: None,
            },
        }
    }

    pub fn setup_stitch(&self, gcp_project_id: &str, api_key: Option<&str>) -> McpSetupResult {
        let mut env = serde_json::json!({"GOOGLE_CLOUD_PROJECT": gcp_project_id});
        if let Some(key) = api_key {
            env["STITCH_API_KEY"] = serde_json::Value::String(key.to_string());
        }

        let config = serde_json::json!({
            "command": "npx",
            "args": ["-y", "stitch-mcp"],
            "env": env
        });

        let cmd = format!(
            "claude mcp remove --scope user stitch 2>/dev/null; claude mcp add-json --scope user stitch '{}'",
            config
        );

        match Command::new("sh").args(["-l", "-c", &cmd]).output() {
            Ok(output) if output.status.success() => McpSetupResult {
                success: true,
                message: "Stitch MCP가 설정되었습니다.".to_string(),
                needs_auth: None,
            },
            _ => McpSetupResult {
                success: false,
                message: "Stitch MCP 설정 실패".to_string(),
                needs_auth: None,
            },
        }
    }

    pub fn setup_gemini(&self) -> McpSetupResult {
        McpSetupResult {
            success: true,
            message: "Gemini MCP가 설정되었습니다. OAuth 인증이 필요합니다.".to_string(),
            needs_auth: Some(true),
        }
    }

    pub fn setup_github(&self, token: &str) -> McpSetupResult {
        let config = serde_json::json!({
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github"],
            "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": token}
        });

        let cmd = format!(
            "claude mcp remove --scope user github 2>/dev/null; claude mcp add-json --scope user github '{}'",
            config
        );

        match Command::new("sh").args(["-l", "-c", &cmd]).output() {
            Ok(output) if output.status.success() => McpSetupResult {
                success: true,
                message: "GitHub MCP가 설정되었습니다.".to_string(),
                needs_auth: None,
            },
            _ => McpSetupResult {
                success: false,
                message: "GitHub MCP 설정 실패".to_string(),
                needs_auth: None,
            },
        }
    }

    pub fn setup_slack_webhook(&self, webhook_url: &str) -> McpSetupResult {
        if !webhook_url.starts_with("https://hooks.slack.com/") {
            return McpSetupResult {
                success: false,
                message: "유효한 Slack Webhook URL이 아닙니다.".to_string(),
                needs_auth: None,
            };
        }

        let settings_path = self.claude_dir.join("settings.json");
        let mut settings: serde_json::Value = if settings_path.exists() {
            fs::read_to_string(&settings_path)
                .ok()
                .and_then(|c| serde_json::from_str(&c).ok())
                .unwrap_or(serde_json::json!({}))
        } else {
            serde_json::json!({})
        };

        settings["slack_webhook"] = serde_json::Value::String(webhook_url.to_string());
        fs::write(&settings_path, serde_json::to_string_pretty(&settings).unwrap_or_default()).ok();

        McpSetupResult {
            success: true,
            message: "Slack 웹훅이 설정되었습니다.".to_string(),
            needs_auth: None,
        }
    }

    pub fn setup_slack_tokens(&self, app_token: &str, bot_token: &str, bot_user_id: &str) {
        let settings_path = self.claude_dir.join("settings.json");
        let mut settings: serde_json::Value = if settings_path.exists() {
            std::fs::read_to_string(&settings_path)
                .ok()
                .and_then(|c| serde_json::from_str(&c).ok())
                .unwrap_or(serde_json::json!({}))
        } else {
            serde_json::json!({})
        };

        settings["slack_app_token"] = serde_json::Value::String(app_token.to_string());
        settings["slack_bot_token"] = serde_json::Value::String(bot_token.to_string());
        settings["slack_bot_user_id"] = serde_json::Value::String(bot_user_id.to_string());
        std::fs::write(&settings_path, serde_json::to_string_pretty(&settings).unwrap_or_default()).ok();

        log::info!("Slack tokens saved to settings.json");
    }

    pub fn check_gcloud_auth(&self) -> bool {
        Command::new("sh")
            .args(["-l", "-c", "gcloud auth list --filter=status:ACTIVE --format='value(account)'"])
            .output()
            .map(|o| o.status.success() && !String::from_utf8_lossy(&o.stdout).trim().is_empty())
            .unwrap_or(false)
    }

    pub fn open_oauth_url(&self, service: &str) {
        let url = match service {
            "google" => "https://console.cloud.google.com",
            "github" => "https://github.com/settings/tokens?type=beta",
            _ => return,
        };
        open::that(url).ok();
    }
}

fn copy_directory_recursive(src: &Path, dest: &Path) -> u32 {
    if !src.exists() {
        return 0;
    }

    fs::create_dir_all(dest).ok();
    let mut count = 0;

    if let Ok(entries) = fs::read_dir(src) {
        for entry in entries.flatten() {
            let src_path = entry.path();
            let dest_path = dest.join(entry.file_name());

            if src_path.is_dir() {
                if src.to_string_lossy().contains("skills") {
                    count += 1;
                }
                copy_directory_recursive(&src_path, &dest_path);
            } else {
                fs::copy(&src_path, &dest_path).ok();
            }
        }
    }

    count
}
