// alacritty_terminal 전용 NSView 서브클래스 (ClabsAlacView).
//
// 책임:
//   - drawRect: → AlacManager.with_term()으로 grid lock 후 셀 단위 렌더
//   - keyDown:  → 일반 입력은 interpretKeyEvents:로 NSTextInputClient 경로 (한글 IME)
//                Cmd/Ctrl 조합은 직접 키 시퀀스로 변환해 PTY 송신
//   - NSTextInputClient (insertText/setMarkedText/unmarkText/hasMarkedText 등)
//   - 30Hz NSTimer로 proxy.dirty 감시 → setNeedsDisplay:YES
//
// 렌더 전략 (1차):
//   - NSFont monospacedSystemFontOfSize: + NSAttributedString.drawAtPoint
//   - 셀별 fg/bg/bold/italic/inverse 적용
//   - Cursor: 블록 사각형 fill
// 추후 CTLine batch 렌더로 최적화 가능.

#![allow(clippy::not_unsafe_ptr_arg_deref)]

use std::collections::HashMap;
use std::ffi::{c_void, CStr};
use std::sync::atomic::Ordering;
use std::sync::{Arc, Mutex, Once, OnceLock};

use objc2::msg_send;
use objc2::rc::Retained;
use objc2::runtime::{AnyClass, AnyObject, AnyProtocol, Bool, ClassBuilder, Sel};
use objc2::sel;
use objc2_foundation::{NSPoint, NSRange, NSRect, NSSize, NSString};

use alacritty_terminal::event::WindowSize;
use alacritty_terminal::grid::Dimensions as GridDims;
use alacritty_terminal::index::Point;
use alacritty_terminal::term::cell::Flags as CellFlags;
use alacritty_terminal::vte::ansi::{Color as AnsiColor, NamedColor};

use super::manager::AlacManager;

// ────────────────────────────────────────────────────────────────────────
// 전역 상태
// ────────────────────────────────────────────────────────────────────────

static MANAGER: OnceLock<Arc<AlacManager>> = OnceLock::new();

pub fn set_manager(mgr: Arc<AlacManager>) {
    let _ = MANAGER.set(mgr);
}

fn manager() -> Option<&'static Arc<AlacManager>> {
    MANAGER.get()
}

/// React 측 모달이 떠있는 동안 모든 NSView를 강제로 hidden으로 유지.
/// 어떤 경로(IntersectionObserver, set_frame, set_visible 등)로 visible 요청이 와도 무시.
static MODAL_OPEN: std::sync::atomic::AtomicBool = std::sync::atomic::AtomicBool::new(false);

pub fn set_modal_open(open: bool) {
    use std::sync::atomic::Ordering;
    MODAL_OPEN.store(open, Ordering::Release);
    log::info!("alac: modal_open = {}", open);
    // 모달이 열렸으면 모든 view를 hide.
    if open {
        if let Ok(m) = PANE_VIEW.lock() {
            for (_, &p) in m.iter() {
                let view = p as *mut AnyObject;
                unsafe {
                    let _: () = msg_send![view, setHidden: Bool::YES];
                }
            }
        }
    }
}

/// 입력이 들어온 paneId의 view 상태 디버깅 + 강제 visible.
/// 사용자 입력이 들어왔다는 건 그 view가 화면에 보여야 한다는 뜻.
pub fn nudge_visible(pane_id: &str) {
    if is_modal_open() {
        return;
    }
    let view_ptr = match PANE_VIEW.lock().ok().and_then(|m| m.get(pane_id).copied()) {
        Some(p) => p,
        None => return,
    };
    let view = view_ptr as *mut AnyObject;
    unsafe {
        let was_hidden: Bool = msg_send![view, isHidden];
        let frame: NSRect = msg_send![view, frame];
        log::info!(
            "alac::nudge_visible pane={} hidden={} frame=({},{}) {}x{}",
            pane_id,
            was_hidden.as_bool(),
            frame.origin.x,
            frame.origin.y,
            frame.size.width,
            frame.size.height
        );
        if was_hidden.as_bool() {
            let _: () = msg_send![view, setHidden: Bool::NO];
        }
        let _: () = msg_send![view, setNeedsDisplay: Bool::YES];
    }
}

fn is_modal_open() -> bool {
    MODAL_OPEN.load(std::sync::atomic::Ordering::Acquire)
}

struct ViewState {
    pane_id: String,
    cell_w: f64,
    cell_h: f64,
    font_size: f64,
    /// 컬럼 수 / 라인 수 — 마지막 resize에서 계산된 값.
    cols: u16,
    rows: u16,
    /// IME 마킹 중인 텍스트 (조합 중 자모/한글). 화면 커서 위치에 표시.
    marked_text: String,
    /// NSTextInputContext 캐시 (포인터로 보관 — Send 불가 타입 회피).
    ime_ctx: usize,
    /// 커서 깜박임 페이즈 (0 = ON, 1 = OFF). tick에서 갱신.
    blink_phase: u8,
}

const CURSOR_BLINK_MS: u128 = 530;

fn now_ms() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

fn current_blink_phase() -> u8 {
    ((now_ms() / CURSOR_BLINK_MS) % 2) as u8
}

static VIEW_MAP: std::sync::LazyLock<Mutex<HashMap<usize, ViewState>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

// pane_id → NSView ptr (외부에서 set_frame/destroy 시 룩업)
static PANE_VIEW: std::sync::LazyLock<Mutex<HashMap<String, usize>>> =
    std::sync::LazyLock::new(|| Mutex::new(HashMap::new()));

// ────────────────────────────────────────────────────────────────────────
// 클래스 등록
// ────────────────────────────────────────────────────────────────────────

static REGISTER_CLASS: Once = Once::new();
const CLS_NAME: &CStr = c"ClabsAlacView";

