use regex::Regex;

/// CLI-specific configuration for response detection
pub struct CliProfile {
    #[allow(dead_code)]
    pub name: String,
    /// How long output must be silent before considering response complete (ms)
    pub idle_threshold_ms: u64,
    /// Regex patterns that match the CLI's input prompt
    pub prompt_patterns: Vec<Regex>,
}

impl CliProfile {
    pub fn get(cli_type: &str) -> Self {
        match cli_type {
            "claude" => Self {
                name: "claude".into(),
                idle_threshold_ms: 3000,
                prompt_patterns: vec![
                    Regex::new(r"[❯>]\s*$").unwrap(),
                ],
            },
            "gemini" => Self {
                name: "gemini".into(),
                idle_threshold_ms: 5000,
                prompt_patterns: vec![
                    Regex::new(r">\s*$").unwrap(),
                ],
            },
            "codex" => Self {
                name: "codex".into(),
                idle_threshold_ms: 5000,
                prompt_patterns: vec![
                    Regex::new(r"\$\s*$").unwrap(),
                ],
            },
            _ => Self {
                name: "generic".into(),
                idle_threshold_ms: 8000,
                prompt_patterns: vec![],
            },
        }
    }

    /// Check if the given line matches any prompt pattern
    pub fn is_prompt(&self, line: &str) -> bool {
        self.prompt_patterns.iter().any(|re| re.is_match(line))
    }
}
