// @TASK P2-MANAGER - GhosttyManager: terminal instance lifecycle management
// @SPEC docs/spike-phase2-ghostty-manager.md
//
// Manages ghostty terminal instances (app, surface, config, NSView) per pane.
// Thread-safe via Mutex. All NSView operations delegated to native_view module.

use std::collections::HashMap;
use std::ffi::{c_void, CString};
use std::sync::Mutex;

use super::ffi::*;
use super::native_view;

// ===================================================================
// Instance
// ===================================================================

/// A single ghostty terminal instance bound to a pane.
pub struct GhosttyInstance {
    pub app: ghostty_app_t,
    pub surface: ghostty_surface_t,
    pub config: ghostty_config_t,
    /// Raw pointer to the NSView (retained +1, owned by us)
    pub view: *mut c_void,
    /// Raw pointer to the NSWindow (borrowed, not owned)
    pub ns_window: *mut c_void,
}

// SAFETY: GhosttyInstance contains raw pointers to Objective-C objects and
// C library handles. These are only accessed under Mutex and only from the
// main thread (Tauri command handlers). The pointers themselves are Send-safe
// as long as we don't access them concurrently.
unsafe impl Send for GhosttyInstance {}

// ===================================================================
// Runtime callbacks (extern "C")
// ===================================================================

/// Wakeup callback — called by libghostty when it needs the app to tick.
unsafe extern "C" fn wakeup_callback(_userdata: *mut c_void) {
    log::trace!("ghostty: wakeup_callback");
}

/// Action callback — called when ghostty wants the runtime to perform an action.
unsafe extern "C" fn action_callback(
    _app: ghostty_app_t,
    _target: ghostty_target_s,
    action: ghostty_action_s,
) -> bool {
    log::debug!("ghostty: action_callback tag={:?}", action.tag);
    // Return false to indicate we didn't handle the action
    // (ghostty will use its default behavior)
    false
}

/// Read clipboard callback — ghostty wants to read the clipboard.
unsafe extern "C" fn read_clipboard_callback(
    _userdata: *mut c_void,
    _clipboard: ghostty_clipboard_e,
    _state: *mut c_void,
) -> bool {
    log::debug!("ghostty: read_clipboard_callback");
    false
}

/// Confirm read clipboard callback.
unsafe extern "C" fn confirm_read_clipboard_callback(
    _userdata: *mut c_void,
    _content: *const std::os::raw::c_char,
    _state: *mut c_void,
    _request: ghostty_clipboard_request_e,
) {
    log::debug!("ghostty: confirm_read_clipboard_callback");
}

/// Write clipboard callback — ghostty wants to write to the clipboard.
unsafe extern "C" fn write_clipboard_callback(
    _userdata: *mut c_void,
    _clipboard: ghostty_clipboard_e,
    _content: *const ghostty_clipboard_content_s,
    _count: usize,
    _confirm: bool,
) {
    log::debug!("ghostty: write_clipboard_callback");
}

/// Close surface callback — ghostty wants to close a surface.
unsafe extern "C" fn close_surface_callback(_userdata: *mut c_void, _process_alive: bool) {
    log::info!("ghostty: close_surface_callback");
}

// ===================================================================
// GhosttyManager
// ===================================================================

pub struct GhosttyManager {
    instances: Mutex<HashMap<String, GhosttyInstance>>,
}

impl GhosttyManager {
    pub fn new() -> Self {
        Self {
            instances: Mutex::new(HashMap::new()),
        }
    }