fn register_class() {
    REGISTER_CLASS.call_once(|| {
        let supercls = AnyClass::get(c"NSView").expect("NSView class");
        let mut builder = ClassBuilder::new(CLS_NAME, supercls).expect("ClassBuilder failed");

        // NSTextInputClient 프로토콜 정식 등록 — IME가 우리 입력 메서드들을 부르려면 필수.
        if let Some(proto) = AnyProtocol::get(c"NSTextInputClient") {
            let added = builder.add_protocol(proto);
            log::info!("alac: add_protocol(NSTextInputClient) = {}", added);
        } else {
            log::warn!("alac: NSTextInputClient protocol not found at runtime");
        }

        unsafe {
            // First responder / layer
            builder.add_method(
                sel!(acceptsFirstResponder),
                ret_yes as unsafe extern "C" fn(*const AnyObject, Sel) -> Bool,
            );
            // 비활성 창에서도 첫 클릭으로 firstResponder가 되도록.
            builder.add_method(
                sel!(acceptsFirstMouse:),
                accepts_first_mouse as unsafe extern "C" fn(*const AnyObject, Sel, *mut AnyObject) -> Bool,
            );
            // 클릭 시 자기 자신을 firstResponder로 — 안 그러면 keys가 처음 view로만 감.
            builder.add_method(
                sel!(mouseDown:),
                mouse_down as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject),
            );
            // inputContext — 안전망으로 명시 오버라이드. nil 반환되면 IME 라우팅 안 됨.
            builder.add_method(
                sel!(inputContext),
                input_context as unsafe extern "C" fn(*mut AnyObject, Sel) -> *mut AnyObject,
            );
            builder.add_method(
                sel!(canBecomeKeyView),
                ret_yes as unsafe extern "C" fn(*const AnyObject, Sel) -> Bool,
            );
            builder.add_method(
                sel!(wantsLayer),
                ret_yes as unsafe extern "C" fn(*const AnyObject, Sel) -> Bool,
            );
            builder.add_method(
                sel!(isFlipped),
                ret_yes as unsafe extern "C" fn(*const AnyObject, Sel) -> Bool,
            );
            builder.add_method(
                sel!(isOpaque),
                ret_yes as unsafe extern "C" fn(*const AnyObject, Sel) -> Bool,
            );

            // Drawing
            builder.add_method(
                sel!(drawRect:),
                draw_rect as unsafe extern "C" fn(*mut AnyObject, Sel, NSRect),
            );

            // Keyboard
            builder.add_method(
                sel!(keyDown:),
                key_down as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject),
            );
            builder.add_method(
                sel!(flagsChanged:),
                flags_changed as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject),
            );

            // NSTextInputClient
            builder.add_method(
                sel!(insertText:replacementRange:),
                insert_text as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject, NSRange),
            );
            builder.add_method(
                sel!(setMarkedText:selectedRange:replacementRange:),
                set_marked_text
                    as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject, NSRange, NSRange),
            );
            builder.add_method(
                sel!(unmarkText),
                unmark_text as unsafe extern "C" fn(*mut AnyObject, Sel),
            );
            builder.add_method(
                sel!(hasMarkedText),
                has_marked_text as unsafe extern "C" fn(*mut AnyObject, Sel) -> Bool,
            );
            builder.add_method(
                sel!(markedRange),
                marked_range as unsafe extern "C" fn(*mut AnyObject, Sel) -> NSRange,
            );
            builder.add_method(
                sel!(selectedRange),
                selected_range as unsafe extern "C" fn(*mut AnyObject, Sel) -> NSRange,
            );
            builder.add_method(
                sel!(validAttributesForMarkedText),
                valid_attrs as unsafe extern "C" fn(*mut AnyObject, Sel) -> *mut AnyObject,
            );
            builder.add_method(
                sel!(attributedSubstringForProposedRange:actualRange:),
                attributed_substring
                    as unsafe extern "C" fn(
                        *mut AnyObject,
                        Sel,
                        NSRange,
                        *mut NSRange,
                    ) -> *mut AnyObject,
            );
            builder.add_method(
                sel!(firstRectForCharacterRange:actualRange:),
                first_rect
                    as unsafe extern "C" fn(*mut AnyObject, Sel, NSRange, *mut NSRange) -> NSRect,
            );
            builder.add_method(
                sel!(characterIndexForPoint:),
                char_index_for_point as unsafe extern "C" fn(*mut AnyObject, Sel, NSPoint) -> usize,
            );
            builder.add_method(
                sel!(doCommandBySelector:),
                do_command as unsafe extern "C" fn(*mut AnyObject, Sel, Sel),
            );

            // Tick (NSTimer 콜백) — 클래스에 셀렉터 등록.
            builder.add_method(
                sel!(alacTick:),
                tick as unsafe extern "C" fn(*mut AnyObject, Sel, *mut AnyObject),
            );
        }

        builder.register();
        log::info!("alac: registered ClabsAlacView class");
    });
}

// ────────────────────────────────────────────────────────────────────────
// Class 메서드 구현
// ────────────────────────────────────────────────────────────────────────

unsafe extern "C" fn ret_yes(_: *const AnyObject, _: Sel) -> Bool {
    Bool::YES
}

unsafe extern "C" fn accepts_first_mouse(
    _: *const AnyObject,
    _: Sel,
    _event: *mut AnyObject,
) -> Bool {
    Bool::YES
}

/// NSView가 가장 위에 떠있어서 click이 React로 가지 못함.
/// 따라서 클릭 시점에 우리 NSView가 직접 firstResponder가 되어야 키 입력 라우팅이 정상.
/// 추가로 active pane을 React에 동기화하기 위해 Tauri 이벤트도 emit.
unsafe extern "C" fn mouse_down(self_: *mut AnyObject, _: Sel, _event: *mut AnyObject) {
    let win: *mut AnyObject = msg_send![self_, window];
    if !win.is_null() {
        let _: () = msg_send![win, makeFirstResponder: self_];
    }
    // React 측 active pane 동기화는 추후 — 일단 firstResponder만 잡아도 입력은 정상.
}

/// NSResponder.inputContext 오버라이드.
/// 첫 호출 시 NSTextInputContext를 만들어 ViewState에 캐시.
unsafe extern "C" fn input_context(self_: *mut AnyObject, _: Sel) -> *mut AnyObject {
    // 캐시 확인
    if let Ok(map) = VIEW_MAP.lock() {
        if let Some(st) = map.get(&(self_ as usize)) {
            if st.ime_ctx != 0 {
                return st.ime_ctx as *mut AnyObject;
            }
        }
    }
    // 새로 생성 (alloc + initWithClient:)
    let cls = match AnyClass::get(c"NSTextInputContext") {
        Some(c) => c,
        None => {
            log::warn!("alac: NSTextInputContext class not found");
            return std::ptr::null_mut();
        }
    };
    let raw: *mut AnyObject = msg_send![cls, alloc];
    let ctx: *mut AnyObject = msg_send![raw, initWithClient: self_];
    if ctx.is_null() {
        log::warn!("alac: initWithClient returned nil");
        return std::ptr::null_mut();
    }
    // 캐시에 저장 (Retained: initWithClient는 +1 ref)
    if let Ok(mut map) = VIEW_MAP.lock() {
        if let Some(st) = map.get_mut(&(self_ as usize)) {
            st.ime_ctx = ctx as usize;
        }
    }
    log::info!("alac: created NSTextInputContext for view");
    ctx
}

