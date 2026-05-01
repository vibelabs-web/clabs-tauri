// Native NSView for ghostty: keyboard input + IME + Metal rendering
// Based on cmux's GhosttyNSView patterns

#![allow(clippy::not_unsafe_ptr_arg_deref)]

use std::ffi::c_void;
use std::sync::Once;

use objc2::msg_send;
use objc2::runtime::{AnyClass, AnyObject, Bool, ClassBuilder, Sel};
use objc2::sel;
use objc2_foundation::{NSPoint, NSRange, NSRect, NSSize};

use super::ffi::*;

// ── Global view→surface mapping (simpler than ivar in objc2 0.6) ──────

use std::collections::HashMap;
use std::sync::Mutex;

static VIEW_MAP: std::sync::LazyLock<Mutex<HashMap<usize, ViewState>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

struct ViewState {
    surface: usize, // ghostty_surface_t as usize
    marked_len: usize,
}

// ── Custom GhosttyView class with keyboard + IME ───────────────────────

static REGISTER_CLASS: Once = Once::new();
const CLS_NAME: &std::ffi::CStr = c"ClabsGhosttyView";

fn register_class() {
    REGISTER_CLASS.call_once(|| {
        let supercls = AnyClass::get(c"NSView").expect("NSView class");
        let mut builder = ClassBuilder::new(CLS_NAME, supercls)
            .expect("failed to create class");

        unsafe {
            // --- View properties ---
            builder.add_method(sel!(acceptsFirstResponder),
                ret_yes as unsafe extern "C" fn(*const AnyObject, Sel) -> Bool);
            builder.add_method(sel!(canBecomeKeyView),
                ret_yes as unsafe extern "C" fn(*const AnyObject, Sel) -> Bool);
            builder.add_method(sel!(wantsLayer),
                ret_yes as unsafe extern "C" fn(*const AnyObject, Sel) -> Bool);

            // --- Keyboard events ---
            builder.add_method(sel!(keyDown:),
                key_down as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject));
            builder.add_method(sel!(keyUp:),
                key_up as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject));
            builder.add_method(sel!(flagsChanged:),
                flags_changed as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject));

            // --- NSTextInputClient (for IME) ---
            builder.add_method(sel!(insertText:replacementRange:),
                insert_text as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject, NSRange));
            builder.add_method(sel!(setMarkedText:selectedRange:replacementRange:),
                set_marked_text as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject, NSRange, NSRange));
            builder.add_method(sel!(unmarkText),
                unmark_text as unsafe extern "C" fn(*mut AnyObject, Sel));
            builder.add_method(sel!(hasMarkedText),
                has_marked_text as unsafe extern "C" fn(*mut AnyObject, Sel) -> Bool);
            builder.add_method(sel!(validAttributesForMarkedText),
                valid_attrs as unsafe extern "C" fn(*mut AnyObject, Sel) -> *mut AnyObject);
        }

        builder.register();
        log::info!("ghostty: registered ClabsGhosttyView class");
    });
}

// ── Method implementations ─────────────────────────────────────────────

unsafe extern "C" fn ret_yes(_self: *const AnyObject, _sel: Sel) -> Bool { Bool::YES }

