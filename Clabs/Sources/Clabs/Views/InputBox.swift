import AppKit
import CGhostty

// @TASK Phase3C - InputBox: autocomplete (slash/history/path) + ghost text + multiline modal

// MARK: - DropdownMode

private enum DropdownMode {
    case none, slash, history, path
}

// MARK: - InputBox

final class InputBox: NSView {

    // MARK: - Layout constants
    static let defaultHeight: CGFloat = 48

    // MARK: - Colours (mutable for theme support)
    private var bgColor: NSColor          = ThemePresets.githubDark.ui.bgTertiary
    private var fieldBgColor: NSColor     = ThemePresets.githubDark.ui.bgPrimary
    private var borderColor: NSColor      = ThemePresets.githubDark.ui.border
    private var textColor: NSColor        = ThemePresets.githubDark.ui.textPrimary
    private var placeholderColor: NSColor = ThemePresets.githubDark.ui.textSecondary
    private var accentColor: NSColor      = ThemePresets.githubDark.ui.accent
    private var ghostColor: NSColor       = ThemePresets.githubDark.ui.textSecondary.withAlphaComponent(0.7)

    // MARK: - Subviews
    private(set) var textField: NSTextField!
    private var ghostTextField: NSTextField!

    // MARK: - Autocomplete
    private var dropdown: AutocompleteDropdown?
    private var dropdownMode: DropdownMode = .none

    // MARK: - Skills cache
    private var skillItems: [DropdownItem] = []

    // MARK: - Ghost text
    private var ghostText: String = "" {
        didSet { ghostTextField?.stringValue = ghostText }
    }

    // MARK: - Click to focus

    override func mouseDown(with event: NSEvent) {
        super.mouseDown(with: event)
        window?.makeFirstResponder(textField)
        NSLog("[InputBox] mouseDown → makeFirstResponder(textField), result=%d", window?.firstResponder === textField.currentEditor() ? 1 : 0)
    }

