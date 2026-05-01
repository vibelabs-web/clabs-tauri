// @TASK P1-GHOSTTY - Ghostty module for libghostty integration
// @TASK P2-MANAGER - GhosttyManager + native view + Tauri commands
// @TASK P3B-THEME - Theme color mapping (TerminalTheme -> Ghostty config)
// @SPEC docs/spike-phase2-ghostty-manager.md

// bindgen 자동 생성 FFI (수동 ffi.rs 대체)
#[path = "ffi_generated.rs"]
pub mod ffi;
pub mod manager;
pub mod native_view;
pub mod theme;

pub use manager::GhosttyManager;
