use super::ansi::strip_ansi;
use super::cli_profiles::CliProfile;
use crate::pty::PtyPoolManager;
use std::sync::Arc;
use std::time::Duration;

/// Collect response from a pane after sending a message
pub struct ResponseCollector {
    pty_pool: Arc<PtyPoolManager>,
}

impl ResponseCollector {
    pub fn new(pty_pool: Arc<PtyPoolManager>) -> Self {
        Self { pty_pool }
    }

    /// Send a message to a pane and wait for the CLI to finish responding.
    /// Returns the cleaned response text.
    pub async fn get_response(
        &self,
        pane_id: &str,
        message: &str,
        timeout_ms: u64,
        cli_type: &str,
    ) -> Result<String, String> {
        let profile = CliProfile::get(cli_type);

        // 1. Clear buffer to mark response start
        self.pty_pool.clear_output_buffer(pane_id)?;

        // 2. Send message (text first, then Enter separately for TUI CLIs)
        let trimmed = message.trim();
        self.pty_pool.write(pane_id, trimmed)?;
        let delay_ms = if trimmed.len() > 1000 { 2000 }
            else if trimmed.len() > 200 { 1000 }
            else { 300 };
        tokio::time::sleep(std::time::Duration::from_millis(delay_ms)).await;
        self.pty_pool.write(pane_id, "\r")?;

        // 3. Wait for response to complete
        let raw = self.wait_for_idle(pane_id, timeout_ms, &profile).await?;

        // 4. Clean the response
        Ok(self.clean_response(&raw, message, &profile))
    }

    /// Wait until the pane output has been idle for the threshold duration.
    /// Returns accumulated raw output.
    pub async fn wait_for_idle(
        &self,
        pane_id: &str,
        timeout_ms: u64,
        profile: &CliProfile,
    ) -> Result<String, String> {
        let idle_threshold = Duration::from_millis(profile.idle_threshold_ms);
        let timeout = Duration::from_millis(timeout_ms);
        let start = std::time::Instant::now();
        let poll_interval = Duration::from_millis(500);

        // Wait a moment for the CLI to start processing
        tokio::time::sleep(Duration::from_millis(1000)).await;

        loop {
            // Check timeout
            if start.elapsed() > timeout {
                // Return whatever we have even on timeout
                let chunks = self.pty_pool.get_recent_output(pane_id, 500)?;
                return Ok(chunks.join(""));
            }

            // Check idle duration
            let idle = self.pty_pool.get_idle_duration(pane_id)?;

            if idle >= idle_threshold {
                // Check prompt pattern if available
                let chunks = self.pty_pool.get_recent_output(pane_id, 500)?;
                let combined = chunks.join("");

                if profile.prompt_patterns.is_empty() {
                    // Generic: silence alone is sufficient
                    return Ok(combined);
                }

                // Check if last non-empty line matches prompt
                let stripped = strip_ansi(&combined);
                let last_line = stripped.lines().rev().find(|l| !l.trim().is_empty());
                if let Some(line) = last_line {
                    if profile.is_prompt(line) {
                        return Ok(combined);
                    }
                }

                // Prompt not found but idle — if very idle (2x threshold), return anyway
                if idle >= idle_threshold * 2 {
                    return Ok(combined);
                }
            }

            tokio::time::sleep(poll_interval).await;
        }
    }

    /// Clean raw terminal output into readable response text
    fn clean_response(&self, raw: &str, input_message: &str, profile: &CliProfile) -> String {
        let stripped = strip_ansi(raw);
        let lines: Vec<&str> = stripped.lines().collect();

        if lines.is_empty() {
            return String::new();
        }

        // Skip the echoed input (first line usually echoes what we typed)
        let input_first_line = input_message.lines().next().unwrap_or("");
        let start_idx = lines.iter().position(|l| {
            !l.trim().is_empty() && !l.contains(input_first_line)
        }).unwrap_or(0);

        // Remove trailing prompt line
        let end_idx = if lines.len() > 1 {
            let last = lines.last().unwrap();
            if profile.is_prompt(last) {
                lines.len() - 1
            } else {
                lines.len()
            }
        } else {
            lines.len()
        };

        let response_lines = &lines[start_idx..end_idx];

        // Collapse consecutive empty lines
        let mut result = String::new();
        let mut prev_empty = false;
        for line in response_lines {
            if line.trim().is_empty() {
                if !prev_empty {
                    result.push('\n');
                }
                prev_empty = true;
            } else {
                if !result.is_empty() {
                    result.push('\n');
                }
                result.push_str(line);
                prev_empty = false;
            }
        }

        result.trim().to_string()
    }
}