    // MARK: - Dependencies
    weak var ghosttyManager: GhosttyManager?
    var activePaneId: String = "" {
        didSet {
            NSLog("[InputBox] activePaneId set to: %@", activePaneId)
        }
    }

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        buildUI()
        loadSkills()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        buildUI()
        loadSkills()
    }

    // MARK: - Build UI

    private func buildUI() {
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor

        // Top border
        let topBorder = NSView(frame: NSRect(x: 0, y: bounds.height - 1, width: bounds.width, height: 1))
        topBorder.wantsLayer = true
        topBorder.layer?.backgroundColor = borderColor.cgColor
        topBorder.autoresizingMask = [.width, .minYMargin]
        addSubview(topBorder)

        // "claude" badge — accent colored, pill shape
        let badge = PillBadgeView(label: "claude", textColor: accentColor, bgColor: accentColor.withAlphaComponent(0.12))
        badge.frame = NSRect(x: 10, y: (InputBox.defaultHeight - 20) / 2, width: 56, height: 20)
        addSubview(badge)

        // Ghost text field (drawn before main field — appears behind typed text)
        ghostTextField = NSTextField(frame: .zero)
        ghostTextField.font = .monospacedSystemFont(ofSize: 13, weight: .regular)
        ghostTextField.textColor = ghostColor
        ghostTextField.backgroundColor = .clear
        ghostTextField.isBordered = false
        ghostTextField.isBezeled = false
        ghostTextField.focusRingType = .none
        ghostTextField.drawsBackground = false
        ghostTextField.isEditable = false
        ghostTextField.isSelectable = false
        addSubview(ghostTextField)

        // Text field container (rounded bg)
        let fieldContainer = NSView(frame: .zero)
        fieldContainer.wantsLayer = true
        fieldContainer.layer?.backgroundColor = fieldBgColor.cgColor
        fieldContainer.layer?.cornerRadius = 8
        fieldContainer.layer?.borderWidth = 1
        fieldContainer.layer?.borderColor = borderColor.withAlphaComponent(0.5).cgColor
        addSubview(fieldContainer)

        // Main text field
        textField = NSTextField(frame: .zero)
        textField.font = .monospacedSystemFont(ofSize: 13, weight: .regular)
        textField.textColor = textColor
        textField.backgroundColor = .clear
        textField.isBordered = false
        textField.isEditable = true
        textField.isSelectable = true
        textField.isBezeled = false
        textField.focusRingType = .none
        textField.drawsBackground = false

        let attrs: [NSAttributedString.Key: Any] = [
            .foregroundColor: placeholderColor,
            .font: NSFont.monospacedSystemFont(ofSize: 13, weight: .regular),
        ]
        textField.placeholderAttributedString = NSAttributedString(
            string: "claude --dangerously-skip-permissions",
            attributes: attrs
        )

        textField.delegate = self
        textField.target = self
        textField.action = #selector(submitCommand)
        fieldContainer.addSubview(textField)
        fieldContainer.addSubview(ghostTextField)

        // Send button — accent tint
        let settingsBtn = NSButton(frame: NSRect(x: 0, y: 0, width: 28, height: 28))
        settingsBtn.bezelStyle = .inline
        settingsBtn.isBordered = false
        settingsBtn.image = NSImage(systemSymbolName: "arrow.up.circle.fill", accessibilityDescription: "Send")
        settingsBtn.contentTintColor = accentColor
        settingsBtn.target = self
        settingsBtn.action = #selector(openSettings)
        addSubview(settingsBtn)

        layoutSubviews()
    }

    private func layoutSubviews() {
        let h = bounds.height
        let w = bounds.width
        let badgeW: CGFloat = 56
        let badgeX: CGFloat = 10
        let sendBtnW: CGFloat = 28
        let padding: CGFloat = 8
        let containerX = badgeX + badgeW + 6
        let containerW = max(w - containerX - sendBtnW - padding * 2, 100)
        let containerH: CGFloat = 32
        let containerY = (h - containerH) / 2

        // Top border
        if let topBorder = subviews.first(where: { $0.frame.height == 1 }) {
            topBorder.frame = NSRect(x: 0, y: h - 1, width: w, height: 1)
        }

        // badge
        if let badge = subviews.first(where: { $0 is PillBadgeView }) {
            badge.frame = NSRect(x: badgeX, y: (h - 20) / 2, width: badgeW, height: 20)
        }

        // fieldContainer
        if let container = subviews.first(where: { !($0 is NSButton) && !($0 is PillBadgeView) && $0.frame.height != 1 }) {
            container.frame = NSRect(x: containerX, y: containerY, width: containerW, height: containerH)
            let innerX: CGFloat = 8
            let innerW = max(containerW - innerX - 4, 50)
            let innerY = (containerH - 20) / 2
            ghostTextField.frame = NSRect(x: innerX, y: innerY, width: innerW, height: 20)
            textField.frame      = NSRect(x: innerX, y: innerY, width: innerW, height: 20)
        }

        // Send button
        if let btn = subviews.last(where: { $0 is NSButton }) {
            btn.frame = NSRect(x: w - sendBtnW - padding, y: (h - sendBtnW) / 2, width: sendBtnW, height: sendBtnW)
        }
    }

    override func setFrameSize(_ newSize: NSSize) {
        super.setFrameSize(newSize)
        layoutSubviews()
    }

    // MARK: - Skills loading

    private func loadSkills() {
        let skills = SkillScanner.scan()
        skillItems = skills.map { skill in
            DropdownItem(
                label: "/" + skill.name,
                description: skill.description,
                value: "/" + skill.name + " ",
                icon: .slashSkill
            )
        }
    }

    // MARK: - Autocomplete: slash

    private func handleSlashAutocomplete(query: String) {
        let q = query.lowercased()

        let builtins: [DropdownItem] = [
            DropdownItem(label: "/help",    description: "도움말 표시",              value: "/help ",    icon: .slashBuiltin),
            DropdownItem(label: "/clear",   description: "화면 지우기",              value: "/clear ",   icon: .slashBuiltin),
            DropdownItem(label: "/exit",    description: "종료",                    value: "/exit ",    icon: .slashBuiltin),
            DropdownItem(label: "/compact", description: "컨텍스트 요약 후 초기화", value: "/compact ", icon: .slashBuiltin),
        ]

        let all = skillItems + builtins
        let filtered = q == "/" ? all : all.filter { $0.label.lowercased().hasPrefix(q) }

        if filtered.isEmpty {
            closeDropdown()
        } else {
            showDropdown(items: filtered, mode: .slash)
        }
    }

    // MARK: - Autocomplete: history

    private func handleHistoryDropdown() {
        let entries = CommandHistory.shared.list(limit: 20)
        guard !entries.isEmpty else { return }

        let items = entries.map { entry in
            DropdownItem(
                label: entry.command,
                description: formatTimeAgo(entry.timestamp),
                value: entry.command,
                icon: .history
            )
        }
        showDropdown(items: items, mode: .history)
    }

    // MARK: - Autocomplete: file path (Tab)

    private func handlePathCompletion() {
        let text = textField.stringValue
        let tokens = text.components(separatedBy: .whitespaces).filter { !$0.isEmpty }
        guard let lastToken = tokens.last, !lastToken.isEmpty else { return }

        let cmdPrefix = tokens.dropLast().joined(separator: " ")

        let cwd = FileManager.default.currentDirectoryPath
        let lastSlash = lastToken.lastIndex(of: "/")

        let searchDir: String
        let filePrefix: String
        let tokenBase: String

        if let slashIdx = lastSlash {
            let afterSlash = lastToken.index(after: slashIdx)
            let dirPart = String(lastToken[..<slashIdx])
            filePrefix = String(lastToken[afterSlash...])
            tokenBase = String(lastToken[...slashIdx])
            searchDir = dirPart.hasPrefix("/") ? dirPart : (cwd + "/" + dirPart)
        } else {
            searchDir = cwd
            filePrefix = lastToken
            tokenBase = ""
        }

        guard !filePrefix.isEmpty else { return }
        guard let entries = try? FileManager.default.contentsOfDirectory(atPath: searchDir) else { return }

        let matches = entries
            .filter { $0.lowercased().hasPrefix(filePrefix.lowercased()) }
            .sorted()
        guard !matches.isEmpty else { return }

        var isDir: ObjCBool = false
        let items = matches.map { name -> DropdownItem in
            let fullPath = searchDir + "/" + name
            FileManager.default.fileExists(atPath: fullPath, isDirectory: &isDir)
            let suffix = isDir.boolValue ? "/" : " "
            let newValue = cmdPrefix.isEmpty
                ? tokenBase + name + suffix
                : cmdPrefix + " " + tokenBase + name + suffix
            return DropdownItem(
                label: name,
                description: isDir.boolValue ? "폴더" : "파일",
                value: newValue,
                icon: isDir.boolValue ? .folder : .file
            )
        }

        if items.count == 1 {
            textField.stringValue = items[0].value
            ghostText = ""
        } else {
            showDropdown(items: items, mode: .path)
        }
    }

    // MARK: - Dropdown management

    private func showDropdown(items: [DropdownItem], mode: DropdownMode) {
        dropdownMode = mode

        if dropdown == nil {
            let dd = AutocompleteDropdown(frame: .zero)
            dd.delegate = self
            window?.contentView?.addSubview(dd)
            dropdown = dd
        }

        dropdown?.reload(items: items)
        repositionDropdown()
        dropdown?.isHidden = false
    }

    private func repositionDropdown() {
        guard let dd = dropdown, let windowView = window?.contentView else { return }

        let inputOriginInWindow = convert(NSPoint(x: 0, y: bounds.maxY), to: windowView)
        let ddW = AutocompleteDropdown.width
        let ddH = dd.frame.height
        let x = min(inputOriginInWindow.x + 80, windowView.bounds.width - ddW - 8)
        let y = inputOriginInWindow.y + 4

        dd.frame = NSRect(x: x, y: y, width: ddW, height: ddH)
    }

    func closeDropdown() {
        dropdown?.isHidden = true
        dropdownMode = .none
        ghostText = ""
    }

    // MARK: - Multiline modal (Cmd+Enter)

    private func openMultilineModal() {
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: 640, height: 320),
            styleMask: [.titled, .closable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        panel.title = "확장 입력"
        panel.isFloatingPanel = true
        panel.center()

        let tv = NSTextView(frame: .zero)
        tv.font = .monospacedSystemFont(ofSize: 13, weight: .regular)
        tv.textColor = textColor
        tv.backgroundColor = bgColor
        tv.isRichText = false
        tv.string = textField.stringValue

        let sv = NSScrollView(frame: panel.contentView!.bounds)
        sv.autoresizingMask = [.width, .height]
        sv.documentView = tv
        sv.hasVerticalScroller = true
        panel.contentView?.addSubview(sv)

        objc_setAssociatedObject(panel, &InputBox.tvKey, tv, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)

        window?.beginSheet(panel) { [weak self, weak panel] _ in
            guard
                let self,
                let panel,
                let storedTV = objc_getAssociatedObject(panel, &InputBox.tvKey) as? NSTextView
            else { return }
            let text = storedTV.string
            if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                self.textField.stringValue = text
                self.submitCommand()
            }
        }
    }

    private static var tvKey: UInt8 = 0

    // MARK: - Theme

    func applyTheme(_ theme: Theme) {
        bgColor          = theme.ui.bgTertiary
        fieldBgColor     = theme.ui.bgPrimary
        borderColor      = theme.ui.border
        textColor        = theme.ui.textPrimary
        placeholderColor = theme.ui.textSecondary
        accentColor      = theme.ui.accent
        ghostColor       = theme.ui.textSecondary.withAlphaComponent(0.7)

        layer?.backgroundColor = bgColor.cgColor
        textField?.textColor   = textColor
        ghostTextField?.textColor = ghostColor

        let attrs: [NSAttributedString.Key: Any] = [
            .foregroundColor: placeholderColor,
            .font: NSFont.monospacedSystemFont(ofSize: 13, weight: .regular),
        ]
        textField?.placeholderAttributedString = NSAttributedString(
            string: "claude --dangerously-skip-permissions",
            attributes: attrs
        )
        needsDisplay = true
    }

    // MARK: - Submit

    /// Public entry point for programmatic submit
    func triggerSubmit() { submitCommand() }

    @objc private func submitCommand() {
        var raw = textField.stringValue.trimmingCharacters(in: .whitespacesAndNewlines)
        if raw.isEmpty {
            raw = "claude --dangerously-skip-permissions"
        }

        CommandHistory.shared.add(raw)
        // Send text + \r together (ghostty forwards to PTY)
        sendToTerminal(raw + "\r")
        textField.stringValue = ""
        ghostText = ""
        closeDropdown()
    }

    /// Insert text into the input field (called from sidebar skill click).
    func insertText(_ text: String) {
        textField.stringValue = text
        window?.makeFirstResponder(textField)
    }

    @objc private func openSettings() {
        submitCommand()
    }

    // MARK: - Terminal send

    private func sendToTerminal(_ text: String) {
        guard let manager = ghosttyManager else {
            NSLog("[InputBox] no ghosttyManager"); return
        }
        // Try activePaneId first, fall back to any available surface
        var surface = manager.surface(for: activePaneId)
        if surface == nil {
            // activePaneId might be stale — try first available
            if let firstSurface = manager.firstSurface() {
                surface = firstSurface
                NSLog("[InputBox] using fallback surface (activePaneId '%@' not found)", activePaneId)
            }
        }
        guard let surface else {
            NSLog("[InputBox] no surface available at all"); return
        }
        text.withCString { ptr in
            ghostty_surface_text(surface, ptr, UInt(text.utf8.count))
        }
        NSLog("[InputBox] sent: %@", text)
    }

    private func sendEnterKey() {
        sendToTerminal("\r\n")
    }

    private func sendEnterSafe() {
        guard let manager = ghosttyManager else { return }
        let surface = manager.surface(for: activePaneId) ?? manager.firstSurface()
        guard let surface else { return }

        let ptr = UnsafeMutablePointer<ghostty_input_key_s>.allocate(capacity: 1)
        defer { ptr.deallocate() }
        memset(ptr, 0, MemoryLayout<ghostty_input_key_s>.size)
        ptr.pointee.action = GHOSTTY_ACTION_PRESS
        ptr.pointee.keycode = 36
        ptr.pointee.mods = GHOSTTY_MODS_NONE
        ptr.pointee.consumed_mods = GHOSTTY_MODS_NONE
        ptr.pointee.text = nil
        _ = ghostty_surface_key(surface, ptr.pointee)
    }
}

