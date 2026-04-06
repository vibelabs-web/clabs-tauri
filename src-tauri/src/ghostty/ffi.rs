// @TASK P1-FFI - Ghostty FFI bindings for full libghostty embedding API
// @SPEC docs/spike-phase1-ghosttykit.md
//
// Hand-written Rust FFI bindings derived from ghostty.h (ghostty 1.3.2-dev).
// These map to the C embedding API that the macOS Ghostty app uses internally.
//
// SAFETY: All extern functions are unsafe by nature. Callers must ensure:
// - Pointers are valid and non-null (where required)
// - Correct lifetime management (free after new)
// - Thread safety (ghostty is generally single-threaded per surface)

#![allow(non_camel_case_types, dead_code)]

use std::os::raw::{c_char, c_int, c_void};

// ===================================================================
// Opaque types
// ===================================================================

/// Opaque handle to the ghostty application instance.
pub type ghostty_app_t = *mut c_void;

/// Opaque handle to a ghostty configuration.
pub type ghostty_config_t = *mut c_void;

/// Opaque handle to a ghostty terminal surface.
pub type ghostty_surface_t = *mut c_void;

/// Opaque handle to a ghostty inspector.
pub type ghostty_inspector_t = *mut c_void;

// ===================================================================
// Enums
// ===================================================================

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_platform_e {
    GHOSTTY_PLATFORM_INVALID = 0,
    GHOSTTY_PLATFORM_MACOS = 1,
    GHOSTTY_PLATFORM_IOS = 2,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_clipboard_e {
    GHOSTTY_CLIPBOARD_STANDARD = 0,
    GHOSTTY_CLIPBOARD_SELECTION = 1,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_clipboard_request_e {
    GHOSTTY_CLIPBOARD_REQUEST_PASTE = 0,
    GHOSTTY_CLIPBOARD_REQUEST_OSC_52_READ = 1,
    GHOSTTY_CLIPBOARD_REQUEST_OSC_52_WRITE = 2,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_input_mouse_state_e {
    GHOSTTY_MOUSE_RELEASE = 0,
    GHOSTTY_MOUSE_PRESS = 1,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_input_mouse_button_e {
    GHOSTTY_MOUSE_UNKNOWN = 0,
    GHOSTTY_MOUSE_LEFT = 1,
    GHOSTTY_MOUSE_RIGHT = 2,
    GHOSTTY_MOUSE_MIDDLE = 3,
    GHOSTTY_MOUSE_FOUR = 4,
    GHOSTTY_MOUSE_FIVE = 5,
    GHOSTTY_MOUSE_SIX = 6,
    GHOSTTY_MOUSE_SEVEN = 7,
    GHOSTTY_MOUSE_EIGHT = 8,
    GHOSTTY_MOUSE_NINE = 9,
    GHOSTTY_MOUSE_TEN = 10,
    GHOSTTY_MOUSE_ELEVEN = 11,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_input_mouse_momentum_e {
    GHOSTTY_MOUSE_MOMENTUM_NONE = 0,
    GHOSTTY_MOUSE_MOMENTUM_BEGAN = 1,
    GHOSTTY_MOUSE_MOMENTUM_STATIONARY = 2,
    GHOSTTY_MOUSE_MOMENTUM_CHANGED = 3,
    GHOSTTY_MOUSE_MOMENTUM_ENDED = 4,
    GHOSTTY_MOUSE_MOMENTUM_CANCELLED = 5,
    GHOSTTY_MOUSE_MOMENTUM_MAY_BEGIN = 6,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_color_scheme_e {
    GHOSTTY_COLOR_SCHEME_LIGHT = 0,
    GHOSTTY_COLOR_SCHEME_DARK = 1,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_input_action_e {
    GHOSTTY_ACTION_RELEASE = 0,
    GHOSTTY_ACTION_PRESS = 1,
    GHOSTTY_ACTION_REPEAT = 2,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_build_mode_e {
    GHOSTTY_BUILD_MODE_DEBUG = 0,
    GHOSTTY_BUILD_MODE_RELEASE_SAFE = 1,
    GHOSTTY_BUILD_MODE_RELEASE_FAST = 2,
    GHOSTTY_BUILD_MODE_RELEASE_SMALL = 3,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_surface_context_e {
    GHOSTTY_SURFACE_CONTEXT_WINDOW = 0,
    GHOSTTY_SURFACE_CONTEXT_TAB = 1,
    GHOSTTY_SURFACE_CONTEXT_SPLIT = 2,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_action_split_direction_e {
    GHOSTTY_SPLIT_DIRECTION_RIGHT = 0,
    GHOSTTY_SPLIT_DIRECTION_DOWN = 1,
    GHOSTTY_SPLIT_DIRECTION_LEFT = 2,
    GHOSTTY_SPLIT_DIRECTION_UP = 3,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_action_goto_split_e {
    GHOSTTY_GOTO_SPLIT_PREVIOUS = 0,
    GHOSTTY_GOTO_SPLIT_NEXT = 1,
    GHOSTTY_GOTO_SPLIT_UP = 2,
    GHOSTTY_GOTO_SPLIT_LEFT = 3,
    GHOSTTY_GOTO_SPLIT_DOWN = 4,
    GHOSTTY_GOTO_SPLIT_RIGHT = 5,
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_target_tag_e {
    GHOSTTY_TARGET_APP = 0,
    GHOSTTY_TARGET_SURFACE = 1,
}

// Modifier keys bitmask
pub type ghostty_input_mods_e = u32;
pub const GHOSTTY_MODS_NONE: ghostty_input_mods_e = 0;
pub const GHOSTTY_MODS_SHIFT: ghostty_input_mods_e = 1 << 0;
pub const GHOSTTY_MODS_CTRL: ghostty_input_mods_e = 1 << 1;
pub const GHOSTTY_MODS_ALT: ghostty_input_mods_e = 1 << 2;
pub const GHOSTTY_MODS_SUPER: ghostty_input_mods_e = 1 << 3;

// Scroll mods (packed struct from C)
pub type ghostty_input_scroll_mods_t = c_int;

// ===================================================================
// Structs
// ===================================================================

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct ghostty_info_s {
    pub build_mode: ghostty_build_mode_e,
    pub version: *const c_char,
    pub version_len: usize,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct ghostty_string_s {
    pub ptr: *const c_char,
    pub len: usize,
    pub sentinel: bool,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct ghostty_text_s {
    pub tl_px_x: f64,
    pub tl_px_y: f64,
    pub offset_start: u32,
    pub offset_len: u32,
    pub text: *const c_char,
    pub text_len: usize,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct ghostty_input_key_s {
    pub action: ghostty_input_action_e,
    pub mods: ghostty_input_mods_e,
    pub consumed_mods: ghostty_input_mods_e,
    pub keycode: u32,
    pub text: *const c_char,
    pub unshifted_codepoint: u32,
    pub composing: bool,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct ghostty_clipboard_content_s {
    pub mime: *const c_char,
    pub data: *const c_char,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct ghostty_env_var_s {
    pub key: *const c_char,
    pub value: *const c_char,
}

#[repr(C)]
pub struct ghostty_platform_macos_s {
    pub nsview: *mut c_void,
}

#[repr(C)]
pub struct ghostty_platform_ios_s {
    pub uiview: *mut c_void,
}

#[repr(C)]
pub union ghostty_platform_u {
    pub macos: std::mem::ManuallyDrop<ghostty_platform_macos_s>,
    pub ios: std::mem::ManuallyDrop<ghostty_platform_ios_s>,
}

#[repr(C)]
pub struct ghostty_surface_config_s {
    pub platform_tag: ghostty_platform_e,
    pub platform: ghostty_platform_u,
    pub userdata: *mut c_void,
    pub scale_factor: f64,
    pub font_size: f32,
    pub working_directory: *const c_char,
    pub command: *const c_char,
    pub env_vars: *mut ghostty_env_var_s,
    pub env_var_count: usize,
    pub initial_input: *const c_char,
    pub wait_after_command: bool,
    pub context: ghostty_surface_context_e,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct ghostty_surface_size_s {
    pub columns: u16,
    pub rows: u16,
    pub width_px: u32,
    pub height_px: u32,
    pub cell_width_px: u32,
    pub cell_height_px: u32,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct ghostty_diagnostic_s {
    pub message: *const c_char,
}

// ===================================================================
// Target types (for action dispatching)
// ===================================================================

#[repr(C)]
pub union ghostty_target_u {
    pub surface: ghostty_surface_t,
}

#[repr(C)]
pub struct ghostty_target_s {
    pub tag: ghostty_target_tag_e,
    pub target: ghostty_target_u,
}

// ===================================================================
// Action types
// ===================================================================

// Note: ghostty_action_tag_e and ghostty_action_s are large enum/union types.
// We define only the tag enum here; the full action union can be
// extended as needed for runtime dispatch.

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ghostty_action_tag_e {
    GHOSTTY_ACTION_QUIT = 0,
    GHOSTTY_ACTION_NEW_WINDOW = 1,
    GHOSTTY_ACTION_NEW_TAB = 2,
    GHOSTTY_ACTION_CLOSE_TAB = 3,
    GHOSTTY_ACTION_NEW_SPLIT = 4,
    GHOSTTY_ACTION_CLOSE_ALL_WINDOWS = 5,
    GHOSTTY_ACTION_TOGGLE_MAXIMIZE = 6,
    GHOSTTY_ACTION_TOGGLE_FULLSCREEN = 7,
    GHOSTTY_ACTION_TOGGLE_TAB_OVERVIEW = 8,
    GHOSTTY_ACTION_TOGGLE_WINDOW_DECORATIONS = 9,
    GHOSTTY_ACTION_TOGGLE_QUICK_TERMINAL = 10,
    GHOSTTY_ACTION_TOGGLE_COMMAND_PALETTE = 11,
    GHOSTTY_ACTION_TOGGLE_VISIBILITY = 12,
    GHOSTTY_ACTION_TOGGLE_BACKGROUND_OPACITY = 13,
    GHOSTTY_ACTION_MOVE_TAB = 14,
    GHOSTTY_ACTION_GOTO_TAB = 15,
    GHOSTTY_ACTION_GOTO_SPLIT = 16,
    GHOSTTY_ACTION_GOTO_WINDOW = 17,
    GHOSTTY_ACTION_RESIZE_SPLIT = 18,
    GHOSTTY_ACTION_EQUALIZE_SPLITS = 19,
    GHOSTTY_ACTION_TOGGLE_SPLIT_ZOOM = 20,
    GHOSTTY_ACTION_PRESENT_TERMINAL = 21,
    GHOSTTY_ACTION_SIZE_LIMIT = 22,
    GHOSTTY_ACTION_RESET_WINDOW_SIZE = 23,
    GHOSTTY_ACTION_INITIAL_SIZE = 24,
    GHOSTTY_ACTION_CELL_SIZE = 25,
    GHOSTTY_ACTION_SCROLLBAR = 26,
    GHOSTTY_ACTION_RENDER = 27,
    GHOSTTY_ACTION_INSPECTOR = 28,
}

/// Opaque action union - we treat it as raw bytes matching the C union size.
/// Individual action payloads can be constructed via helpers as needed.
#[repr(C)]
pub struct ghostty_action_s {
    pub tag: ghostty_action_tag_e,
    // The union is large; we use a byte array sized to the largest variant.
    // In practice, callers construct these via C helper functions.
    pub _action_data: [u8; 32],
}

// ===================================================================
// Runtime callback types
// ===================================================================

pub type ghostty_runtime_wakeup_cb =
    Option<unsafe extern "C" fn(userdata: *mut c_void)>;

pub type ghostty_runtime_action_cb = Option<
    unsafe extern "C" fn(
        app: ghostty_app_t,
        target: ghostty_target_s,
        action: ghostty_action_s,
    ) -> bool,
>;

pub type ghostty_runtime_read_clipboard_cb = Option<
    unsafe extern "C" fn(
        userdata: *mut c_void,
        clipboard: ghostty_clipboard_e,
        state: *mut c_void,
    ) -> bool,
>;

pub type ghostty_runtime_confirm_read_clipboard_cb = Option<
    unsafe extern "C" fn(
        userdata: *mut c_void,
        content: *const c_char,
        state: *mut c_void,
        request: ghostty_clipboard_request_e,
    ),
>;

pub type ghostty_runtime_write_clipboard_cb = Option<
    unsafe extern "C" fn(
        userdata: *mut c_void,
        clipboard: ghostty_clipboard_e,
        content: *const ghostty_clipboard_content_s,
        count: usize,
        confirm: bool,
    ),
>;

pub type ghostty_runtime_close_surface_cb =
    Option<unsafe extern "C" fn(userdata: *mut c_void, process_alive: bool)>;

#[repr(C)]
pub struct ghostty_runtime_config_s {
    pub userdata: *mut c_void,
    pub supports_selection_clipboard: bool,
    pub wakeup_cb: ghostty_runtime_wakeup_cb,
    pub action_cb: ghostty_runtime_action_cb,
    pub read_clipboard_cb: ghostty_runtime_read_clipboard_cb,
    pub confirm_read_clipboard_cb: ghostty_runtime_confirm_read_clipboard_cb,
    pub write_clipboard_cb: ghostty_runtime_write_clipboard_cb,
    pub close_surface_cb: ghostty_runtime_close_surface_cb,
}

// ===================================================================
// Extern "C" API functions
// ===================================================================

extern "C" {
    // --- Initialization ---
    pub fn ghostty_init(argc: usize, argv: *mut *mut c_char) -> c_int;
    pub fn ghostty_cli_try_action();
    pub fn ghostty_info() -> ghostty_info_s;
    pub fn ghostty_translate(key: *const c_char) -> *const c_char;
    pub fn ghostty_string_free(s: ghostty_string_s);

    // --- Config ---
    pub fn ghostty_config_new() -> ghostty_config_t;
    pub fn ghostty_config_free(config: ghostty_config_t);
    pub fn ghostty_config_clone(config: ghostty_config_t) -> ghostty_config_t;
    pub fn ghostty_config_load_cli_args(config: ghostty_config_t);
    pub fn ghostty_config_load_file(config: ghostty_config_t, path: *const c_char);
    pub fn ghostty_config_load_default_files(config: ghostty_config_t);
    pub fn ghostty_config_load_recursive_files(config: ghostty_config_t);
    pub fn ghostty_config_finalize(config: ghostty_config_t);
    pub fn ghostty_config_get(
        config: ghostty_config_t,
        out: *mut c_void,
        key: *const c_char,
        key_len: usize,
    ) -> bool;
    pub fn ghostty_config_diagnostics_count(config: ghostty_config_t) -> u32;
    pub fn ghostty_config_get_diagnostic(
        config: ghostty_config_t,
        index: u32,
    ) -> ghostty_diagnostic_s;
    pub fn ghostty_config_open_path() -> ghostty_string_s;

    // --- App ---
    pub fn ghostty_app_new(
        runtime: *const ghostty_runtime_config_s,
        config: ghostty_config_t,
    ) -> ghostty_app_t;
    pub fn ghostty_app_free(app: ghostty_app_t);
    pub fn ghostty_app_tick(app: ghostty_app_t);
    pub fn ghostty_app_userdata(app: ghostty_app_t) -> *mut c_void;
    pub fn ghostty_app_set_focus(app: ghostty_app_t, focused: bool);
    pub fn ghostty_app_key(app: ghostty_app_t, event: ghostty_input_key_s) -> bool;
    pub fn ghostty_app_key_is_binding(
        app: ghostty_app_t,
        event: ghostty_input_key_s,
    ) -> bool;
    pub fn ghostty_app_keyboard_changed(app: ghostty_app_t);
    pub fn ghostty_app_open_config(app: ghostty_app_t);
    pub fn ghostty_app_update_config(app: ghostty_app_t, config: ghostty_config_t);
    pub fn ghostty_app_needs_confirm_quit(app: ghostty_app_t) -> bool;
    pub fn ghostty_app_has_global_keybinds(app: ghostty_app_t) -> bool;
    pub fn ghostty_app_set_color_scheme(
        app: ghostty_app_t,
        scheme: ghostty_color_scheme_e,
    );

    // --- Surface Config ---
    pub fn ghostty_surface_config_new() -> ghostty_surface_config_s;

    // --- Surface ---
    pub fn ghostty_surface_new(
        app: ghostty_app_t,
        config: *const ghostty_surface_config_s,
    ) -> ghostty_surface_t;
    pub fn ghostty_surface_free(surface: ghostty_surface_t);
    pub fn ghostty_surface_userdata(surface: ghostty_surface_t) -> *mut c_void;
    pub fn ghostty_surface_app(surface: ghostty_surface_t) -> ghostty_app_t;
    pub fn ghostty_surface_inherited_config(
        surface: ghostty_surface_t,
        context: ghostty_surface_context_e,
    ) -> ghostty_surface_config_s;
    pub fn ghostty_surface_update_config(
        surface: ghostty_surface_t,
        config: ghostty_config_t,
    );
    pub fn ghostty_surface_needs_confirm_quit(surface: ghostty_surface_t) -> bool;
    pub fn ghostty_surface_process_exited(surface: ghostty_surface_t) -> bool;
    pub fn ghostty_surface_refresh(surface: ghostty_surface_t);
    pub fn ghostty_surface_draw(surface: ghostty_surface_t);
    pub fn ghostty_surface_set_content_scale(
        surface: ghostty_surface_t,
        x: f64,
        y: f64,
    );
    pub fn ghostty_surface_set_focus(surface: ghostty_surface_t, focused: bool);
    pub fn ghostty_surface_set_occlusion(surface: ghostty_surface_t, occluded: bool);
    pub fn ghostty_surface_set_size(surface: ghostty_surface_t, width: u32, height: u32);
    pub fn ghostty_surface_size(surface: ghostty_surface_t) -> ghostty_surface_size_s;
    pub fn ghostty_surface_set_color_scheme(
        surface: ghostty_surface_t,
        scheme: ghostty_color_scheme_e,
    );
    pub fn ghostty_surface_key_translation_mods(
        surface: ghostty_surface_t,
        mods: ghostty_input_mods_e,
    ) -> ghostty_input_mods_e;
    pub fn ghostty_surface_key(
        surface: ghostty_surface_t,
        event: ghostty_input_key_s,
    ) -> bool;
    pub fn ghostty_surface_key_is_binding(
        surface: ghostty_surface_t,
        event: ghostty_input_key_s,
    ) -> bool;

    // --- Surface Text/IME ---
    pub fn ghostty_surface_text(
        surface: ghostty_surface_t,
        text: *const c_char,
        len: usize,
    );
    pub fn ghostty_surface_preedit(
        surface: ghostty_surface_t,
        text: *const c_char,
        len: usize,
    );

    // --- Surface Mouse ---
    pub fn ghostty_surface_mouse_captured(surface: ghostty_surface_t) -> bool;
    pub fn ghostty_surface_mouse_button(
        surface: ghostty_surface_t,
        button: ghostty_input_mouse_button_e,
        state: ghostty_input_mouse_state_e,
        mods: ghostty_input_mods_e,
    ) -> bool;
    pub fn ghostty_surface_mouse_pos(
        surface: ghostty_surface_t,
        x: f64,
        y: f64,
        mods: ghostty_input_mods_e,
    );
    pub fn ghostty_surface_mouse_scroll(
        surface: ghostty_surface_t,
        x: f64,
        y: f64,
        scroll_mods: ghostty_input_scroll_mods_t,
    );
    pub fn ghostty_surface_mouse_pressure(
        surface: ghostty_surface_t,
        stage: u32,
        pressure: f64,
    );

    // --- Surface IME ---
    pub fn ghostty_surface_ime_point(
        surface: ghostty_surface_t,
        x: *mut f64,
        y: *mut f64,
        w: *mut f64,
        h: *mut f64,
    );

    // --- Surface Lifecycle ---
    pub fn ghostty_surface_request_close(surface: ghostty_surface_t);
    pub fn ghostty_surface_split(
        surface: ghostty_surface_t,
        direction: ghostty_action_split_direction_e,
    );
    pub fn ghostty_surface_split_focus(
        surface: ghostty_surface_t,
        direction: ghostty_action_goto_split_e,
    );
    pub fn ghostty_surface_split_equalize(surface: ghostty_surface_t);

    // --- Surface Actions ---
    pub fn ghostty_surface_binding_action(
        surface: ghostty_surface_t,
        action: *const c_char,
        len: usize,
    ) -> bool;
    pub fn ghostty_surface_complete_clipboard_request(
        surface: ghostty_surface_t,
        content: *const ghostty_clipboard_content_s,
        count: usize,
        confirmed: bool,
    );

    // --- Surface Selection/Text ---
    pub fn ghostty_surface_has_selection(surface: ghostty_surface_t) -> bool;
    pub fn ghostty_surface_read_selection(
        surface: ghostty_surface_t,
        out: *mut ghostty_text_s,
    ) -> bool;
    pub fn ghostty_surface_free_text(
        surface: ghostty_surface_t,
        text: *mut ghostty_text_s,
    );

    // --- Surface Display ---
    pub fn ghostty_surface_set_display_id(surface: ghostty_surface_t, display_id: u32);
    pub fn ghostty_surface_quicklook_font(surface: ghostty_surface_t) -> *mut c_void;

    // --- Inspector ---
    pub fn ghostty_surface_inspector(surface: ghostty_surface_t) -> ghostty_inspector_t;
    pub fn ghostty_inspector_free(surface: ghostty_surface_t);
    pub fn ghostty_inspector_set_focus(inspector: ghostty_inspector_t, focused: bool);
    pub fn ghostty_inspector_set_content_scale(
        inspector: ghostty_inspector_t,
        x: f64,
        y: f64,
    );
    pub fn ghostty_inspector_set_size(
        inspector: ghostty_inspector_t,
        width: u32,
        height: u32,
    );

    // --- macOS specific ---
    pub fn ghostty_set_window_background_blur(app: ghostty_app_t, window: *mut c_void);

    // --- Benchmark ---
    pub fn ghostty_benchmark_cli(
        action: *const c_char,
        config: *const c_char,
    ) -> bool;
}

// ===================================================================
// Constants
// ===================================================================

pub const GHOSTTY_SUCCESS: c_int = 0;
