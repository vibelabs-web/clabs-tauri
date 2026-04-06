// @TASK P2-NATIVE-VIEW - NSView management for ghostty surfaces (objc2 0.6)
// @SPEC docs/spike-phase2-ghostty-manager.md
//
// Creates and manages NSView instances backed by CAMetalLayer for ghostty rendering.
// All functions operate on raw pointers for FFI compatibility with GhosttyManager.

#![allow(clippy::not_unsafe_ptr_arg_deref)]

use std::ffi::c_void;

use objc2::msg_send;
use objc2::rc::Retained;
use objc2::runtime::Bool;
use objc2::MainThreadOnly;
use objc2_app_kit::{NSView, NSWindow};
use objc2_foundation::{MainThreadMarker, NSPoint, NSRect, NSSize};

/// Create a new NSView with a CAMetalLayer, add it to the window's contentView.
///
/// Returns a raw pointer to the retained NSView (caller owns the +1 retain).
///
/// # Safety
/// `ns_window` must be a valid pointer to an NSWindow.
pub unsafe fn create_ghostty_view(
    ns_window: *mut c_void,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
) -> *mut c_void {
    let frame = NSRect::new(NSPoint::new(x, y), NSSize::new(w, h));

    // Create NSView — we need MainThreadMarker for alloc() on MainThreadOnly types
    let mtm = MainThreadMarker::new().expect("must be called from main thread");
    let view: Retained<NSView> = NSView::initWithFrame(NSView::alloc(mtm), frame);

    // Enable layer-backing (required for Metal rendering)
    view.setWantsLayer(true);

    // Set up CAMetalLayer as the backing layer
    unsafe {
        let metal_layer_class: *const objc2::runtime::AnyClass =
            objc2::runtime::AnyClass::get(c"CAMetalLayer")
                .expect("CAMetalLayer class not found");
        let metal_layer: Retained<objc2::runtime::AnyObject> =
            msg_send![metal_layer_class, new];

        // Set the layer on the view
        let _: () = msg_send![&view, setLayer: &*metal_layer];
    }

    // Add to window's contentView
    let window = ns_window as *mut NSWindow;
    unsafe {
        if let Some(content_view) = (*window).contentView() {
            content_view.addSubview(&view);
        }
    }

    // Return raw pointer; Retained::into_raw gives us +1 retain count
    Retained::into_raw(view) as *mut c_void
}

/// Set the frame (position and size) of an NSView.
///
/// Applies Y-axis flip: macOS uses bottom-left origin, but our coordinates
/// come from the web layer using top-left origin.
///
/// # Safety
/// `view` must be a valid NSView pointer. `ns_window` must be a valid NSWindow pointer.
pub unsafe fn set_view_frame(
    view: *mut c_void,
    ns_window: *mut c_void,
    x: f64,
    y: f64,
    w: f64,
    h: f64,
) {
    let view = view as *mut NSView;
    let window = ns_window as *mut NSWindow;

    // Get the window content view height for Y-axis flip
    let content_height = unsafe {
        if let Some(content_view) = (*window).contentView() {
            content_view.frame().size.height
        } else {
            0.0
        }
    };

    // Flip Y: convert from top-left origin to bottom-left origin
    let flipped_y = content_height - y - h;

    let frame = NSRect::new(NSPoint::new(x, flipped_y), NSSize::new(w, h));
    unsafe {
        (*view).setFrame(frame);
    }
}

/// Set the visibility of an NSView.
///
/// # Safety
/// `view` must be a valid NSView pointer.
pub unsafe fn set_view_visible(view: *mut c_void, visible: bool) {
    let view = view as *mut NSView;
    unsafe {
        (*view).setHidden(!visible);
    }
}

/// Make the NSView the first responder (focus).
///
/// # Safety
/// `view` must be a valid NSView pointer. `ns_window` must be a valid NSWindow pointer.
pub unsafe fn set_view_focus(view: *mut c_void, ns_window: *mut c_void) {
    let view = view as *mut NSView;
    let window = ns_window as *mut NSWindow;
    unsafe {
        let _: Bool = msg_send![&*window, makeFirstResponder: &*view];
    }
}

/// Remove the NSView from its superview and release.
///
/// # Safety
/// `view` must be a valid NSView pointer previously returned by `create_ghostty_view`.
pub unsafe fn remove_view(view: *mut c_void) {
    let view = view as *mut NSView;
    unsafe {
        (*view).removeFromSuperview();
        // Reconstruct the Retained to drop it (release the +1 from create)
        let _ = Retained::from_raw(view);
    }
}

/// Check if we're on the main thread. If not, log a warning.
/// Ghostty and AppKit operations must happen on the main thread.
pub fn assert_main_thread() {
    if let Some(_mtm) = MainThreadMarker::new() {
        // OK - we're on the main thread
    } else {
        log::warn!("ghostty native_view operation called from non-main thread!");
    }
}