unsafe extern "C" fn key_down(self_: *mut AnyObject, _sel: Sel, event: *mut AnyObject) {
    let surface = get_surface(self_);
    if surface.is_null() { return; }

    let mods = mods_from_event(event);
    let has_ctrl_or_cmd = (mods & ghostty_input_mods_e_GHOSTTY_MODS_CTRL) != 0
        || (mods & ghostty_input_mods_e_GHOSTTY_MODS_SUPER) != 0;

    if has_ctrl_or_cmd && !has_marked_text_bool(self_) {
        // Control/Command keys: send directly to ghostty (keybindings)
        let key_code: u16 = msg_send![event, keyCode];
        let is_repeat: Bool = msg_send![event, isARepeat];
        let mut key_event: ghostty_input_key_s = std::mem::zeroed();
        key_event.action = if is_repeat.as_bool() {
            ghostty_input_action_e_GHOSTTY_ACTION_REPEAT
        } else {
            ghostty_input_action_e_GHOSTTY_ACTION_PRESS
        };
        key_event.keycode = key_code as u32;
        key_event.mods = mods;
        key_event.composing = false;
        let chars: *mut AnyObject = msg_send![event, characters];
        if !chars.is_null() {
            let cstr: *const i8 = msg_send![chars, UTF8String];
            if !cstr.is_null() { key_event.text = cstr; }
        }
        ghostty_surface_key(surface, key_event);
    } else {
        // Normal keys: use interpretKeyEvents for IME support
        // This calls insertText: or setMarkedText: on our view
        let events: *mut AnyObject = msg_send![
            AnyClass::get(c"NSArray").unwrap(),
            arrayWithObject: event
        ];
        let _: () = msg_send![self_, interpretKeyEvents: events];
    }
}

fn has_marked_text_bool(view: *mut AnyObject) -> bool {
    get_marked_len(view) > 0
}

unsafe extern "C" fn key_up(self_: *mut AnyObject, _sel: Sel, event: *mut AnyObject) {
    let surface = get_surface(self_);
    if surface.is_null() { return; }

    let key_code: u16 = msg_send![event, keyCode];
    let mods = mods_from_event(event);

    let mut key_event: ghostty_input_key_s = std::mem::zeroed();
    key_event.action = ghostty_input_action_e_GHOSTTY_ACTION_RELEASE;
    key_event.keycode = key_code as u32;
    key_event.mods = mods;
    key_event.text = std::ptr::null();
    key_event.composing = false;

    ghostty_surface_key(surface, key_event);
}

unsafe extern "C" fn flags_changed(self_: *mut AnyObject, _sel: Sel, event: *mut AnyObject) {
    let surface = get_surface(self_);
    if surface.is_null() { return; }

    let key_code: u16 = msg_send![event, keyCode];
    let mods = mods_from_event(event);

    let mut key_event: ghostty_input_key_s = std::mem::zeroed();
    key_event.action = ghostty_input_action_e_GHOSTTY_ACTION_PRESS;
    key_event.keycode = key_code as u32;
    key_event.mods = mods;
    key_event.text = std::ptr::null();
    key_event.composing = false;

    ghostty_surface_key(surface, key_event);
}

// --- NSTextInputClient methods ---

unsafe extern "C" fn insert_text(self_: *mut AnyObject, _sel: Sel, string: *mut AnyObject, _range: NSRange) {
    let surface = get_surface(self_);
    if surface.is_null() { return; }

    // Clear marked text
    set_marked_len(self_, 0);
    ghostty_surface_preedit(surface, std::ptr::null(), 0);

    // Get the string as UTF-8
    let cstr: *const i8 = msg_send![string, UTF8String];
    if !cstr.is_null() {
        let len = std::ffi::CStr::from_ptr(cstr).to_bytes().len();
        if len > 0 {
            ghostty_surface_text(surface, cstr, len);
        }
    }
}

unsafe extern "C" fn set_marked_text(self_: *mut AnyObject, _sel: Sel, string: *mut AnyObject, _selected: NSRange, _replacement: NSRange) {
    let surface = get_surface(self_);
    if surface.is_null() { return; }

    // Get length of marked text
    let len: usize = msg_send![string, length];
    set_marked_len(self_, len);

    if len > 0 {
        let cstr: *const i8 = msg_send![string, UTF8String];
        if !cstr.is_null() {
            let byte_len = std::ffi::CStr::from_ptr(cstr).to_bytes().len();
            ghostty_surface_preedit(surface, cstr, byte_len);
        }
    } else {
        ghostty_surface_preedit(surface, std::ptr::null(), 0);
    }
}

unsafe extern "C" fn unmark_text(self_: *mut AnyObject, _sel: Sel) {
    let surface = get_surface(self_);
    set_marked_len(self_, 0);
    if !surface.is_null() {
        ghostty_surface_preedit(surface, std::ptr::null(), 0);
    }
}

