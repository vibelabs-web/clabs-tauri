use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
struct PtyDataEvent {
    #[serde(rename = "paneId")]
    pane_id: String,
    data: String,
}

#[derive(Clone, Serialize)]
struct PtyExitEvent {
    #[serde(rename = "paneId")]
    pane_id: String,
    code: i32,
}

struct PtyEntry {
    master: Box<dyn MasterPty + Send>,
    write_tx: mpsc::Sender<String>,
    alive: Arc<Mutex<bool>>,
    pid: u32,
}

pub struct PtyPoolManager {
    pool: Mutex<HashMap<String, PtyEntry>>,
}

impl PtyPoolManager {
    pub fn new() -> Self {
        Self {
            pool: Mutex::new(HashMap::new()),
        }
    }

    pub fn spawn(&self, pane_id: &str, cwd: &str, app: AppHandle) -> Result<u32, String> {
        self.kill(pane_id);

        let pty_system = native_pty_system();

        let pair = pty_system
            .openpty(PtySize {
                rows: 30,
                cols: 120,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| format!("Failed to open PTY: {}", e))?;

        let shell = if cfg!(target_os = "macos") {
            "/bin/zsh"
        } else if cfg!(target_os = "windows") {
            "powershell.exe"
        } else {
            "/bin/bash"
        };

        let home_dir = dirs::home_dir().unwrap_or_default();
        let work_dir = if cwd == "~" || cwd.is_empty() {
            home_dir.clone()
        } else if cwd.starts_with("~/") {
            home_dir.join(&cwd[2..])
        } else if cwd == "." {
            std::env::current_dir().unwrap_or(home_dir.clone())
        } else {
            std::path::PathBuf::from(cwd)
        };

        let mut cmd = CommandBuilder::new(shell);
        cmd.cwd(&work_dir);

        cmd.env("TERM", "xterm-256color");
        cmd.env("HOME", home_dir.to_string_lossy().as_ref());
        cmd.env("LANG", "ko_KR.UTF-8");
        cmd.env("LC_ALL", "ko_KR.UTF-8");
        cmd.env("LC_CTYPE", "UTF-8");

        let mut paths: Vec<String> = Vec::new();
        let path_candidates = [
            home_dir.join(".nvm/current/bin"),
            home_dir.join(".fnm/current/bin"),
            home_dir.join(".volta/bin"),
            home_dir.join(".local/bin"),
            home_dir.join(".cargo/bin"),
        ];
        for p in &path_candidates {
            if p.exists() {
                paths.push(p.to_string_lossy().to_string());
            }
        }
        paths.extend([
            "/opt/homebrew/bin".to_string(),
            "/usr/local/bin".to_string(),
            "/usr/bin".to_string(),
            "/bin".to_string(),
            "/usr/sbin".to_string(),
            "/sbin".to_string(),
        ]);
        cmd.env("PATH", paths.join(":"));

        for key in &["USER", "SHELL", "SSH_AUTH_SOCK", "DISPLAY"] {
            if let Ok(val) = std::env::var(key) {
                cmd.env(key, &val);
            }
        }

        // nvm 호환성: npm_config_prefix가 설정되어 있으면 충돌 발생
        cmd.env_remove("npm_config_prefix");

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| format!("Failed to spawn shell: {}", e))?;

        let pid = child.process_id().unwrap_or(0);

        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| format!("Failed to clone reader: {}", e))?;

        let mut writer = pair
            .master
            .take_writer()
            .map_err(|e| format!("Failed to take writer: {}", e))?;

        let alive = Arc::new(Mutex::new(true));
        let alive_clone = alive.clone();

        // MPSC channel for ordered writes
        let (write_tx, write_rx) = mpsc::channel::<String>();

        // Writer thread: reads from channel, writes to PTY in FIFO order
        let alive_writer = alive.clone();
        thread::spawn(move || {
            while let Ok(data) = write_rx.recv() {
                if !*alive_writer.lock().unwrap() {
                    break;
                }
                writer.write_all(data.as_bytes()).ok();
                writer.flush().ok();
            }
        });

        let pane_id_data = pane_id.to_string();
        let pane_id_exit = pane_id.to_string();
        let app_data = app.clone();
        let app_exit = app.clone();

