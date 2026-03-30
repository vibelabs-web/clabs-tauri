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
    instance_id: String,
}

impl OrchestratorServer {
    pub fn new() -> Self {
        let home = dirs::home_dir().unwrap_or_default();
        // Generate unique instance ID from PID
        let instance_id = format!("{}", std::process::id());
        let socket_name = format!("sock-{}", instance_id);
        Self {
            socket_path: home.join(".clabs").join(&socket_name),
            instance_id,
        }
    }

    pub fn instance_id(&self) -> &str {
        &self.instance_id
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

        // Register this instance in ~/.clabs/instances.json
        Self::register_instance(&self.instance_id, &self.socket_path);

        log::info!("Orchestrator server started at {:?} (instance: {})", self.socket_path, self.instance_id);
    }

    /// Register instance in shared registry so other Clabs apps can discover it
    fn register_instance(instance_id: &str, socket_path: &PathBuf) {
        let home = dirs::home_dir().unwrap_or_default();
        let registry_path = home.join(".clabs").join("instances.json");

        let mut instances: serde_json::Value = if registry_path.exists() {
            std::fs::read_to_string(&registry_path)
                .ok()
                .and_then(|c| serde_json::from_str(&c).ok())
                .unwrap_or(serde_json::json!({}))
        } else {
            serde_json::json!({})
        };

        instances[instance_id] = serde_json::json!({
            "socket": socket_path.to_string_lossy(),
            "pid": std::process::id(),
            "started": chrono::Utc::now().to_rfc3339(),
        });

        std::fs::write(&registry_path, serde_json::to_string_pretty(&instances).unwrap_or_default()).ok();
    }

    /// Remove instance from registry
    fn unregister_instance(instance_id: &str) {
        let home = dirs::home_dir().unwrap_or_default();
        let registry_path = home.join(".clabs").join("instances.json");

        if let Ok(content) = std::fs::read_to_string(&registry_path) {
            if let Ok(mut instances) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(obj) = instances.as_object_mut() {
                    obj.remove(instance_id);
                    std::fs::write(&registry_path, serde_json::to_string_pretty(&instances).unwrap_or_default()).ok();
                }
            }
        }
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

    /// Clean up socket file and unregister on shutdown
    pub fn stop(&self) {
        std::fs::remove_file(&self.socket_path).ok();
        Self::unregister_instance(&self.instance_id);
        log::info!("Orchestrator socket removed, instance {} unregistered", self.instance_id);
    }
}

impl Drop for OrchestratorServer {
    fn drop(&mut self) {
        self.stop();
    }
}