unsafe extern "C" fn has_marked_text(self_: *mut AnyObject, _sel: Sel) -> Bool {
    if get_marked_len(self_) > 0 { Bool::YES } else { Bool::NO }
}

unsafe extern "C" fn valid_attrs(_self: *mut AnyObject, _sel: Sel) -> *mut AnyObject {
    // Return empty NSArray
    let cls = AnyClass::get(c"NSArray").unwrap();
    msg_send![cls, array]
}

// ── Helpers ────────────────────────────────────────────────────────────

fn get_surface(view: *mut AnyObject) -> ghostty_surface_t {
    let key = view as usize;
    VIEW_MAP.lock().ok()
        .and_then(|m| m.get(&key).map(|s| s.surface as ghostty_surface_t))
        .unwrap_or(std::ptr::null_mut())
}

fn get_marked_len(view: *mut AnyObject) -> usize {
    let key = view as usize;
    VIEW_MAP.lock().ok()
        .and_then(|m| m.get(&key).map(|s| s.marked_len))
        .unwrap_or(0)
}

fn set_marked_len(view: *mut AnyObject, len: usize) {
    let key = view as usize;
    if let Ok(mut m) = VIEW_MAP.lock() {
        if let Some(s) = m.get_mut(&key) {
            s.marked_len = len;
        }
    }
}

unsafe fn mods_from_event(event: *mut AnyObject) -> ghostty_input_mods_e {
    let flags: u64 = msg_send![event, modifierFlags];
    let mut mods: u32 = 0;
    if flags & (1 << 17) != 0 { mods |= ghostty_input_mods_e_GHOSTTY_MODS_SHIFT; } // NSEventModifierFlagShift
    if flags & (1 << 18) != 0 { mods |= ghostty_input_mods_e_GHOSTTY_MODS_CTRL; }  // NSEventModifierFlagControl
    if flags & (1 << 19) != 0 { mods |= ghostty_input_mods_e_GHOSTTY_MODS_ALT; }   // NSEventModifierFlagOption
    if flags & (1 << 20) != 0 { mods |= ghostty_input_mods_e_GHOSTTY_MODS_SUPER; }  // NSEventModifierFlagCommand
    mods
}

pub fn set_surface_on_view(view: *mut c_void, surface: ghostty_surface_t, _app: ghostty_app_t) {
    let key = view as usize;
    if let Ok(mut m) = VIEW_MAP.lock() {
        m.insert(key, ViewState { surface: surface as usize, marked_len: 0 });
    }
}

// ── Tick: paced from background, executed on main queue ────────────────
//
// Earlier this called ghostty_app_tick directly from the background thread.
// That triggers `BUG IN CLIENT OF LIBDISPATCH: Block was expected to execute
// on queue [com.apple.main-thread]` because ghostty's Metal renderer asserts
// the main queue. Now the bg thread only paces (every 8ms) and dispatches
// the actual tick onto the main queue with back-pressure (TICK_PENDING)
// so a busy main queue can't build up a backlog.

use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

static TICK_APP: AtomicUsize = AtomicUsize::new(0);
static TICK_RUNNING: AtomicBool = AtomicBool::new(false);
static TICK_PENDING: AtomicBool = AtomicBool::new(false);

// dispatch_get_main_queue() is a C macro that expands to &_dispatch_main_q,
// so we reference the static symbol directly.
unsafe extern "C" {
    static _dispatch_main_q: c_void;
    fn dispatch_async_f(
        queue: *mut c_void,
        context: *mut c_void,
        work: extern "C" fn(*mut c_void),
    );
}

fn main_queue() -> *mut c_void {
    unsafe { &_dispatch_main_q as *const c_void as *mut c_void }
}

extern "C" fn run_tick_on_main(_ctx: *mut c_void) {
    TICK_PENDING.store(false, Ordering::SeqCst);
    if !TICK_RUNNING.load(Ordering::SeqCst) { return; }
    let app = TICK_APP.load(Ordering::SeqCst);
    if app != 0 {
        unsafe { ghostty_app_tick(app as ghostty_app_t); }
    }
}