        // Data reader thread (UTF-8 boundary-safe)
        thread::spawn(move || {
            let mut buf = [0u8; 8192];
            let mut incomplete: Vec<u8> = Vec::new();
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        // Prepend incomplete bytes from previous read
                        let mut data_bytes = Vec::with_capacity(incomplete.len() + n);
                        data_bytes.extend_from_slice(&incomplete);
                        data_bytes.extend_from_slice(&buf[..n]);
                        incomplete.clear();

                        // Find valid UTF-8 boundary
                        match std::str::from_utf8(&data_bytes) {
                            Ok(s) => {
                                app_data
                                    .emit("pty:data", PtyDataEvent {
                                        pane_id: pane_id_data.clone(),
                                        data: s.to_string(),
                                    })
                                    .ok();
                            }
                            Err(e) => {
                                let valid_up_to = e.valid_up_to();
                                if valid_up_to > 0 {
                                    let valid = unsafe {
                                        std::str::from_utf8_unchecked(&data_bytes[..valid_up_to])
                                    };
                                    app_data
                                        .emit("pty:data", PtyDataEvent {
                                            pane_id: pane_id_data.clone(),
                                            data: valid.to_string(),
                                        })
                                        .ok();
                                }
                                // Save trailing incomplete bytes for next read
                                incomplete.extend_from_slice(&data_bytes[valid_up_to..]);
                            }
                        }
                    }
                    Err(_) => break,
                }
            }
        });

        // Exit watcher thread
        thread::spawn(move || {
            let mut child = child;
            let status = child.wait();
            let exit_code = status.map(|s| s.exit_code() as i32).unwrap_or(-1);
            *alive_clone.lock().unwrap() = false;
            app_exit
                .emit(
                    "pty:exit",
                    PtyExitEvent {
                        pane_id: pane_id_exit.clone(),
                        code: exit_code,
                    },
                )
                .ok();
            log::info!("PTY {} exited with code: {}", pane_id_exit, exit_code);
        });

        let entry = PtyEntry {
            master: pair.master,
            write_tx,
            alive,
            pid,
        };

        self.pool.lock().unwrap().insert(pane_id.to_string(), entry);
        log::info!("PTY {} spawned with PID: {}", pane_id, pid);

        Ok(pid)
    }

    /// Write data to PTY via channel (FIFO guaranteed, non-blocking)
    pub fn write(&self, pane_id: &str, data: &str) -> Result<(), String> {
        let pool = self.pool.lock().unwrap();
        if let Some(entry) = pool.get(pane_id) {
            entry
                .write_tx
                .send(data.to_string())
                .map_err(|e| format!("Write channel error: {}", e))?;
            Ok(())
        } else {
            Err(format!("PTY not found: {}", pane_id))
        }
    }

    pub fn write_command(&self, pane_id: &str, text: &str) -> Result<(), String> {
        let cmd = format!("{}\r", text.trim());
        self.write(pane_id, &cmd)
    }

    pub fn resize(&self, pane_id: &str, cols: u16, rows: u16) -> Result<(), String> {
        let pool = self.pool.lock().unwrap();
        if let Some(entry) = pool.get(pane_id) {
            entry
                .master
                .resize(PtySize {
                    rows,
                    cols,
                    pixel_width: 0,
                    pixel_height: 0,
                })
                .map_err(|e| format!("Resize error: {}", e))?;
            Ok(())
        } else {
            Err(format!("PTY not found: {}", pane_id))
        }
    }

    pub fn kill(&self, pane_id: &str) {
        let mut pool = self.pool.lock().unwrap();
        if let Some(entry) = pool.remove(pane_id) {
            *entry.alive.lock().unwrap() = false;
            drop(entry);
            log::info!("PTY {} killed", pane_id);
        }
    }

    pub fn kill_all(&self) {
        let mut pool = self.pool.lock().unwrap();
        for (id, entry) in pool.drain() {
            *entry.alive.lock().unwrap() = false;
            drop(entry);
            log::info!("PTY {} killed (kill_all)", id);
        }
    }

    pub fn is_running(&self, pane_id: &str) -> bool {
        let pool = self.pool.lock().unwrap();
        if let Some(entry) = pool.get(pane_id) {
            *entry.alive.lock().unwrap()
        } else {
            false
        }
    }

    pub fn has_any_running(&self) -> bool {
        !self.pool.lock().unwrap().is_empty()
    }

    pub fn get_running_pane_ids(&self) -> Vec<String> {
        self.pool.lock().unwrap().keys().cloned().collect()
    }

    /// PTY 프로세스의 현재 작업 디렉토리 조회 (macOS: lsof 사용)
    pub fn get_cwd(&self, pane_id: &str) -> Result<String, String> {
        let pool = self.pool.lock().unwrap();
        let entry = pool.get(pane_id).ok_or("PTY not found")?;
        let pid = entry.pid;
        drop(pool);

        let output = std::process::Command::new("lsof")
            .args(["-a", "-p", &pid.to_string(), "-d", "cwd", "-Fn"])
            .output()
            .map_err(|e| format!("lsof failed: {}", e))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        // lsof -Fn 출력에서 "n/path/to/dir" 라인 찾기
        for line in stdout.lines() {
            if line.starts_with('n') && line.len() > 1 {
                return Ok(line[1..].to_string());
            }
        }
        Err("Could not determine CWD".to_string())
    }
}
