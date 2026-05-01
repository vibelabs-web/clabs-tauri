// alacritty_terminal::Term<T>의 EventListener 구현.
// PTY → vte 파서 → Term 으로 들어온 출력이 발생할 때마다 호출되며,
// 우리는 가장 단순한 방식으로 "다시 그려라" 플래그만 세운다.
// 실제 redraw 호출은 NSView 측 RAF/CADisplayLink 또는 timer에서 처리.

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use alacritty_terminal::event::{Event, EventListener};

#[derive(Clone)]
pub struct AlacEventProxy {
    pub(crate) dirty: Arc<AtomicBool>,
    pub(crate) exited: Arc<AtomicBool>,
}

impl AlacEventProxy {
    pub fn new() -> Self {
        Self {
            dirty: Arc::new(AtomicBool::new(true)),
            exited: Arc::new(AtomicBool::new(false)),
        }
    }
}

impl EventListener for AlacEventProxy {
    fn send_event(&self, event: Event) {
        match event {
            // PTY 출력 후 wakeup, mouse 커서 변경, title 변경 등 — 모두 재렌더 트리거.
            Event::Wakeup
            | Event::MouseCursorDirty
            | Event::CursorBlinkingChange
            | Event::Title(_)
            | Event::ColorRequest(..)
            | Event::TextAreaSizeRequest(_) => {
                self.dirty.store(true, Ordering::Release);
            }
            Event::Exit => {
                self.exited.store(true, Ordering::Release);
                self.dirty.store(true, Ordering::Release);
            }
            // 클립보드/PtyWrite 등은 향후 처리.
            _ => {
                self.dirty.store(true, Ordering::Release);
            }
        }
    }
}