// MARK: - NSTextFieldDelegate

extension InputBox: NSTextFieldDelegate {

    func control(
        _ control: NSControl,
        textView: NSTextView,
        doCommandBy commandSelector: Selector
    ) -> Bool {

        // Cmd+Enter → multiline modal
        if commandSelector == #selector(NSResponder.insertNewline(_:)),
           NSApp.currentEvent?.modifierFlags.contains(.command) == true {
            openMultilineModal()
            return true
        }

        // Enter
        if commandSelector == #selector(NSResponder.insertNewline(_:)) {
            if dropdownMode != .none {
                dropdown?.confirmSelection()
            } else {
                submitCommand()
            }
            return true
        }

        // Tab
        if commandSelector == #selector(NSResponder.insertTab(_:)) {
            if dropdownMode != .none {
                dropdown?.confirmSelection()
            } else if !ghostText.isEmpty {
                textField.stringValue = ghostText
                ghostText = ""
            } else {
                handlePathCompletion()
            }
            return true
        }

        // Escape
        if commandSelector == #selector(NSResponder.cancelOperation(_:)) {
            if dropdownMode != .none {
                closeDropdown()
                return true
            }
            return false
        }

        // Arrow Up
        if commandSelector == #selector(NSResponder.moveUp(_:)) {
            if dropdownMode == .none {
                handleHistoryDropdown()
            } else {
                dropdown?.moveSelection(by: -1)
            }
            return true
        }

        // Arrow Down
        if commandSelector == #selector(NSResponder.moveDown(_:)) {
            if dropdownMode != .none {
                dropdown?.moveSelection(by: 1)
                return true
            }
            return false
        }

        return false
    }

    func controlTextDidChange(_ obj: Notification) {
        let text = textField.stringValue
        ghostText = ""

        if text.hasPrefix("/") {
            handleSlashAutocomplete(query: text)
        } else if dropdownMode == .slash || dropdownMode == .history || dropdownMode == .path {
            closeDropdown()
        }
    }
}