pub unsafe fn start_main_thread_tick(app: ghostty_app_t) -> *mut c_void {
    TICK_APP.store(app as usize, Ordering::SeqCst);
    TICK_RUNNING.store(true, Ordering::SeqCst);

    std::thread::spawn(|| {
        while TICK_RUNNING.load(Ordering::SeqCst) {
            std::thread::sleep(std::time::Duration::from_millis(8));
            // Drop ticks if main queue hasn't drained the previous one yet.
            if TICK_PENDING.swap(true, Ordering::SeqCst) { continue; }
            unsafe {
                dispatch_async_f(
                    main_queue(),
                    std::ptr::null_mut(),
                    run_tick_on_main,
                );
            }
        }
    });

    log::info!("ghostty: tick pacer started (8ms → main queue)");
    std::ptr::null_mut()
}

pub unsafe fn stop_tick_timer(_timer: *mut c_void) {
    TICK_RUNNING.store(false, Ordering::SeqCst);
    TICK_APP.store(0, Ordering::SeqCst);
}

// ── NSView creation/management ─────────────────────────────────────────

pub unsafe fn create_ghostty_view(
    ns_window: *mut c_void, x: f64, y: f64, w: f64, h: f64,
) -> *mut c_void {
    register_class();
    let frame = NSRect::new(NSPoint::new(x, y), NSSize::new(w, h));

    let cls = AnyClass::get(CLS_NAME).expect("GhosttyView class");
    let view: *mut AnyObject = msg_send![cls, alloc];
    let view: *mut AnyObject = msg_send![view, initWithFrame: frame];
    if view.is_null() { return std::ptr::null_mut(); }

    // Enable layer-backing + CAMetalLayer
    let _: () = msg_send![view, setWantsLayer: Bool::YES];
    let metal_cls = AnyClass::get(c"CAMetalLayer").expect("CAMetalLayer");
    let layer: *mut AnyObject = msg_send![metal_cls, new];
    let pixel_fmt: u64 = 80; // MTLPixelFormatBGRA8Unorm
    let _: () = msg_send![layer, setPixelFormat: pixel_fmt];
    let _: () = msg_send![layer, setOpaque: Bool::NO]; // allow transparency
    let _: () = msg_send![view, setLayer: layer];

    // Start hidden — shown on first set_frame
    let _: () = msg_send![view, setHidden: Bool::YES];

    // Add to window's contentView
    let content: *mut AnyObject = msg_send![ns_window as *mut AnyObject, contentView];
    if !content.is_null() {
        let _: () = msg_send![content, addSubview: view];
    }

    view as *mut c_void
}

pub unsafe fn set_view_frame(
    view: *mut c_void, ns_window: *mut c_void,
    x: f64, y: f64, w: f64, h: f64,
) {
    let content: *mut AnyObject = msg_send![ns_window as *mut AnyObject, contentView];
    let content_frame: NSRect = msg_send![content, frame];
    let flipped_y = content_frame.size.height - y - h;
    let frame = NSRect::new(NSPoint::new(x, flipped_y), NSSize::new(w, h));
    let _: () = msg_send![view as *mut AnyObject, setFrame: frame];
    // Show on first frame
    let _: () = msg_send![view as *mut AnyObject, setHidden: Bool::NO];
}

pub unsafe fn set_view_visible(view: *mut c_void, visible: bool) {
    let hidden = if visible { Bool::NO } else { Bool::YES };
    let _: () = msg_send![view as *mut AnyObject, setHidden: hidden];
}

pub unsafe fn set_view_focus(view: *mut c_void, ns_window: *mut c_void) {
    let _: Bool = msg_send![ns_window as *mut AnyObject, makeFirstResponder: view as *mut AnyObject];
}

pub unsafe fn remove_view(view: *mut c_void) {
    let _: () = msg_send![view as *mut AnyObject, removeFromSuperview];
    let _: () = msg_send![view as *mut AnyObject, release];
}

pub fn assert_main_thread() {
    // ghostty operations run via window.run_on_main_thread (fire-and-forget)
}