unsafe extern "C" fn tick(self_: *mut AnyObject, _: Sel, _timer: *mut AnyObject) {
    let pane_id = match get_pane_id(self_) {
        Some(p) => p,
        None => return,
    };
    let mgr = match manager() {
        Some(m) => m,
        None => return,
    };
    let dirty = mgr.is_dirty(&pane_id);

    // 커서 깜박임: 페이즈가 직전 frame과 다르면 redraw.
    let new_phase = current_blink_phase();
    let phase_changed = if let Ok(mut map) = VIEW_MAP.lock() {
        if let Some(st) = map.get_mut(&(self_ as usize)) {
            let changed = st.blink_phase != new_phase;
            st.blink_phase = new_phase;
            changed
        } else {
            false
        }
    } else {
        false
    };

    if dirty || phase_changed {
        if dirty {
            mgr.clear_dirty(&pane_id);
        }
        let _: () = msg_send![self_, setNeedsDisplay: Bool::YES];
    }
}

// ── 키보드 ───────────────────────────────────────────────────────────────

unsafe extern "C" fn key_down(self_: *mut AnyObject, _: Sel, event: *mut AnyObject) {
    let modifiers: u64 = msg_send![event, modifierFlags];
    let key_code: u16 = msg_send![event, keyCode];
    let is_repeat: Bool = msg_send![event, isARepeat];
    // Cocoa modifier flag bits
    const NSCONTROL: u64 = 1 << 18;
    const NSCOMMAND: u64 = 1 << 20;
    const NSOPTION: u64 = 1 << 19;
    let has_ctrl = (modifiers & NSCONTROL) != 0;
    let has_cmd = (modifiers & NSCOMMAND) != 0;
    let has_opt = (modifiers & NSOPTION) != 0;

    let has_marked = get_marked_len(self_) > 0;
    log::info!(
        "[alac] keyDown code={} ctrl={} cmd={} opt={} repeat={} marked_len={}",
        key_code,
        has_ctrl,
        has_cmd,
        has_opt,
        is_repeat.as_bool(),
        get_marked_len(self_)
    );
    let _ = has_marked;

    // Ctrl/Cmd 조합은 IME 우회하고 직접 처리. (단, IME 조합 중이면 IME에 위임)
    if (has_ctrl || has_cmd) && get_marked_len(self_) == 0 {
        if let Some(bytes) = ctrl_cmd_keystroke(event, has_ctrl, has_cmd, has_opt) {
            log::info!("[alac]  → ctrl/cmd direct send: {:?}", bytes);
            send_bytes(self_, bytes);
            return;
        }
    }

    // 일반 입력 → interpretKeyEvents → insertText:/setMarkedText: 콜백
    let cls = AnyClass::get(c"NSArray").unwrap();
    let arr: *mut AnyObject = msg_send![cls, arrayWithObject: event];
    let _: () = msg_send![self_, interpretKeyEvents: arr];
    log::info!("[alac]  → interpretKeyEvents returned");
}

unsafe extern "C" fn flags_changed(_self: *mut AnyObject, _: Sel, _event: *mut AnyObject) {
    // 현재 별도 처리 없음. (Shift 단독 등은 keyDown에서 다룸)
}

/// Ctrl/Cmd 단축키 → 바이트 시퀀스 변환. 처리 못 하면 None.
unsafe fn ctrl_cmd_keystroke(
    event: *mut AnyObject,
    has_ctrl: bool,
    has_cmd: bool,
    _has_opt: bool,
) -> Option<Vec<u8>> {
    let chars: *mut AnyObject = msg_send![event, charactersIgnoringModifiers];
    if chars.is_null() {
        return None;
    }
    let utf8: *const i8 = msg_send![chars, UTF8String];
    if utf8.is_null() {
        return None;
    }
    let s = CStr::from_ptr(utf8).to_string_lossy().into_owned();
    if s.is_empty() {
        return None;
    }
    let c = s.chars().next().unwrap().to_ascii_lowercase();

    if has_ctrl && !has_cmd {
        // Ctrl-A..Z → 0x01..0x1A
        if c.is_ascii_alphabetic() {
            return Some(vec![(c as u8) - b'a' + 1]);
        }
        // Ctrl-[ / Ctrl-] / Ctrl-\ / Ctrl-_
        match c {
            '[' => return Some(vec![0x1b]),
            ']' => return Some(vec![0x1d]),
            '\\' => return Some(vec![0x1c]),
            '_' | '/' => return Some(vec![0x1f]),
            ' ' => return Some(vec![0x00]), // Ctrl-Space → NUL
            _ => {}
        }
    }
    // Cmd 단축키는 일단 처리하지 않음 (앱 레벨 단축키 충돌 방지)
    let _ = has_cmd;
    None
}

// ── NSTextInputClient ────────────────────────────────────────────────────

unsafe extern "C" fn insert_text(
    self_: *mut AnyObject,
    _: Sel,
    string: *mut AnyObject,
    _replacement: NSRange,
) {
    if string.is_null() {
        return;
    }
    // string은 NSString 또는 NSAttributedString.
    let is_attr: Bool = msg_send![string, isKindOfClass: AnyClass::get(c"NSAttributedString").unwrap()];
    let ns_string: *mut AnyObject = if is_attr.as_bool() {
        msg_send![string, string]
    } else {
        string
    };
    let utf8: *const i8 = msg_send![ns_string, UTF8String];
    if utf8.is_null() {
        return;
    }
    let s = CStr::from_ptr(utf8).to_string_lossy().into_owned();
    log::info!("[alac] insertText: {:?} (bytes: {:?})", s, s.as_bytes());
    // 마크 해제
    set_marked_str(self_, String::new());
    if !s.is_empty() {
        send_bytes(self_, s.into_bytes());
    }
    // 즉시 리드로우
    let _: () = msg_send![self_, setNeedsDisplay: Bool::YES];
}

