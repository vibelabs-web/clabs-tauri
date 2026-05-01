// pane_id → AlacInstance 매핑 관리자.
// 추후 Tauri AppState에 Arc<AlacManager>로 주입한다.

use std::collections::HashMap;
use std::sync::Mutex;

use super::instance::{AlacInstance, CreateOptions};

#[derive(Default)]
pub struct AlacManager {
    instances: Mutex<HashMap<String, AlacInstance>>,
}

impl AlacManager {
    pub fn new() -> Self {
        Self::default()
    }

    /// Idempotent: 이미 존재하는 paneId면 그대로 두고 Ok 반환.
    /// React 측 PaneView가 split 등으로 unmount/remount되더라도 PTY/Term은 보존.
    pub fn create(&self, pane_id: &str, opts: CreateOptions) -> Result<(), String> {
        let mut map = self.instances.lock().map_err(|e| e.to_string())?;
        if map.contains_key(pane_id) {
            log::info!("alac: instance already exists for pane={pane_id} — reusing");
            return Ok(());
        }
        let inst = AlacInstance::new(opts)?;
        map.insert(pane_id.to_string(), inst);
        Ok(())
    }

    pub fn destroy(&self, pane_id: &str) {
        if let Ok(mut map) = self.instances.lock() {
            map.remove(pane_id); // Drop이 EventLoop join 처리.
        }
    }

    pub fn write_input(&self, pane_id: &str, bytes: Vec<u8>) {
        if let Ok(map) = self.instances.lock() {
            if let Some(inst) = map.get(pane_id) {
                inst.write_input(bytes);
            } else {
                log::warn!(
                    "alac::write_input: no instance for pane={} (have: {:?})",
                    pane_id,
                    map.keys().collect::<Vec<_>>()
                );
            }
        }
    }

    pub fn on_resize(&self, pane_id: &str, ws: alacritty_terminal::event::WindowSize) {
        if let Ok(map) = self.instances.lock() {
            if let Some(inst) = map.get(pane_id) {
                inst.on_resize(ws);
            }
        }
    }

    /// 외부에서 렌더 시점에 Term을 잠그고 grid를 읽기 위한 헬퍼.
    /// 클로저는 lock 보유 동안만 실행된다.
    pub fn with_term<F, R>(&self, pane_id: &str, f: F) -> Option<R>
    where
        F: FnOnce(&alacritty_terminal::Term<super::listener::AlacEventProxy>) -> R,
    {
        let map = self.instances.lock().ok()?;
        let inst = map.get(pane_id)?;
        let term = inst.terminal.lock();
        Some(f(&*term))
    }

    pub fn is_dirty(&self, pane_id: &str) -> bool {
        if let Ok(map) = self.instances.lock() {
            if let Some(inst) = map.get(pane_id) {
                return inst.proxy.dirty.load(std::sync::atomic::Ordering::Acquire);
            }
        }
        false
    }

    pub fn clear_dirty(&self, pane_id: &str) {
        if let Ok(map) = self.instances.lock() {
            if let Some(inst) = map.get(pane_id) {
                inst.proxy.dirty.store(false, std::sync::atomic::Ordering::Release);
            }
        }
    }
}