// MARK: - AutocompleteDropdownDelegate

extension InputBox: AutocompleteDropdownDelegate {

    func dropdown(_ dropdown: AutocompleteDropdown, didSelect item: DropdownItem) {
        textField.stringValue = item.value
        closeDropdown()
        window?.makeFirstResponder(textField)
    }

    func dropdownDidClose(_ dropdown: AutocompleteDropdown) {
        closeDropdown()
    }
}

// MARK: - PillBadgeView

final class PillBadgeView: NSView {

    private let labelField: NSTextField

    init(label: String, textColor: NSColor, bgColor: NSColor) {
        labelField = NSTextField(labelWithString: label)
        super.init(frame: .zero)
        wantsLayer = true
        layer?.cornerRadius = 4
        layer?.backgroundColor = bgColor.cgColor
        labelField.font = .monospacedSystemFont(ofSize: 10, weight: .semibold)
        labelField.textColor = textColor
        labelField.alignment = .center
        addSubview(labelField)
    }

    required init?(coder: NSCoder) { fatalError() }

    override func layout() {
        super.layout()
        labelField.frame = bounds.insetBy(dx: 4, dy: 2)
    }
}

// MARK: - String helper

private extension String {
    var nonEmpty: String? { isEmpty ? nil : self }
}

// MARK: - Time formatting

private func formatTimeAgo(_ date: Date) -> String {
    let diff = Date().timeIntervalSince(date)
    switch diff {
    case ..<60:    return "방금"
    case ..<3600:  return "\(Int(diff / 60))분 전"
    case ..<86400: return "\(Int(diff / 3600))시간 전"
    default:       return "\(Int(diff / 86400))일 전"
    }
}