unsafe extern "C" fn set_marked_text(
    self_: *mut AnyObject,
    _: Sel,
    string: *mut AnyObject,
    _selected: NSRange,
    _replacement: NSRange,
) {
    let s = if string.is_null() {
        String::new()
    } else {
        let is_attr: Bool = msg_send![
            string,
            isKindOfClass: AnyClass::get(c"NSAttributedString").unwrap()
        ];
        let ns: *mut AnyObject = if is_attr.as_bool() {
            msg_send![string, string]
        } else {
            string
        };
        let utf8: *const i8 = msg_send![ns, UTF8String];
        if utf8.is_null() {
            String::new()
        } else {
            CStr::from_ptr(utf8).to_string_lossy().into_owned()
        }
    };
    log::info!("[alac] setMarkedText: {:?}", s);
    set_marked_str(self_, s);
    let _: () = msg_send![self_, setNeedsDisplay: Bool::YES];
}

unsafe extern "C" fn unmark_text(self_: *mut AnyObject, _: Sel) {
    set_marked_str(self_, String::new());
    let _: () = msg_send![self_, setNeedsDisplay: Bool::YES];
}

unsafe extern "C" fn has_marked_text(self_: *mut AnyObject, _: Sel) -> Bool {
    if get_marked_len(self_) > 0 {
        Bool::YES
    } else {
        Bool::NO
    }
}

unsafe extern "C" fn marked_range(self_: *mut AnyObject, _: Sel) -> NSRange {
    let len = get_marked_len(self_);
    if len > 0 {
        NSRange { location: 0, length: len }
    } else {
        NSRange { location: usize::MAX, length: 0 }
    }
}

unsafe extern "C" fn selected_range(_: *mut AnyObject, _: Sel) -> NSRange {
    NSRange { location: usize::MAX, length: 0 }
}

unsafe extern "C" fn valid_attrs(_: *mut AnyObject, _: Sel) -> *mut AnyObject {
    let cls = AnyClass::get(c"NSArray").unwrap();
    msg_send![cls, array]
}

unsafe extern "C" fn attributed_substring(
    _self: *mut AnyObject,
    _: Sel,
    _: NSRange,
    _: *mut NSRange,
) -> *mut AnyObject {
    std::ptr::null_mut()
}

unsafe extern "C" fn first_rect(
    self_: *mut AnyObject,
    _: Sel,
    _: NSRange,
    _: *mut NSRange,
) -> NSRect {
    // 화면 좌표 기준의 IME 후보 윈도우 위치. 현재는 view origin으로 대체.
    let bounds: NSRect = msg_send![self_, bounds];
    let win: *mut AnyObject = msg_send![self_, window];
    if win.is_null() {
        return bounds;
    }
    let in_window: NSRect = msg_send![self_, convertRect: bounds, toView: std::ptr::null_mut::<AnyObject>()];
    let on_screen: NSRect = msg_send![win, convertRectToScreen: in_window];
    on_screen
}

unsafe extern "C" fn char_index_for_point(_: *mut AnyObject, _: Sel, _: NSPoint) -> usize {
    0
}

unsafe extern "C" fn do_command(self_: *mut AnyObject, _: Sel, sel: Sel) {
    // 화살표/Enter/Backspace 등 — interpretKeyEvents 결과로 호출됨.
    let name = sel.name().to_bytes();
    log::info!("[alac] doCommand: {:?}", std::str::from_utf8(name).unwrap_or("?"));
    let bytes: Option<&[u8]> = match name {
        b"insertNewline:" => Some(b"\r"),
        b"insertTab:" => Some(b"\t"),
        b"insertBacktab:" => Some(b"\x1b[Z"),
        b"deleteBackward:" => Some(b"\x7f"),
        b"deleteForward:" => Some(b"\x1b[3~"),
        b"moveLeft:" => Some(b"\x1b[D"),
        b"moveRight:" => Some(b"\x1b[C"),
        b"moveUp:" => Some(b"\x1b[A"),
        b"moveDown:" => Some(b"\x1b[B"),
        b"moveToBeginningOfLine:" | b"moveToLeftEndOfLine:" => Some(b"\x1b[H"),
        b"moveToEndOfLine:" | b"moveToRightEndOfLine:" => Some(b"\x1b[F"),
        b"scrollPageUp:" | b"pageUp:" => Some(b"\x1b[5~"),
        b"scrollPageDown:" | b"pageDown:" => Some(b"\x1b[6~"),
        b"cancelOperation:" => Some(b"\x1b"),
        _ => None,
    };
    if let Some(b) = bytes {
        send_bytes(self_, b.to_vec());
    }
}

// ────────────────────────────────────────────────────────────────────────
// 헬퍼
// ────────────────────────────────────────────────────────────────────────

fn get_pane_id(view: *mut AnyObject) -> Option<String> {
    let map = VIEW_MAP.lock().ok()?;
    map.get(&(view as usize)).map(|s| s.pane_id.clone())
}

fn get_marked_len(view: *mut AnyObject) -> usize {
    let map = VIEW_MAP.lock().ok();
    map.and_then(|m| m.get(&(view as usize)).map(|s| s.marked_text.chars().count()))
        .unwrap_or(0)
}

fn set_marked_str(view: *mut AnyObject, s: String) {
    if let Ok(mut map) = VIEW_MAP.lock() {
        if let Some(state) = map.get_mut(&(view as usize)) {
            state.marked_text = s;
        }
    }
}

unsafe fn send_bytes(view: *mut AnyObject, bytes: Vec<u8>) {
    let pane_id = match get_pane_id(view) {
        Some(p) => p,
        None => return,
    };
    log::info!(
        "[alac] send_bytes pane={} len={} bytes={:?}",
        pane_id,
        bytes.len(),
        bytes
    );
    if let Some(mgr) = manager() {
        mgr.write_input(&pane_id, bytes);
    }
}

// ────────────────────────────────────────────────────────────────────────
// drawRect: 렌더
// ────────────────────────────────────────────────────────────────────────

unsafe extern "C" fn draw_rect(self_: *mut AnyObject, _: Sel, _dirty: NSRect) {
    let pane_id = match get_pane_id(self_) {
        Some(p) => p,
        None => return,
    };
    let mgr = match manager() {
        Some(m) => m,
        None => return,
    };

    let bounds: NSRect = msg_send![self_, bounds];

    let (cell_w, cell_h, font_size, marked_text) = {
        let map = VIEW_MAP.lock().unwrap();
        let st = map.get(&(self_ as usize)).cloned_state();
        st.unwrap_or((8.0, 16.0, 13.0, String::new()))
    };

    // 1. 배경 채우기 (검정)
    fill_background(bounds, 0.07, 0.07, 0.09, 1.0);

    // 2. 폰트
    let font = make_font(font_size);

    // 3. Term lock 후 grid 순회
    let _ = mgr.with_term(&pane_id, |term| {
        render_grid(term, &font, cell_w, cell_h, &marked_text);
    });
}