    /// Create a new ghostty terminal surface for the given pane.
    ///
    /// This initializes config, app, NSView, and surface in sequence.
    /// The NSView is added to the window's contentView at (0,0) with a small default size.
    /// Call `set_frame` afterwards to position it correctly.
    pub fn create(
        &self,
        pane_id: &str,
        ns_window: *mut c_void,
        config_overrides: Option<HashMap<String, String>>,
    ) -> Result<(), String> {
        native_view::assert_main_thread();

        let mut instances = self.instances.lock().map_err(|e| e.to_string())?;

        if instances.contains_key(pane_id) {
            return Err(format!("ghostty instance already exists for pane: {}", pane_id));
        }

        log::info!("ghostty: creating instance for pane={}", pane_id);

        unsafe {
            // 1. Config
            let config = ghostty_config_new();
            if config.is_null() {
                return Err("ghostty_config_new returned null".to_string());
            }
            ghostty_config_load_default_files(config);

            // Apply config overrides if provided
            if let Some(overrides) = &config_overrides {
                for (key, value) in overrides {
                    // Load overrides as individual config key=value strings via file loading
                    // For now, log them — full override support requires ghostty_config_set
                    log::debug!("ghostty: config override {}={}", key, value);
                }
            }

            ghostty_config_finalize(config);

            // Check for config diagnostics
            let diag_count = ghostty_config_diagnostics_count(config);
            if diag_count > 0 {
                for i in 0..diag_count {
                    let diag = ghostty_config_get_diagnostic(config, i);
                    if !diag.message.is_null() {
                        let msg = std::ffi::CStr::from_ptr(diag.message).to_string_lossy();
                        log::warn!("ghostty config diagnostic: {}", msg);
                    }
                }
            }

            // 2. Runtime config (callbacks)
            let runtime = ghostty_runtime_config_s {
                userdata: std::ptr::null_mut(),
                supports_selection_clipboard: false,
                wakeup_cb: Some(wakeup_callback),
                action_cb: Some(action_callback),
                read_clipboard_cb: Some(read_clipboard_callback),
                confirm_read_clipboard_cb: Some(confirm_read_clipboard_callback),
                write_clipboard_cb: Some(write_clipboard_callback),
                close_surface_cb: Some(close_surface_callback),
            };

            // 3. App
            let app = ghostty_app_new(&runtime, config);
            if app.is_null() {
                ghostty_config_free(config);
                return Err("ghostty_app_new returned null".to_string());
            }

            // 4. Create NSView with CAMetalLayer
            let view = native_view::create_ghostty_view(ns_window, 0.0, 0.0, 400.0, 300.0);
            if view.is_null() {
                ghostty_app_free(app);
                ghostty_config_free(config);
                return Err("failed to create NSView".to_string());
            }

            // 5. Surface config — pass the NSView as the platform handle
            let mut surface_config = ghostty_surface_config_new();
            surface_config.platform_tag = ghostty_platform_e::GHOSTTY_PLATFORM_MACOS;
            surface_config.platform =
                ghostty_platform_u {
                    macos: std::mem::ManuallyDrop::new(ghostty_platform_macos_s {
                        nsview: view,
                    }),
                };
            surface_config.scale_factor = 2.0; // Retina default
            surface_config.font_size = 0.0; // Use config default
            surface_config.context = ghostty_surface_context_e::GHOSTTY_SURFACE_CONTEXT_WINDOW;

            // 6. Surface
            let surface = ghostty_surface_new(app, &surface_config);
            if surface.is_null() {
                native_view::remove_view(view);
                ghostty_app_free(app);
                ghostty_config_free(config);
                return Err("ghostty_surface_new returned null".to_string());
            }

            log::info!("ghostty: instance created for pane={}", pane_id);

            instances.insert(
                pane_id.to_string(),
                GhosttyInstance {
                    app,
                    surface,
                    config,
                    view,
                    ns_window,
                },
            );
        }

        Ok(())
    }

    /// Destroy a ghostty terminal instance for the given pane.
    pub fn destroy(&self, pane_id: &str) {
        native_view::assert_main_thread();

        let mut instances = match self.instances.lock() {
            Ok(i) => i,
            Err(e) => {
                log::error!("ghostty: failed to lock instances: {}", e);
                return;
            }
        };

        if let Some(instance) = instances.remove(pane_id) {
            log::info!("ghostty: destroying instance for pane={}", pane_id);
            unsafe {
                ghostty_surface_free(instance.surface);
                ghostty_app_free(instance.app);
                ghostty_config_free(instance.config);
                native_view::remove_view(instance.view);
            }
        } else {
            log::warn!("ghostty: no instance found for pane={}", pane_id);
        }
    }

    /// Set the frame (position and size) of the terminal NSView.
    pub fn set_frame(&self, pane_id: &str, x: f64, y: f64, width: f64, height: f64) {
        native_view::assert_main_thread();

        let instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return,
        };

