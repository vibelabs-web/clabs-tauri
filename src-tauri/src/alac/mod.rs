// Phase 6 — alacritty_terminal 기반 네이티브 터미널.
// libghostty 임베딩 시도(macOS 26 xzone deadlock + 미공개 API 의존)를 포기하고
// 검증된 alacritty_terminal 코어 + 자체 NSView 렌더 경로로 전환.
//
// 모듈 구조:
//   listener.rs  — Term<T>의 EventListener 구현 (출력 이벤트 → wakeup 채널)
//   instance.rs  — 단일 터미널 인스턴스: Term + tty::Pty + EventLoop
//   manager.rs   — pane_id → AlacInstance 매핑
//
// 렌더/IME(NSView)는 별도 모듈로 추가 예정.

#![cfg(target_os = "macos")]

mod instance;
mod listener;
mod manager;
pub mod view;

pub use instance::CreateOptions;
pub use manager::AlacManager;