trait CloneOpt {
    fn cloned_state(&self) -> Option<(f64, f64, f64, String)>;
}
impl CloneOpt for Option<&ViewState> {
    fn cloned_state(&self) -> Option<(f64, f64, f64, String)> {
        self.map(|s| (s.cell_w, s.cell_h, s.font_size, s.marked_text.clone()))
    }
}

unsafe fn fill_background(rect: NSRect, r: f64, g: f64, b: f64, a: f64) {
    let cls = AnyClass::get(c"NSColor").unwrap();
    let color: *mut AnyObject = msg_send![cls, colorWithSRGBRed: r, green: g, blue: b, alpha: a];
    let _: () = msg_send![color, setFill];
    let cls_bp = AnyClass::get(c"NSBezierPath").unwrap();
    let _: () = msg_send![cls_bp, fillRect: rect];
}

unsafe fn make_font(size: f64) -> Retained<AnyObject> {
    let cls = AnyClass::get(c"NSFont").unwrap();
    // monospacedSystemFontOfSize:weight: (weight 0 = regular)
    let f: *mut AnyObject = msg_send![cls, monospacedSystemFontOfSize: size, weight: 0.0_f64];
    Retained::retain(f).expect("nil NSFont")
}

unsafe fn render_grid<T: alacritty_terminal::event::EventListener>(
    term: &alacritty_terminal::Term<T>,
    font: &Retained<AnyObject>,
    cell_w: f64,
    cell_h: f64,
    marked: &str,
) {
    let content = term.renderable_content();
    let cursor_point = content.cursor.point;
    let display_offset = content.display_offset as i32;
    let columns = term.columns();

    // NSAttributedString을 row마다 만들어 한 번에 그림 (셀별 drawAtPoint보다 훨씬 빠름).
    let cls_attr = AnyClass::get(c"NSMutableAttributedString").unwrap();
    let cls_str = AnyClass::get(c"NSString").unwrap();
    let cls_color = AnyClass::get(c"NSColor").unwrap();

    // 키 NSString 미리 준비
    let key_font: Retained<NSString> = NSString::from_str("NSFont");
    let key_fg: Retained<NSString> = NSString::from_str("NSColor");
    let key_bg: Retained<NSString> = NSString::from_str("NSBackgroundColor");

    // (col, char, fg, bg, flags) — col 정보를 보존해야 wide-char를 정확한 위치에 그릴 수 있음.
    let mut line_buf: Vec<(usize, char, AnsiColor, AnsiColor, CellFlags)> =
        Vec::with_capacity(columns);
    let mut current_row: Option<i32> = None;

    let flush = |row: i32, buf: &mut Vec<(usize, char, AnsiColor, AnsiColor, CellFlags)>| unsafe {
        let y = row as f64 * cell_h;
        draw_row(
            buf,
            y,
            cell_w,
            cell_h,
            font,
            cls_attr,
            cls_str,
            cls_color,
            &key_font,
            &key_fg,
            &key_bg,
        );
        buf.clear();
    };

    for cell in content.display_iter {
        let row_idx = (cell.point.line.0 + display_offset) as i32;
        if row_idx < 0 {
            continue;
        }
        if Some(row_idx) != current_row {
            if let Some(prev) = current_row {
                flush(prev, &mut line_buf);
            }
            current_row = Some(row_idx);
        }

        let col_idx = cell.point.column.0;
        let mut ch = cell.c;
        if ch == '\0' {
            ch = ' ';
        }
        line_buf.push((col_idx, ch, cell.fg, cell.bg, cell.flags));
    }
    if let Some(prev) = current_row {
        flush(prev, &mut line_buf);
    }
    let _ = cls_str;

    // Cursor — IME 조합 중에는 글자가 보이도록 블록 대신 밑줄(언더바)로 그림.
    let cursor_x = cursor_point.column.0 as f64 * cell_w;
    let cursor_y = (cursor_point.line.0 + display_offset) as f64 * cell_h;
    let phase = current_blink_phase();
    let composing = !marked.is_empty();
    let cursor_color: *mut AnyObject = msg_send![
        cls_color,
        colorWithSRGBRed: 0.90_f64, green: 0.90_f64, blue: 0.90_f64, alpha: 0.85_f64
    ];
    let cls_bp = AnyClass::get(c"NSBezierPath").unwrap();

    if composing {
        // IME 조합 중: 마킹 텍스트 전체 폭(글자 수 * cell_w 또는 wide면 더 넓음)에 밑줄.
        // 마킹된 글자에 한글이 섞여 있으면 가시폭 추정이 까다로우니, char 수 기반으로 단순 계산하되
        // 한글 같은 wide-char은 2-cell로 가정.
        let visual_cells: usize = marked
            .chars()
            .map(|c| if is_wide_char(c) { 2 } else { 1 })
            .sum();
        let underline_w = (visual_cells as f64).max(1.0) * cell_w;
        let underline_h = (cell_h * 0.10).max(2.0);
        let rect = NSRect {
            origin: NSPoint {
                x: cursor_x,
                y: cursor_y + cell_h - underline_h,
            },
            size: NSSize { width: underline_w, height: underline_h },
        };
        let _: () = msg_send![cursor_color, setFill];
        let _: () = msg_send![cls_bp, fillRect: rect];
    } else if phase == 0 {
        // 일반 모드: 깜박임 페이즈 ON에서 블록 커서.
        let rect = NSRect {
            origin: NSPoint { x: cursor_x, y: cursor_y },
            size: NSSize { width: cell_w, height: cell_h },
        };
        let _: () = msg_send![cursor_color, setFill];
        let _: () = msg_send![cls_bp, fillRect: rect];
    }

    // Marked text (IME 조합 중) — 커서 위치에 노란색으로
    if composing {
        draw_marked_text(marked, cursor_x, cursor_y, cell_h, font);
    }
}

