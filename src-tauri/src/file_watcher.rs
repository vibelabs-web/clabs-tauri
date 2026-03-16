// 파일 변경 감시 + diff 생성 모듈
// @TASK WU-2 - File Change Detection + Diff Preview
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use similar::{ChangeTag, TextDiff};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

// 무시할 디렉토리 패턴
const IGNORE_DIRS: &[&str] = &[".git", "node_modules", "target", ".next", "dist", "__pycache__"];

// 파일 변경 정보
#[derive(Debug, Clone, serde::Serialize)]
pub struct FileChange {
    pub path: String,
    pub diff: String,
    pub change_type: String, // "modified", "created", "deleted"
    pub timestamp: u64,
}

pub struct FileWatcherManager {
    watcher: Mutex<Option<RecommendedWatcher>>,
    // 파일의 원본 내용 캐시 (diff 생성용)
    original_contents: Arc<Mutex<HashMap<String, String>>>,
    // 디바운스용 마지막 이벤트 시간
    last_events: Arc<Mutex<HashMap<String, Instant>>>,
}

impl FileWatcherManager {
    pub fn new() -> Self {
        Self {
            watcher: Mutex::new(None),
            original_contents: Arc::new(Mutex::new(HashMap::new())),
            last_events: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn start(&self, path: &str, app: AppHandle) -> Result<(), String> {
        self.stop(); // 기존 감시 중지

        let watch_path = PathBuf::from(path);
        if !watch_path.exists() {
            return Err("경로가 존재하지 않습니다".to_string());
        }

        // 초기 파일 내용 캐시
        self.cache_directory_contents(&watch_path);

        let original_contents = self.original_contents.clone();
        let last_events = self.last_events.clone();

        let mut watcher = RecommendedWatcher::new(
            move |result: Result<Event, notify::Error>| {
                if let Ok(event) = result {
                    match event.kind {
                        EventKind::Modify(_) | EventKind::Create(_) | EventKind::Remove(_) => {
                            for path in &event.paths {
                                // 무시할 경로 확인
                                if should_ignore(path) {
                                    continue;
                                }

                                let path_str = path.to_string_lossy().to_string();

                                // 디바운스 (500ms)
                                {
                                    let mut events = last_events.lock().unwrap();
                                    if let Some(last) = events.get(&path_str) {
                                        if last.elapsed() < Duration::from_millis(500) {
                                            continue;
                                        }
                                    }
                                    events.insert(path_str.clone(), Instant::now());
                                }

                                let change_type = match event.kind {
                                    EventKind::Create(_) => "created",
                                    EventKind::Remove(_) => "deleted",
                                    _ => "modified",
                                };

                                // diff 생성
                                let diff = generate_diff(
                                    &path_str,
                                    &original_contents,
                                    change_type,
                                );

                                let change = FileChange {
                                    path: path_str,
                                    diff,
                                    change_type: change_type.to_string(),
                                    timestamp: std::time::SystemTime::now()
                                        .duration_since(std::time::UNIX_EPOCH)
                                        .unwrap_or_default()
                                        .as_millis() as u64,
                                };

                                // Tauri 이벤트 발행
                                let _ = app.emit("file:changed", &change);
                            }
                        }
                        _ => {}
                    }
                }
            },
            Config::default().with_poll_interval(Duration::from_secs(1)),
        )
        .map_err(|e| format!("Watcher 생성 실패: {}", e))?;

        watcher
            .watch(&watch_path, RecursiveMode::Recursive)
            .map_err(|e| format!("감시 시작 실패: {}", e))?;

        *self.watcher.lock().unwrap() = Some(watcher);
        Ok(())
    }

    pub fn stop(&self) {
        let mut w = self.watcher.lock().unwrap();
        *w = None;
        self.last_events.lock().unwrap().clear();
    }

    fn cache_directory_contents(&self, path: &Path) {
        let mut contents = self.original_contents.lock().unwrap();
        cache_dir_recursive(path, &mut contents, 0);
    }
}

fn cache_dir_recursive(dir: &Path, contents: &mut HashMap<String, String>, depth: u32) {
    // 최대 깊이 10으로 제한
    if depth > 10 {
        return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = path.file_name().unwrap_or_default().to_string_lossy();

            if IGNORE_DIRS.iter().any(|d| *d == name.as_ref()) {
                continue;
            }

            if path.is_dir() {
                cache_dir_recursive(&path, contents, depth + 1);
            } else if path.is_file() {
                // 텍스트 파일만 캐시 (최대 1MB)
                if let Ok(metadata) = path.metadata() {
                    if metadata.len() <= 1_048_576 {
                        if let Ok(content) = fs::read_to_string(&path) {
                            contents.insert(path.to_string_lossy().to_string(), content);
                        }
                    }
                }
            }
        }
    }
}

/// 무시할 경로인지 확인
fn should_ignore(path: &Path) -> bool {
    for component in path.components() {
        let name = component.as_os_str().to_string_lossy();
        if IGNORE_DIRS.iter().any(|d| *d == name.as_ref()) {
            return true;
        }
    }
    // 바이너리/숨김 파일 무시 (.env는 예외)
    if let Some(name) = path.file_name() {
        let name = name.to_string_lossy();
        if name.starts_with('.') && name != ".env" {
            return true;
        }
    }
    false
}

/// diff 문자열 생성 (unified diff 형식)
fn generate_diff(
    path: &str,
    original_contents: &Arc<Mutex<HashMap<String, String>>>,
    change_type: &str,
) -> String {
    let contents = original_contents.lock().unwrap();
    let original = contents.get(path).map(|s| s.as_str()).unwrap_or("");

    match change_type {
        "deleted" => {
            format!(
                "--- {}\n+++ /dev/null\n{}",
                path,
                original
                    .lines()
                    .map(|l| format!("-{}", l))
                    .collect::<Vec<_>>()
                    .join("\n")
            )
        }
        "created" => {
            let current = fs::read_to_string(path).unwrap_or_default();
            format!(
                "--- /dev/null\n+++ {}\n{}",
                path,
                current
                    .lines()
                    .map(|l| format!("+{}", l))
                    .collect::<Vec<_>>()
                    .join("\n")
            )
        }
        _ => {
            // modified - similar 크레이트로 diff 생성
            let current = fs::read_to_string(path).unwrap_or_default();
            if original == current {
                return String::new();
            }
            let diff = TextDiff::from_lines(original, &current);
            let mut result = format!("--- a/{}\n+++ b/{}\n", path, path);
            for change in diff.iter_all_changes() {
                let sign = match change.tag() {
                    ChangeTag::Delete => "-",
                    ChangeTag::Insert => "+",
                    ChangeTag::Equal => " ",
                };
                result.push_str(&format!("{}{}", sign, change));
            }
            result
        }
    }
}
