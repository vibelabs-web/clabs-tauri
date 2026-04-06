import AppKit
import CGhostty

/// Custom NSView that hosts a ghostty terminal surface.
/// Handles keyboard input (including Korean IME via NSTextInputClient),
/// mouse events, and Metal rendering via CAMetalLayer.
/// Based on cmux's GhosttyNSView pattern.
class GhosttyNSView: NSView, NSTextInputClient {

    /// The ghostty surface — set after createSurface
    var surface: ghostty_surface_t?

    /// Manager reference — set by GhosttyView
    weak var manager: GhosttyManager?
    var paneId: String = ""

    /// Working directory to pass when creating the surface.
    var workingDirectory: String?

    /// Current font size (relative to base 14pt).
    private var fontSizeDelta: Int = 0
    private let baseFontSize: Float = 14.0

    /// Marked text for IME composition (Korean, Japanese, etc.)
    private var markedTextStorage = NSMutableAttributedString()
    /// Text accumulated from interpretKeyEvents → insertText
    private var keyTextAccumulator: [String]?
    private var surfaceCreated = false

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        wantsLayer = true
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        wantsLayer = true
    }

    // MARK: - Layer (Metal)

    override func makeBackingLayer() -> CALayer {
        let metalLayer = CAMetalLayer()
        metalLayer.pixelFormat = .bgra8Unorm
        metalLayer.isOpaque = false
        metalLayer.framebufferOnly = false
        return metalLayer
    }

    override var wantsUpdateLayer: Bool { true }

    // MARK: - View Lifecycle

    override func viewDidMoveToWindow() {
        super.viewDidMoveToWindow()
        tryCreateSurface()
    }

    override func layout() {
        super.layout()
        tryCreateSurface()
    }

    private func tryCreateSurface() {
        guard !surfaceCreated, let manager, !paneId.isEmpty else { return }
        // Use bounds (not frame) — AutoLayout sets bounds but frame may be zero
        let size = bounds.size.width > 0 ? bounds.size : frame.size
        guard size.width > 10, size.height > 10 else { return }
        guard window != nil else { return }

        NSLog("[GhosttyNSView] creating surface: frame=%.0fx%.0f pane=%@", frame.width, frame.height, paneId)
        surfaceCreated = manager.createSurface(paneId: paneId, in: self, workingDirectory: workingDirectory)
        if surfaceCreated {
            // Delayed focus — window may not be key yet during initial layout
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                guard let self, let window = self.window else { return }
                window.makeKeyAndOrderFront(nil)
                window.makeFirstResponder(self)
                NSLog("[GhosttyNSView] focused after delay")
            }
        }
    }

    // MARK: - First Responder

    override var acceptsFirstResponder: Bool { true }
    override var canBecomeKeyView: Bool { true }

    override func becomeFirstResponder() -> Bool {
        let result = super.becomeFirstResponder()
        NSLog("[GhosttyNSView] becomeFirstResponder: %d surface=%d", result ? 1 : 0, surface != nil ? 1 : 0)
        if let surface {
            ghostty_surface_set_focus(surface, true)
        }
        return result
    }

    override func resignFirstResponder() -> Bool {
        let result = super.resignFirstResponder()
        if let surface {
            ghostty_surface_set_focus(surface, false)
        }
        return result
    }

    // MARK: - Keyboard Events

    override func keyDown(with event: NSEvent) {
        guard let surface else { return }

        let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)

        // Cmd+= or Cmd++ : increase font size
        if flags.contains(.command), event.charactersIgnoringModifiers == "=" || event.charactersIgnoringModifiers == "+" {
            adjustFontSize(delta: 1)
            return
        }

        // Cmd+- : decrease font size
        if flags.contains(.command), event.charactersIgnoringModifiers == "-" {
            adjustFontSize(delta: -1)
            return
        }

        // Cmd+0 : reset font size
        if flags.contains(.command), event.charactersIgnoringModifiers == "0" {
            resetFontSize()
            return
        }

        // Cmd+C: copy selection
        if flags.contains(.command), event.charactersIgnoringModifiers == "c" {
            if ghostty_surface_has_selection(surface) {
                var textResult = ghostty_text_s()
                if ghostty_surface_read_selection(surface, &textResult), let ptr = textResult.text {
                    let str = String(cString: ptr)
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(str, forType: .string)
                    ghostty_surface_free_text(surface, &textResult)
                }
            }
            return
        }

        // Cmd+V: paste
        if flags.contains(.command), event.charactersIgnoringModifiers == "v" {
            if let text = NSPasteboard.general.string(forType: .string) {
                text.withCString { ptr in
                    ghostty_surface_text(surface, ptr, UInt(text.utf8.count))
                }
            }
            return
        }

        // Track whether insertText was called
        keyTextAccumulator = []
        defer { keyTextAccumulator = nil }

        interpretKeyEvents([event])

        let textInserted = keyTextAccumulator?.isEmpty == false

        if !textInserted && !hasMarkedText() {
            // No text produced (backspace, arrows, enter, escape, ctrl+key, etc.)
            // Send raw key event to ghostty
            var keyEvent = ghostty_input_key_s()
            keyEvent.action = event.isARepeat ? GHOSTTY_ACTION_REPEAT : GHOSTTY_ACTION_PRESS
            keyEvent.keycode = UInt32(event.keyCode)
            keyEvent.mods = modsFromEvent(event)
            keyEvent.composing = false
            keyEvent.text = nil
            if let chars = event.charactersIgnoringModifiers, let scalar = chars.unicodeScalars.first {
                keyEvent.unshifted_codepoint = scalar.value
            }
            _ = ghostty_surface_key(surface, keyEvent)
        }
        // If textInserted: insertText already called ghostty_surface_text
        // If hasMarkedText: setMarkedText already called ghostty_surface_preedit
    }

    override func keyUp(with event: NSEvent) {
        guard let surface else { return }

        var keyEvent = ghostty_input_key_s()
        keyEvent.action = GHOSTTY_ACTION_RELEASE
        keyEvent.keycode = UInt32(event.keyCode)
        keyEvent.mods = modsFromEvent(event)
        keyEvent.text = nil
        keyEvent.composing = false
        _ = ghostty_surface_key(surface, keyEvent)
    }

    override func flagsChanged(with event: NSEvent) {
        guard let surface else { return }

        var keyEvent = ghostty_input_key_s()
        keyEvent.action = GHOSTTY_ACTION_PRESS
        keyEvent.keycode = UInt32(event.keyCode)
        keyEvent.mods = modsFromEvent(event)
        keyEvent.text = nil
        keyEvent.composing = false
        _ = ghostty_surface_key(surface, keyEvent)
    }

    // MARK: - NSTextInputClient (IME)

    func insertText(_ string: Any, replacementRange: NSRange) {
        var chars = ""
        switch string {
        case let v as NSAttributedString: chars = v.string
        case let v as String: chars = v
        default: return
        }
        NSLog("[GhosttyNSView] insertText: '%@'", chars)

        // Clear marked text
        if markedTextStorage.length > 0 {
            markedTextStorage.mutableString.setString("")
            syncPreedit()
        }

        guard !chars.isEmpty, let surface else { return }

        // Mark that text was inserted (for keyDown to know)
        keyTextAccumulator?.append(chars)

        // Send text directly to ghostty — works for both IME and regular input
        chars.withCString { ptr in
            ghostty_surface_text(surface, ptr, UInt(chars.utf8.count))
        }
    }

    func setMarkedText(_ string: Any, selectedRange: NSRange, replacementRange: NSRange) {
        NSLog("[GhosttyNSView] setMarkedText: '%@'", (string as? String) ?? (string as? NSAttributedString)?.string ?? "?")
        switch string {
        case let v as NSAttributedString:
            markedTextStorage = NSMutableAttributedString(attributedString: v)
        case let v as String:
            markedTextStorage = NSMutableAttributedString(string: v)
        default: break
        }

        if keyTextAccumulator == nil {
            syncPreedit()
        }
    }

    func unmarkText() {
        if markedTextStorage.length > 0 {
            markedTextStorage.mutableString.setString("")
            syncPreedit()
        }
    }

    func hasMarkedText() -> Bool {
        return markedTextStorage.length > 0
    }

    func selectedRange() -> NSRange {
        return NSRange(location: NSNotFound, length: 0)
    }

    func markedRange() -> NSRange {
        if markedTextStorage.length > 0 {
            return NSRange(location: 0, length: markedTextStorage.length)
        }
        return NSRange(location: NSNotFound, length: 0)
    }

    func attributedSubstring(forProposedRange range: NSRange, actualRange: NSRangePointer?) -> NSAttributedString? {
        return nil
    }

    func validAttributesForMarkedText() -> [NSAttributedString.Key] {
        return []
    }

    func characterIndex(for point: NSPoint) -> Int {
        return 0
    }

    func firstRect(forCharacterRange range: NSRange, actualRange: NSRangePointer?) -> NSRect {
        guard let surface, let window else {
            return NSRect(x: frame.origin.x, y: frame.origin.y, width: 0, height: 0)
        }
        var x: Double = 0, y: Double = 0, w: Double = 0, h: Double = 0
        ghostty_surface_ime_point(surface, &x, &y, &w, &h)

        let viewRect = NSRect(x: x, y: frame.size.height - y, width: max(w, 1), height: max(h, 20))
        let winRect = convert(viewRect, to: nil)
        return window.convertToScreen(winRect)
    }

    // MARK: - Mouse Events

    override func mouseDown(with event: NSEvent) {
        window?.makeFirstResponder(self)
        guard let surface else { return }
        let loc = convert(event.locationInWindow, from: nil)
        ghostty_surface_mouse_button(surface, GHOSTTY_MOUSE_PRESS, GHOSTTY_MOUSE_LEFT, modsFromEvent(event))
    }

    override func mouseUp(with event: NSEvent) {
        guard let surface else { return }
        ghostty_surface_mouse_button(surface, GHOSTTY_MOUSE_RELEASE, GHOSTTY_MOUSE_LEFT, modsFromEvent(event))
    }

    override func mouseMoved(with event: NSEvent) {
        guard let surface else { return }
        let loc = convert(event.locationInWindow, from: nil)
        ghostty_surface_mouse_pos(surface, loc.x, frame.height - loc.y, modsFromEvent(event))
    }

    override func mouseDragged(with event: NSEvent) {
        guard let surface else { return }
        let loc = convert(event.locationInWindow, from: nil)
        ghostty_surface_mouse_pos(surface, loc.x, frame.height - loc.y, modsFromEvent(event))
    }

    override func scrollWheel(with event: NSEvent) {
        guard let surface else { return }
        let scrollMods: ghostty_input_scroll_mods_t = event.hasPreciseScrollingDeltas ? 1 : 0
        ghostty_surface_mouse_scroll(surface, event.scrollingDeltaX, event.scrollingDeltaY, scrollMods)
    }

    // MARK: - Resize

    override func setFrameSize(_ newSize: NSSize) {
        super.setFrameSize(newSize)
        tryCreateSurface() // surface may not exist yet if split was just created
        guard let surface else { return }
        ghostty_surface_set_size(surface, UInt32(newSize.width), UInt32(newSize.height))
    }

    override func viewDidChangeBackingProperties() {
        super.viewDidChangeBackingProperties()
        guard let surface else { return }
        let scale = window?.backingScaleFactor ?? 2.0
        ghostty_surface_set_content_scale(surface, scale, scale)
    }

    // MARK: - Helpers

    private func syncPreedit() {
        guard let surface else { return }
        if markedTextStorage.length > 0 {
            let str = markedTextStorage.string
            str.withCString { ptr in
                ghostty_surface_preedit(surface, ptr, UInt(str.utf8.count))
            }
        } else {
            ghostty_surface_preedit(surface, nil, 0)
        }
    }

    private func modsFromEvent(_ event: NSEvent) -> ghostty_input_mods_e {
        var mods: UInt32 = GHOSTTY_MODS_NONE.rawValue
        let flags = event.modifierFlags
        if flags.contains(.shift) { mods |= GHOSTTY_MODS_SHIFT.rawValue }
        if flags.contains(.control) { mods |= GHOSTTY_MODS_CTRL.rawValue }
        if flags.contains(.option) { mods |= GHOSTTY_MODS_ALT.rawValue }
        if flags.contains(.command) { mods |= GHOSTTY_MODS_SUPER.rawValue }
        return ghostty_input_mods_e(rawValue: mods)
    }

    // MARK: - Font Size

    private func adjustFontSize(delta: Int) {
        guard let manager else { return }
        fontSizeDelta = max(-8, min(20, fontSizeDelta + delta))
        applyFontSize(manager: manager)
    }

    private func resetFontSize() {
        guard let manager else { return }
        fontSizeDelta = 0
        applyFontSize(manager: manager)
    }

    private func applyFontSize(manager: GhosttyManager) {
        guard manager.config != nil else { return }
        let newSize = baseFontSize + Float(fontSizeDelta)
        guard let newConfig = ghostty_config_new() else { return }
        ghostty_config_load_default_files(newConfig)

        // Write font-size to a temporary config file and load it
        let tmpPath = NSTemporaryDirectory() + "clabs_fontsize_\(paneId).conf"
        let content = "font-size = \(Int(newSize))\n"
        try? content.write(toFile: tmpPath, atomically: true, encoding: .utf8)
        tmpPath.withCString { path in
            ghostty_config_load_file(newConfig, path)
        }
        ghostty_config_finalize(newConfig)
        if let surface {
            ghostty_surface_update_config(surface, newConfig)
        }
        ghostty_config_free(newConfig)
        try? FileManager.default.removeItem(atPath: tmpPath)
        NSLog("[GhosttyNSView] font size: %.0f", newSize)
    }

    // MARK: - Context Menu (right-click)

    override func menu(for event: NSEvent) -> NSMenu? {
        let menu = NSMenu(title: "Terminal")

        let copyItem = NSMenuItem(title: "복사", action: #selector(menuCopy), keyEquivalent: "")
        copyItem.target = self
        menu.addItem(copyItem)

        let pasteItem = NSMenuItem(title: "붙여넣기", action: #selector(menuPaste), keyEquivalent: "")
        pasteItem.target = self
        menu.addItem(pasteItem)

        menu.addItem(.separator())

        let selectAllItem = NSMenuItem(title: "전체 선택", action: #selector(menuSelectAll), keyEquivalent: "")
        selectAllItem.target = self
        menu.addItem(selectAllItem)

        menu.addItem(.separator())

        let fontBigger = NSMenuItem(title: "글자 크게 (Cmd+=)", action: #selector(menuFontIncrease), keyEquivalent: "")
        fontBigger.target = self
        menu.addItem(fontBigger)

        let fontSmaller = NSMenuItem(title: "글자 작게 (Cmd+-)", action: #selector(menuFontDecrease), keyEquivalent: "")
        fontSmaller.target = self
        menu.addItem(fontSmaller)

        let fontReset = NSMenuItem(title: "기본 크기로 (Cmd+0)", action: #selector(menuFontReset), keyEquivalent: "")
        fontReset.target = self
        menu.addItem(fontReset)

        return menu
    }

    @objc private func menuCopy() {
        guard let surface else { return }
        if ghostty_surface_has_selection(surface) {
            var textResult = ghostty_text_s()
            if ghostty_surface_read_selection(surface, &textResult), let ptr = textResult.text {
                let str = String(cString: ptr)
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(str, forType: .string)
                ghostty_surface_free_text(surface, &textResult)
            }
        }
    }

    @objc private func menuPaste() {
        guard let surface, let text = NSPasteboard.general.string(forType: .string) else { return }
        text.withCString { ptr in
            ghostty_surface_text(surface, ptr, UInt(text.utf8.count))
        }
    }

    @objc private func menuSelectAll() {
        // Send Ctrl+A as a terminal select-all convention, or use ghostty binding
        // ghostty does not have a direct select-all API; send the key sequence
        guard let surface else { return }
        var keyEvent = ghostty_input_key_s()
        keyEvent.action = GHOSTTY_ACTION_PRESS
        keyEvent.keycode = 0 // 'a'
        keyEvent.mods = ghostty_input_mods_e(rawValue: GHOSTTY_MODS_CTRL.rawValue)
        keyEvent.composing = false
        keyEvent.text = nil
        _ = ghostty_surface_key(surface, keyEvent)
    }

    @objc private func menuFontIncrease() { adjustFontSize(delta: 1) }
    @objc private func menuFontDecrease() { adjustFontSize(delta: -1) }
    @objc private func menuFontReset() { resetFontSize() }
}