/// East Asian wide character 단순 판별. 한자/한글/일본어/이모지 등.
/// 정확한 width는 unicode-width 크레이트 쓸 수 있지만, 일단 BMP 영역 기준 휴리스틱.
fn is_wide_char(c: char) -> bool {
    let cp = c as u32;
    matches!(
        cp,
        0x1100..=0x115F
        | 0x2E80..=0x303E
        | 0x3041..=0x33FF
        | 0x3400..=0x4DBF
        | 0x4E00..=0x9FFF
        | 0xA000..=0xA4CF
        | 0xAC00..=0xD7A3
        | 0xF900..=0xFAFF
        | 0xFE30..=0xFE4F
        | 0xFF00..=0xFF60
        | 0xFFE0..=0xFFE6
        | 0x1F300..=0x1F64F
        | 0x1F900..=0x1F9FF
        | 0x20000..=0x2FFFD
        | 0x30000..=0x3FFFD
    )
}

#[allow(clippy::too_many_arguments)]
unsafe fn draw_row(
    line: &[(usize, char, AnsiColor, AnsiColor, CellFlags)],
    y: f64,
    cell_w: f64,
    cell_h: f64,
    font: &Retained<AnyObject>,
    cls_attr: &AnyClass,
    _cls_str: &AnyClass,
    cls_color: &AnyClass,
    key_font: &NSString,
    key_fg: &NSString,
    _key_bg: &NSString,
) {
    let cls_bp = AnyClass::get(c"NSBezierPath").unwrap();
    let dict_cls = AnyClass::get(c"NSMutableDictionary").unwrap();

    // 셀 단위로 그린다. 같은 (fg,bg,flags)이고 wide가 아닌 ASCII run은 묶어서 한 번에.
    let mut i = 0usize;
    while i < line.len() {
        let (col_i, ch_i, fg_i, bg_i, flags_i) = line[i];

        // WIDE_CHAR_SPACER는 좌측 셀의 wide char가 처리하므로 스킵.
        if flags_i.contains(CellFlags::WIDE_CHAR_SPACER)
            || flags_i.contains(CellFlags::LEADING_WIDE_CHAR_SPACER)
        {
            i += 1;
            continue;
        }

        let is_wide = flags_i.contains(CellFlags::WIDE_CHAR);
        let cells_in_glyph = if is_wide { 2 } else { 1 };

        // run 묶기: wide가 아니고 같은 속성/같은 row 연속일 때.
        let mut end = i + 1;
        if !is_wide {
            while end < line.len() {
                let (_col, _ch, fg, bg, flags) = line[end];
                if fg != fg_i || bg != bg_i || flags != flags_i {
                    break;
                }
                if flags.contains(CellFlags::WIDE_CHAR_SPACER)
                    || flags.contains(CellFlags::LEADING_WIDE_CHAR_SPACER)
                    || flags.contains(CellFlags::WIDE_CHAR)
                {
                    break;
                }
                // 컬럼 연속성 체크
                if line[end].0 != line[end - 1].0 + 1 {
                    break;
                }
                end += 1;
            }
        }

        // run 텍스트 / 색상
        let s: String = line[i..end].iter().map(|(_, c, ..)| *c).collect();
        let nss: Retained<NSString> = NSString::from_str(&s);

        let (fg_color, bg_color) = resolve_colors(fg_i, bg_i, flags_i, cls_color);

        // 위치/폭 — wide면 2*cell_w, 아니면 (end-i)*cell_w
        let x = col_i as f64 * cell_w;
        let total_cells = if is_wide {
            cells_in_glyph
        } else {
            end - i
        };
        let w = total_cells as f64 * cell_w;

        // 배경
        let bg_rect = NSRect {
            origin: NSPoint { x, y },
            size: NSSize { width: w, height: cell_h },
        };
        let _: () = msg_send![&*bg_color, setFill];
        let _: () = msg_send![cls_bp, fillRect: bg_rect];

        // 글자 그리기
        let dict: *mut AnyObject = msg_send![dict_cls, dictionary];
        let _: () = msg_send![dict, setObject: &**font, forKey: &*key_font];
        let _: () = msg_send![dict, setObject: &*fg_color, forKey: &*key_fg];

        let attr: *mut AnyObject = msg_send![cls_attr, alloc];
        let attr: *mut AnyObject = msg_send![attr, initWithString: &*nss, attributes: dict];
        let pt = NSPoint { x, y };
        let _: () = msg_send![attr, drawAtPoint: pt];
        let _: () = msg_send![attr, release];

        i = end;
    }
}

unsafe fn resolve_colors(
    fg: AnsiColor,
    bg: AnsiColor,
    flags: CellFlags,
    cls_color: &AnyClass,
) -> (Retained<AnyObject>, Retained<AnyObject>) {
    let mut f = ansi_to_rgb(fg, true);
    let mut b = ansi_to_rgb(bg, false);
    if flags.contains(CellFlags::INVERSE) {
        std::mem::swap(&mut f, &mut b);
    }
    let make = |r: f64, g: f64, b: f64| -> Retained<AnyObject> {
        let c: *mut AnyObject = msg_send![
            cls_color,
            colorWithSRGBRed: r, green: g, blue: b, alpha: 1.0_f64
        ];
        Retained::retain(c).expect("nil color")
    };
    (make(f.0, f.1, f.2), make(b.0, b.1, b.2))
}

fn ansi_to_rgb(color: AnsiColor, is_fg: bool) -> (f64, f64, f64) {
    match color {
        AnsiColor::Named(named) => named_color(named, is_fg),
        AnsiColor::Spec(rgb) => (
            rgb.r as f64 / 255.0,
            rgb.g as f64 / 255.0,
            rgb.b as f64 / 255.0,
        ),
        AnsiColor::Indexed(idx) => indexed_color(idx),
    }
}

fn named_color(c: NamedColor, is_fg: bool) -> (f64, f64, f64) {
    match c {
        NamedColor::Background => (0.07, 0.07, 0.09),
        NamedColor::Foreground => (0.85, 0.85, 0.85),
        NamedColor::Black => (0.0, 0.0, 0.0),
        NamedColor::Red => (0.80, 0.27, 0.27),
        NamedColor::Green => (0.40, 0.75, 0.36),
        NamedColor::Yellow => (0.90, 0.78, 0.36),
        NamedColor::Blue => (0.40, 0.60, 0.90),
        NamedColor::Magenta => (0.78, 0.46, 0.78),
        NamedColor::Cyan => (0.36, 0.78, 0.78),
        NamedColor::White => (0.85, 0.85, 0.85),
        NamedColor::BrightBlack => (0.40, 0.40, 0.40),
        NamedColor::BrightRed => (0.95, 0.50, 0.50),
        NamedColor::BrightGreen => (0.55, 0.90, 0.50),
        NamedColor::BrightYellow => (0.98, 0.92, 0.55),
        NamedColor::BrightBlue => (0.55, 0.75, 0.98),
        NamedColor::BrightMagenta => (0.95, 0.65, 0.95),
        NamedColor::BrightCyan => (0.55, 0.95, 0.95),
        NamedColor::BrightWhite => (1.0, 1.0, 1.0),
        NamedColor::Cursor => (0.85, 0.85, 0.85),
        NamedColor::DimBlack => (0.0, 0.0, 0.0),
        NamedColor::DimRed => (0.55, 0.20, 0.20),
        NamedColor::DimGreen => (0.30, 0.55, 0.27),
        NamedColor::DimYellow => (0.65, 0.55, 0.27),
        NamedColor::DimBlue => (0.30, 0.45, 0.65),
        NamedColor::DimMagenta => (0.55, 0.35, 0.55),
        NamedColor::DimCyan => (0.27, 0.55, 0.55),
        NamedColor::DimWhite => (0.65, 0.65, 0.65),
        NamedColor::DimForeground => (0.65, 0.65, 0.65),
        NamedColor::BrightForeground => (1.0, 1.0, 1.0),
    }
    .into_default(is_fg)
}