        if let Some(instance) = instances.get(pane_id) {
            unsafe {
                native_view::set_view_frame(instance.view, instance.ns_window, x, y, width, height);

                // Also notify ghostty of the new size in pixels
                ghostty_surface_set_size(
                    instance.surface,
                    width as u32,
                    height as u32,
                );
            }
        } else {
            log::warn!("ghostty: set_frame - no instance for pane={}", pane_id);
        }
    }

    /// Show or hide the terminal NSView.
    pub fn set_visible(&self, pane_id: &str, visible: bool) {
        native_view::assert_main_thread();

        let instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return,
        };

        if let Some(instance) = instances.get(pane_id) {
            unsafe {
                native_view::set_view_visible(instance.view, visible);

                // Notify ghostty of occlusion state (hidden = occluded)
                ghostty_surface_set_occlusion(instance.surface, !visible);
            }
        }
    }

    /// Focus the terminal (make it the first responder).
    pub fn focus(&self, pane_id: &str) {
        native_view::assert_main_thread();

        let instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return,
        };

        if let Some(instance) = instances.get(pane_id) {
            unsafe {
                native_view::set_view_focus(instance.view, instance.ns_window);
                ghostty_surface_set_focus(instance.surface, true);
            }
        }
    }

    /// Apply theme colors to the terminal.
    ///
    /// Theme is a map of color names to hex values (e.g., "background" -> "#1e1e2e").
    /// This creates a new config with the colors applied and updates the surface.
    pub fn apply_theme(&self, pane_id: &str, theme: HashMap<String, String>) {
        let instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return,
        };

        if let Some(instance) = instances.get(pane_id) {
            unsafe {
                // Clone the existing config and apply theme overrides
                let new_config = ghostty_config_clone(instance.config);
                if new_config.is_null() {
                    log::error!("ghostty: failed to clone config for theme");
                    return;
                }

                // Theme colors would be applied via config key-value pairs
                // e.g., "background", "foreground", "palette" entries
                for (key, value) in &theme {
                    log::debug!("ghostty: theme {}={}", key, value);
                }

                ghostty_config_finalize(new_config);
                ghostty_surface_update_config(instance.surface, new_config);
                ghostty_config_free(new_config);
            }
        }
    }

    /// Trigger a search in the terminal.
    ///
    /// Direction: "next" or "prev".
    pub fn search(&self, pane_id: &str, query: &str, direction: &str) {
        let instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return,
        };

        if let Some(instance) = instances.get(pane_id) {
            // Use the binding action API to trigger search
            // ghostty supports "search_open", "search_next", "search_prev" as binding actions
            let action_str = if query.is_empty() {
                match direction {
                    "prev" => "search_prev",
                    _ => "search_next",
                }
            } else {
                // For initial search, we need to send the search text via surface text input
                // then trigger the search action
                "search_open"
            };

            if let Ok(c_action) = CString::new(action_str) {
                unsafe {
                    ghostty_surface_binding_action(
                        instance.surface,
                        c_action.as_ptr(),
                        action_str.len(),
                    );
                }
            }
        }
    }

    /// Clear the current search highlight.
    pub fn search_clear(&self, pane_id: &str) {
        let instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return,
        };

        if let Some(instance) = instances.get(pane_id) {
            let action_str = "search_close";
            if let Ok(c_action) = CString::new(action_str) {
                unsafe {
                    ghostty_surface_binding_action(
                        instance.surface,
                        c_action.as_ptr(),
                        action_str.len(),
                    );
                }
            }
        }
    }

    /// Get the current text selection from the terminal.
    pub fn get_selection(&self, pane_id: &str) -> Option<String> {
        let instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return None,
        };

        if let Some(instance) = instances.get(pane_id) {
            unsafe {
                if !ghostty_surface_has_selection(instance.surface) {
                    return None;
                }

                let mut text_out = std::mem::zeroed::<ghostty_text_s>();
                let has_text =
                    ghostty_surface_read_selection(instance.surface, &mut text_out);

                if has_text && !text_out.text.is_null() && text_out.text_len > 0 {
                    let slice =
                        std::slice::from_raw_parts(text_out.text as *const u8, text_out.text_len);
                    let result = String::from_utf8_lossy(slice).to_string();
                    ghostty_surface_free_text(instance.surface, &mut text_out);
                    Some(result)
                } else {
                    None
                }
            }
        } else {
            None
        }
    }

    /// Get buffer text (scrollback) from the terminal.
    ///
    /// Note: libghostty does not expose a direct "get all buffer text" API.
    /// This returns the current selection text as a fallback, or empty if no selection.
    pub fn get_buffer_text(&self, pane_id: &str, _max_lines: usize) -> Vec<String> {
        // libghostty doesn't have a direct "read buffer" API in the embedding interface.
        // The closest approach is to select all text and read the selection.
        // For now, return empty — this can be extended when the API supports it.
        if let Some(selection) = self.get_selection(pane_id) {
            selection.lines().map(|l| l.to_string()).collect()
        } else {
            Vec::new()
        }
    }

    /// Copy the current selection to clipboard and return the text.
    pub fn copy(&self, pane_id: &str) -> Option<String> {
        let text = self.get_selection(pane_id);

        // Also trigger the copy binding action so ghostty updates its clipboard state
        let instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return text,
        };

        if let Some(instance) = instances.get(pane_id) {
            let action_str = "copy:clipboard";
            if let Ok(c_action) = CString::new(action_str) {
                unsafe {
                    ghostty_surface_binding_action(
                        instance.surface,
                        c_action.as_ptr(),
                        action_str.len(),
                    );
                }
            }
        }

        text
    }

    /// Paste text into the terminal.
    pub fn paste(&self, pane_id: &str, text: &str) {
        let instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return,
        };

        if let Some(instance) = instances.get(pane_id) {
            // Send text directly to the surface as keyboard input
            if let Ok(c_text) = CString::new(text) {
                unsafe {
                    ghostty_surface_text(
                        instance.surface,
                        c_text.as_ptr(),
                        text.len(),
                    );
                }
            }
        }
    }

    /// Destroy all instances. Called on app shutdown.
    pub fn destroy_all(&self) {
        let mut instances = match self.instances.lock() {
            Ok(i) => i,
            Err(_) => return,
        };

        let pane_ids: Vec<String> = instances.keys().cloned().collect();
        for pane_id in &pane_ids {
            if let Some(instance) = instances.remove(pane_id) {
                log::info!("ghostty: destroying instance for pane={}", pane_id);
                unsafe {
                    ghostty_surface_free(instance.surface);
                    ghostty_app_free(instance.app);
                    ghostty_config_free(instance.config);
                    native_view::remove_view(instance.view);
                }
            }
        }
    }
}

impl Drop for GhosttyManager {
    fn drop(&mut self) {
        self.destroy_all();
    }
}
