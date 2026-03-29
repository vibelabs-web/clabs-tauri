pub mod ansi;
pub mod cli_profiles;
pub mod response_collector;
mod socket_server;

use crate::pty::PtyPoolManager;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::AppHandle;

pub struct OrchestratorServer {
    socket_path: PathBuf,
}

impl OrchestratorServer {
    pub fn new() -> Self {
        let home = dirs::home_dir().unwrap_or_default();
        Self {
            socket_path: home.join(".clabs").join("sock"),
        }
    }

    /// Get the socket path (for env var injection)
    pub fn socket_path(&self) -> &PathBuf {
        &self.socket_path
    }

    /// Start the socket server in a background tokio task.
    /// Also installs the `clabs` CLI binary to `~/.clabs/bin/`.
    pub fn start(&self, pty_pool: Arc<PtyPoolManager>, app: AppHandle) {
        let path = self.socket_path.clone();

        // Ensure ~/.clabs directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        // Install clabs CLI binary to ~/.clabs/bin/clabs
        Self::install_cli_binary();

        tauri::async_runtime::spawn(async move {
            socket_server::run_socket_server(path, pty_pool, app).await;
        });

        log::info!("Orchestrator server started at {:?}", self.socket_path);
    }

    /// Install the clabs-cli binary to ~/.clabs/bin/clabs so it's in PATH
    fn install_cli_binary() {
        let home = dirs::home_dir().unwrap_or_default();
        let bin_dir = home.join(".clabs").join("bin");
        std::fs::create_dir_all(&bin_dir).ok();

        // Find the clabs-cli binary next to the current executable
        let current_exe = match std::env::current_exe() {
            Ok(p) => p,
            Err(_) => return,
        };
        let exe_dir = match current_exe.parent() {
            Some(d) => d,
            None => return,
        };

        // Look for clabs-cli in the same directory as the main binary
        let source = exe_dir.join("clabs-cli");
        let target = bin_dir.join("clabs");

        if source.exists() {
            // Only copy if source is newer or target doesn't exist
            let should_copy = if target.exists() {
                let src_mod = std::fs::metadata(&source).and_then(|m| m.modified()).ok();
                let tgt_mod = std::fs::metadata(&target).and_then(|m| m.modified()).ok();
                match (src_mod, tgt_mod) {
                    (Some(s), Some(t)) => s > t,
                    _ => true,
                }
            } else {
                true
            };

            if should_copy {
                if let Err(e) = std::fs::copy(&source, &target) {
                    log::warn!("Failed to install clabs CLI: {}", e);
                } else {
                    // Ensure executable permission
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::PermissionsExt;
                        std::fs::set_permissions(&target, std::fs::Permissions::from_mode(0o755)).ok();
                    }
                    log::info!("Installed clabs CLI to {:?}", target);
                }
            }
        } else {
            log::debug!("clabs-cli binary not found at {:?}, skipping install", source);
        }
    }

    /// Clean up socket file on shutdown
    pub fn stop(&self) {
        std::fs::remove_file(&self.socket_path).ok();
        log::info!("Orchestrator socket removed");
    }
}

impl Drop for OrchestratorServer {
    fn drop(&mut self) {
        self.stop();
    }
}
