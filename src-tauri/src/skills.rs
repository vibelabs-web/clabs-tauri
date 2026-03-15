use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillInfo {
    pub name: String,
    pub description: String,
    pub trigger: String,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub version: Option<String>,
    #[serde(default)]
    pub author: Option<String>,
    pub path: String,
}

pub struct SkillScanner {
    skills_dir: PathBuf,
}

impl SkillScanner {
    pub fn new() -> Self {
        let skills_dir = dirs::home_dir()
            .unwrap_or_default()
            .join(".claude")
            .join("skills");
        Self { skills_dir }
    }

    pub fn scan(&self) -> Vec<SkillInfo> {
        let mut skills = Vec::new();
        let mut seen = std::collections::HashSet::new();

        self.scan_directory(&self.skills_dir, &mut skills, &mut seen);
        skills
    }

    fn scan_directory(
        &self,
        dir: &Path,
        skills: &mut Vec<SkillInfo>,
        seen: &mut std::collections::HashSet<String>,
    ) {
        if !dir.exists() {
            return;
        }

        let entries = match fs::read_dir(dir) {
            Ok(e) => e,
            Err(_) => return,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            if !path.is_dir() {
                continue;
            }

            let folder_name = entry.file_name().to_string_lossy().to_string();

            // Look for SKILL.md or skill.md
            let skill_md = path.join("SKILL.md");
            let skill_md_lower = path.join("skill.md");
            let md_path = if skill_md.exists() {
                skill_md
            } else if skill_md_lower.exists() {
                skill_md_lower
            } else {
                continue;
            };

            if let Ok(content) = fs::read_to_string(&md_path) {
                if let Some(info) = self.parse_skill_md(&content, &folder_name) {
                    if !seen.contains(&info.name) {
                        seen.insert(info.name.clone());
                        skills.push(info);
                    }
                }
            }
        }
    }

    fn parse_skill_md(&self, content: &str, folder_name: &str) -> Option<SkillInfo> {
        // Extract YAML frontmatter between ---
        let re = regex::Regex::new(r"^---\n([\s\S]*?)\n---").ok()?;
        let caps = re.captures(content)?;
        let yaml_content = caps.get(1)?.as_str();

        let mut metadata: HashMap<String, String> = HashMap::new();

        for line in yaml_content.lines() {
            if let Some(colon_pos) = line.find(':') {
                let key = line[..colon_pos].trim().to_string();
                let value = line[colon_pos + 1..].trim().to_string();
                if !key.is_empty() && !value.is_empty() {
                    metadata.insert(key, value);
                }
            }
        }

        let name = metadata.get("name")?.to_string();
        let description = metadata.get("description")?.to_string();
        let command = metadata.get("name").cloned().unwrap_or_else(|| folder_name.to_string());
        let category = metadata.get("category").cloned().or_else(|| {
            Some(self.infer_category(&command, &description))
        });

        Some(SkillInfo {
            name,
            description,
            trigger: command,
            category,
            version: metadata.get("version").cloned(),
            author: metadata.get("author").cloned(),
            path: folder_name.to_string(),
        })
    }

    fn infer_category(&self, name: &str, description: &str) -> String {
        let lower_name = name.to_lowercase();
        let lower_desc = description.to_lowercase();

        let planning = ["socrates", "neurion", "eureka", "screen-spec", "tasks-generator", "reverse"];
        let dev = ["project-bootstrap", "auto-orchestrate", "orchestrate", "ralph-loop", "ultra-thin-orchestrate"];
        let verify = ["code-review", "trinity", "evaluation", "verification-before-completion", "powerqa", "sync"];
        let tools = ["memory", "rag", "deep-research", "chrome-browser", "packaging", "goal-setting"];

        if planning.iter().any(|p| lower_name == *p) || lower_desc.contains("기획") || lower_desc.contains("설계") {
            return "기획".to_string();
        }
        if dev.iter().any(|p| lower_name == *p) || lower_desc.contains("오케스트") || lower_desc.contains("개발") {
            return "개발".to_string();
        }
        if verify.iter().any(|p| lower_name == *p) || lower_desc.contains("검증") || lower_desc.contains("리뷰") || lower_desc.contains("테스트") {
            return "검증".to_string();
        }
        if tools.iter().any(|p| lower_name == *p) || lower_desc.contains("도구") || lower_desc.contains("검색") {
            return "도구".to_string();
        }
        if lower_desc.contains("디자인") || lower_desc.contains("UI") {
            return "디자인".to_string();
        }

        "기타".to_string()
    }

    pub fn categorize(&self, skills: &[SkillInfo]) -> HashMap<String, Vec<SkillInfo>> {
        let mut categorized: HashMap<String, Vec<SkillInfo>> = HashMap::new();
        for skill in skills {
            let category = skill.category.clone().unwrap_or_else(|| "기타".to_string());
            categorized.entry(category).or_default().push(skill.clone());
        }
        categorized
    }
}
