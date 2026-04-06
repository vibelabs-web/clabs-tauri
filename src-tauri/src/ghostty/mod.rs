// @TASK P1-GHOSTTY - Ghostty module for libghostty integration
// @TASK P2-MANAGER - GhosttyManager + native view + Tauri commands
// @TASK P3B-THEME - Theme color mapping (TerminalTheme -> Ghostty config)
// @SPEC docs/spike-phase2-ghostty-manager.md

pub mod ffi;
pub mod manager;
pub mod native_view;
pub mod theme;

// Re-export key types for convenience
pub use ffi::{
    ghostty_app_t, ghostty_config_t, ghostty_surface_t,
    ghostty_surface_config_s, ghostty_runtime_config_s,
    ghostty_platform_e, ghostty_color_scheme_e,
};

pub use manager::GhosttyManager;