trait IntoDefault {
    fn into_default(self, is_fg: bool) -> (f64, f64, f64);
}
impl IntoDefault for (f64, f64, f64) {
    fn into_default(self, _is_fg: bool) -> (f64, f64, f64) {
        self
    }
}

fn indexed_color(idx: u8) -> (f64, f64, f64) {
    if idx < 16 {
        let n = match idx {
            0 => NamedColor::Black,
            1 => NamedColor::Red,
            2 => NamedColor::Green,
            3 => NamedColor::Yellow,
            4 => NamedColor::Blue,
            5 => NamedColor::Magenta,
            6 => NamedColor::Cyan,
            7 => NamedColor::White,
            8 => NamedColor::BrightBlack,
            9 => NamedColor::BrightRed,
            10 => NamedColor::BrightGreen,
            11 => NamedColor::BrightYellow,
            12 => NamedColor::BrightBlue,
            13 => NamedColor::BrightMagenta,
            14 => NamedColor::BrightCyan,
            _ => NamedColor::BrightWhite,
        };
        return named_color(n, true);
    }
    if idx < 232 {
        // 6×6×6 cube
        let i = idx - 16;
        let r = (i / 36) % 6;
        let g = (i / 6) % 6;
        let b = i % 6;
        let map = |x: u8| if x == 0 { 0.0 } else { (40.0 * x as f64 + 55.0) / 255.0 };
        (map(r), map(g), map(b))
    } else {
        // Grayscale 24
        let level = (8 + 10 * (idx - 232)) as f64 / 255.0;
        (level, level, level)
    }
}

unsafe fn draw_marked_text(
    text: &str,
    x: f64,
    y: f64,
    cell_h: f64,
    font: &Retained<AnyObject>,
) {
    let nss: Retained<NSString> = NSString::from_str(text);
    let cls_color = AnyClass::get(c"NSColor").unwrap();
    let yellow: *mut AnyObject = msg_send![
        cls_color,
        colorWithSRGBRed: 0.95_f64, green: 0.85_f64, blue: 0.30_f64, alpha: 1.0_f64
    ];
    let dict_cls = AnyClass::get(c"NSMutableDictionary").unwrap();
    let dict: *mut AnyObject = msg_send![dict_cls, dictionary];
    let key_font: Retained<NSString> = NSString::from_str("NSFont");
    let key_fg: Retained<NSString> = NSString::from_str("NSColor");
    let key_under: Retained<NSString> = NSString::from_str("NSUnderline");
    let _: () = msg_send![dict, setObject: &**font, forKey: &*key_font];
    let _: () = msg_send![dict, setObject: yellow, forKey: &*key_fg];
    // 밑줄 1
    let cls_num = AnyClass::get(c"NSNumber").unwrap();
    let one: *mut AnyObject = msg_send![cls_num, numberWithInt: 1_i32];
    let _: () = msg_send![dict, setObject: one, forKey: &*key_under];

    let _ = cell_h;
    let pt = NSPoint { x, y };
    let _: () = msg_send![&*nss, drawAtPoint: pt, withAttributes: dict];
}

// ────────────────────────────────────────────────────────────────────────
// Public API: 뷰 생성/제거/프레임/포커스
// ────────────────────────────────────────────────────────────────────────

pub unsafe fn create_view(pane_id: &str, ns_window: *mut c_void, frame: NSRect) -> *mut AnyObject {
    register_class();

    // 기존 paneId에 매핑된 view가 있으면 먼저 청소 — 이중 mount(StrictMode/리렌더)나
    // 동일 paneId로 재생성 시 좀비 NSView가 contentView에 쌓이는 것을 방지.
    {
        let stale = {
            let mut m = match PANE_VIEW.lock() {
                Ok(g) => g,
                Err(_) => return std::ptr::null_mut(),
            };
            m.remove(pane_id)
        };
        if let Some(p) = stale {
            log::info!("alac: cleaning up stale view {} for pane={}", p, pane_id);
            let stale_view = p as *mut AnyObject;
            let _: () = msg_send![stale_view, removeFromSuperview];
            if let Ok(mut map) = VIEW_MAP.lock() {
                map.remove(&p);
            }
        }
    }

    let cls = AnyClass::get(CLS_NAME).expect("ClabsAlacView class");
    let view: *mut AnyObject = msg_send![cls, alloc];
    let view: *mut AnyObject = msg_send![view, initWithFrame: frame];
    // 초기에는 숨김 — 첫 set_frame이 호출될 때까지 임시 frame이 다른 UI를 덮지 않도록.
    let _: () = msg_send![view, setHidden: Bool::YES];

    // 폰트 메트릭 측정
    let font_size = 13.0_f64;
    let (cell_w, cell_h) = measure_cell(font_size);

    // VIEW_MAP에 등록
    if let Ok(mut map) = VIEW_MAP.lock() {
        map.insert(
            view as usize,
            ViewState {
                pane_id: pane_id.to_string(),
                cell_w,
                cell_h,
                font_size,
                cols: 80,
                rows: 24,
                marked_text: String::new(),
                ime_ctx: 0,
                blink_phase: 0,
            },
        );
    }
    if let Ok(mut m) = PANE_VIEW.lock() {
        m.insert(pane_id.to_string(), view as usize);
    }

    // contentView에 추가
    if !ns_window.is_null() {
        let win = ns_window as *mut AnyObject;
        let content_view: *mut AnyObject = msg_send![win, contentView];
        if !content_view.is_null() {
            let _: () = msg_send![content_view, addSubview: view];
        }
        let _: () = msg_send![win, makeFirstResponder: view];
    }

    // NSTimer 30Hz로 alacTick: 호출
    install_tick_timer(view);

    log::info!("alac: created view for pane={} cell={}x{}", pane_id, cell_w, cell_h);
    view
}

