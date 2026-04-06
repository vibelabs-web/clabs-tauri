import AppKit
import CGhostty

// @TASK Phase2B - Bottom command input bar
final class InputBox: NSView {

    // MARK: - Layout constants
    static let defaultHeight: CGFloat = 50

    // MARK: - Colours
    private let bgColor    = NSColor(srgbRed: 0.110, green: 0.133, blue: 0.157, alpha: 1) // #1c2128
    private let borderColor = NSColor(srgbRed: 0.188, green: 0.212, blue: 0.239, alpha: 1) // #30363d
    private let textColor  = NSColor(srgbRed: 0.902, green: 0.929, blue: 0.953, alpha: 1) // #e6edf3
    private let placeholderColor = NSColor(srgbRed: 0.545, green: 0.584, blue: 0.616, alpha: 1) // #8b949e
    private let labelBg    = NSColor(srgbRed: 0.137, green: 0.525, blue: 0.369, alpha: 1) // #238636-ish badge

    // MARK: - Subviews
    private var textField: NSTextField!

    // MARK: - Dependencies (set by MainLayout)
    weak var ghosttyManager: GhosttyManager?
    var activePaneId: String = "pane-main"

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        buildUI()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        buildUI()
    }

    private func buildUI() {
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor

        // Top border
        let topBorder = NSView(frame: NSRect(x: 0, y: bounds.height - 1, width: bounds.width, height: 1))
        topBorder.wantsLayer = true
        topBorder.layer?.backgroundColor = borderColor.cgColor
        topBorder.autoresizingMask = [.width, .minYMargin]
        addSubview(topBorder)

        // "claude" badge label (left side)
        let badge = NSTextField(labelWithString: "claude")
        badge.font = .monospacedSystemFont(ofSize: 11, weight: .semibold)
        badge.textColor = NSColor(srgbRed: 0.345, green: 0.651, blue: 1.0, alpha: 1) // #58a6ff
        badge.frame = NSRect(x: 12, y: (InputBox.defaultHeight - 18) / 2, width: 54, height: 18)
        addSubview(badge)

        // Separator after badge
        let sep = NSView(frame: NSRect(x: 72, y: 10, width: 1, height: 30))
        sep.wantsLayer = true
        sep.layer?.backgroundColor = borderColor.cgColor
        addSubview(sep)

        // Text field
        textField = NSTextField(frame: .zero)
        textField.font = .monospacedSystemFont(ofSize: 13, weight: .regular)
        textField.textColor = textColor
        textField.backgroundColor = .clear
        textField.isBordered = false
        textField.isBezeled = false
        textField.focusRingType = .none
        textField.drawsBackground = false
        textField.placeholderString = "claude --dangerously-skip-permissions"

        // Style placeholder
        let attrs: [NSAttributedString.Key: Any] = [
            .foregroundColor: placeholderColor,
            .font: NSFont.monospacedSystemFont(ofSize: 13, weight: .regular)
        ]
        textField.placeholderAttributedString = NSAttributedString(
            string: "claude --dangerously-skip-permissions",
            attributes: attrs
        )

        textField.delegate = self
        textField.target = self
        textField.action = #selector(submitCommand)
        addSubview(textField)

        // Settings icon button (right side)
        let settingsBtn = NSButton(frame: NSRect(x: 0, y: 0, width: 32, height: 32))
        settingsBtn.bezelStyle = .inline
        settingsBtn.isBordered = false
        settingsBtn.image = NSImage(systemSymbolName: "gear", accessibilityDescription: "Settings")
        settingsBtn.contentTintColor = placeholderColor
        settingsBtn.target = self
        settingsBtn.action = #selector(openSettings)
        addSubview(settingsBtn)

        layoutSubviews()
    }

    private func layoutSubviews() {
        let h = bounds.height
        let w = bounds.width

        let fieldX: CGFloat = 80
        let settingsBtnWidth: CGFloat = 40
        let fieldWidth = w - fieldX - settingsBtnWidth - 8
        textField.frame = NSRect(x: fieldX, y: (h - 22) / 2, width: max(fieldWidth, 100), height: 22)

        // Settings button aligned right
        if let settingsBtn = subviews.last(where: { ($0 as? NSButton) != nil }) {
            settingsBtn.frame = NSRect(x: w - settingsBtnWidth - 4, y: (h - 32) / 2, width: 32, height: 32)
        }

        // Top border full width
        if let topBorder = subviews.first(where: { $0.frame.height == 1 }) {
            topBorder.frame = NSRect(x: 0, y: h - 1, width: w, height: 1)
        }
    }

    override func setFrameSize(_ newSize: NSSize) {
        super.setFrameSize(newSize)
        layoutSubviews()
    }

    // MARK: - Actions

    @objc private func submitCommand() {
        guard let text = textField.stringValue.nonEmpty else { return }
        CommandHistory.shared.add(text)
        sendToTerminal(text + "\n")
        textField.stringValue = ""
    }

    /// Insert text into the input field (called from sidebar skill click)
    func insertText(_ text: String) {
        textField.stringValue = text
        mainWindow?.makeFirstResponder(textField)
    }

    private var mainWindow: NSWindow? {
        return window
    }

    @objc private func openSettings() {
        NSLog("[InputBox] settings tapped (not implemented)")
    }

    // MARK: - Terminal send

    private func sendToTerminal(_ text: String) {
        guard let manager = ghosttyManager else {
            NSLog("[InputBox] no ghosttyManager")
            return
        }
        guard let surface = manager.surface(for: activePaneId) else {
            NSLog("[InputBox] surface not found for pane: %@", activePaneId)
            return
        }
        text.withCString { ptr in
            ghostty_surface_text(surface, ptr, UInt(text.utf8.count))
        }
        NSLog("[InputBox] sent: %@", text)
    }
}

// MARK: - NSTextFieldDelegate

extension InputBox: NSTextFieldDelegate {
    func control(_ control: NSControl, textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
        if commandSelector == #selector(NSResponder.insertNewline(_:)) {
            submitCommand()
            return true
        }
        return false
    }
}

// MARK: - String helper

private extension String {
    var nonEmpty: String? { isEmpty ? nil : self }
}
