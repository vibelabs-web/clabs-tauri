// @TASK P1-GHOSTTY - Ghostty module for libghostty integration
// @SPEC docs/spike-phase1-ghosttykit.md

pub mod ffi;

// Re-export key types for convenience
pub use ffi::{
    ghostty_app_t, ghostty_config_t, ghostty_surface_t,
    ghostty_surface_config_s, ghostty_runtime_config_s,
    ghostty_platform_e, ghostty_color_scheme_e,
};