pub unsafe fn destroy_view(pane_id: &str) {
    let view_ptr = {
        let mut m = match PANE_VIEW.lock() {
            Ok(g) => g,
            Err(_) => return,
        };
        m.remove(pane_id)
    };
    if let Some(p) = view_ptr {
        let view = p as *mut AnyObject;
        let _: () = msg_send![view, removeFromSuperview];
        if let Ok(mut map) = VIEW_MAP.lock() {
            map.remove(&p);
        }
    }
}

pub unsafe fn set_frame(pane_id: &str, frame: NSRect) {
    let view_ptr = {
        let m = match PANE_VIEW.lock() {
            Ok(g) => g,
            Err(_) => return,
        };
        m.get(pane_id).copied()
    };
    let Some(p) = view_ptr else {
        log::warn!("alac::set_frame: no view for pane={}", pane_id);
        return;
    };
    log::info!(
        "alac::set_frame pane={} view={:#x} ({},{}) {}x{}",
        pane_id,
        p,
        frame.origin.x,
        frame.origin.y,
        frame.size.width,
        frame.size.height
    );
    let view = p as *mut AnyObject;
    let _: () = msg_send![view, setFrame: frame];
    // 가시성은 set_visible 명령으로만 제어 — set_frame은 좌표/크기에만 관여한다.
    // (이전: setHidden:NO를 자동 호출했지만 모달 떠있을 때도 visible로 만들어 버림)

    // 셀 크기로 cols/rows 재계산 후 manager에 resize 통보
    let (cell_w, cell_h, cols, rows) = {
        let mut map = match VIEW_MAP.lock() {
            Ok(g) => g,
            Err(_) => return,
        };
        let st = match map.get_mut(&p) {
            Some(s) => s,
            None => return,
        };
        let new_cols = (frame.size.width / st.cell_w).floor().max(2.0) as u16;
        let new_rows = (frame.size.height / st.cell_h).floor().max(2.0) as u16;
        st.cols = new_cols;
        st.rows = new_rows;
        (st.cell_w, st.cell_h, new_cols, new_rows)
    };
    if let Some(mgr) = manager() {
        mgr.on_resize(
            pane_id,
            WindowSize {
                num_cols: cols,
                num_lines: rows,
                cell_width: cell_w as u16,
                cell_height: cell_h as u16,
            },
        );
    }
    let _: () = msg_send![view, setNeedsDisplay: Bool::YES];
}

pub unsafe fn set_visible(pane_id: &str, visible: bool) {
    // 모달이 떠있는 동안 visible=true 요청은 무시한다 (강제 hidden 유지).
    // 단 visible=false는 항상 허용.
    if visible && is_modal_open() {
        return;
    }
    let view_ptr = {
        let m = match PANE_VIEW.lock() {
            Ok(g) => g,
            Err(_) => return,
        };
        m.get(pane_id).copied()
    };
    let Some(p) = view_ptr else { return };
    let view = p as *mut AnyObject;
    let was_hidden: Bool = msg_send![view, isHidden];
    let hidden_bool = if visible { Bool::NO } else { Bool::YES };
    if hidden_bool.as_bool() != was_hidden.as_bool() {
        log::info!(
            "alac::set_visible pane={} {} -> {}",
            pane_id,
            if was_hidden.as_bool() { "hidden" } else { "visible" },
            if visible { "visible" } else { "hidden" }
        );
    }
    let _: () = msg_send![view, setHidden: hidden_bool];
}

pub unsafe fn focus(pane_id: &str) {
    let view_ptr = {
        let m = match PANE_VIEW.lock() {
            Ok(g) => g,
            Err(_) => return,
        };
        m.get(pane_id).copied()
    };
    let Some(p) = view_ptr else { return };
    let view = p as *mut AnyObject;
    let win: *mut AnyObject = msg_send![view, window];
    if !win.is_null() {
        let _: () = msg_send![win, makeFirstResponder: view];
    }
}

pub unsafe fn current_size(pane_id: &str) -> Option<(u16, u16, u16, u16)> {
    let m = PANE_VIEW.lock().ok()?;
    let p = m.get(pane_id).copied()?;
    drop(m);
    let map = VIEW_MAP.lock().ok()?;
    let st = map.get(&p)?;
    Some((st.cols, st.rows, st.cell_w as u16, st.cell_h as u16))
}

unsafe fn measure_cell(font_size: f64) -> (f64, f64) {
    let cls = AnyClass::get(c"NSFont").unwrap();
    let font: *mut AnyObject = msg_send![cls, monospacedSystemFontOfSize: font_size, weight: 0.0_f64];
    if font.is_null() {
        return (8.0, 16.0);
    }
    // 단일 문자의 advance를 폭으로, ascender+|descender|+leading을 높이로.
    let ascender: f64 = msg_send![font, ascender];
    let descender: f64 = msg_send![font, descender];
    let leading: f64 = msg_send![font, leading];
    let line_h = ascender - descender + leading;

    // 폭은 'M' 한 글자의 boundingRect로 측정.
    let test = NSString::from_str("M");
    let dict_cls = AnyClass::get(c"NSDictionary").unwrap();
    let key_font: Retained<NSString> = NSString::from_str("NSFont");
    let dict: *mut AnyObject = msg_send![
        dict_cls,
        dictionaryWithObject: font, forKey: &*key_font
    ];
    let size: NSSize = msg_send![&*test, sizeWithAttributes: dict];
    let cell_w = size.width.max(1.0);
    (cell_w, line_h.max(1.0))
}

unsafe fn install_tick_timer(view: *mut AnyObject) {
    let cls = AnyClass::get(c"NSTimer").unwrap();
    let interval: f64 = 1.0 / 30.0;
    // [NSTimer scheduledTimerWithTimeInterval:target:selector:userInfo:repeats:]
    let _timer: *mut AnyObject = msg_send![
        cls,
        scheduledTimerWithTimeInterval: interval,
        target: view,
        selector: sel!(alacTick:),
        userInfo: std::ptr::null_mut::<AnyObject>(),
        repeats: Bool::YES
    ];
}
