import AppKit

// @TASK Phase4A - CLIBuilderView: GUI for composing claude CLI flags
// @SPEC src/renderer/components/terminal/CommandBuilder.tsx

// MARK: - CLIBuilderDelegate

protocol CLIBuilderDelegate: AnyObject {
    /// User pressed "실행" — insert command and send
    func cliBuilder(_ view: CLIBuilderView, didExecute command: String)
}

// MARK: - CLIBuilderView

final class CLIBuilderView: NSView {

    // MARK: - Public

    weak var delegate: CLIBuilderDelegate?

    // MARK: - Constants

    private let rowHeight: CGFloat = 28
    private let labelWidth: CGFloat = 180
    private let padding: CGFloat = 16

    // MARK: - Theme colours

    private var bgColor: NSColor      = ThemePresets.defaultDark.ui.bgSecondary
    private var bgTertiary: NSColor   = ThemePresets.defaultDark.ui.bgTertiary
    private var borderColor: NSColor  = ThemePresets.defaultDark.ui.border
    private var textPrimary: NSColor  = ThemePresets.defaultDark.ui.textPrimary
    private var textSecondary: NSColor = ThemePresets.defaultDark.ui.textSecondary
    private var accentColor: NSColor  = ThemePresets.defaultDark.ui.accent

    // MARK: - Flag state

    private var skipPermissions = false
    private var model: String = ""
    private var maxTurns: String = ""
    private var systemPrompt: String = ""
    private var allowedTools: String = ""
    private var verbose = false
    private var noCache = false

    // MARK: - Controls (kept for value extraction)

    private var skipPermissionsCheck: NSButton!
    private var modelPopup: NSPopUpButton!
    private var maxTurnsField: NSTextField!
    private var systemPromptField: NSTextField!
    private var allowedToolsField: NSTextField!
    private var verboseCheck: NSButton!
    private var noCacheCheck: NSButton!
    private var previewLabel: NSTextField!

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        setupViews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupViews()
    }

    // MARK: - Theme

    func applyTheme(_ theme: Theme) {
        bgColor       = theme.ui.bgSecondary
        bgTertiary    = theme.ui.bgTertiary
        borderColor   = theme.ui.border
        textPrimary   = theme.ui.textPrimary
        textSecondary = theme.ui.textSecondary
        accentColor   = theme.ui.accent
        layer?.backgroundColor = bgColor.cgColor
        setupViews()
    }

    // MARK: - Layout

    private func setupViews() {
        subviews.forEach { $0.removeFromSuperview() }
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor

        var y = bounds.height - 8

        // Title
        y -= 24
        addLabel("CLI 명령어 빌더", x: padding, y: y, w: 200, h: 20, font: .systemFont(ofSize: 13, weight: .semibold), color: textPrimary)

        y -= 4
        addSeparator(y: y)
        y -= 12

        // --dangerously-skip-permissions
        y -= rowHeight
        skipPermissionsCheck = addCheckbox("--dangerously-skip-permissions", x: padding, y: y)
        skipPermissionsCheck.target = self
        skipPermissionsCheck.action = #selector(flagChanged)

        // --verbose
        y -= rowHeight
        verboseCheck = addCheckbox("--verbose", x: padding, y: y)
        verboseCheck.target = self
        verboseCheck.action = #selector(flagChanged)

        // --no-cache
        y -= rowHeight
        noCacheCheck = addCheckbox("--no-cache", x: padding, y: y)
        noCacheCheck.target = self
        noCacheCheck.action = #selector(flagChanged)

        y -= 12
        addSeparator(y: y)
        y -= 12

        // --model
        y -= rowHeight
        addLabel("--model", x: padding, y: y + 6, w: labelWidth, h: 16, font: .monospacedSystemFont(ofSize: 12, weight: .regular), color: textPrimary)
        modelPopup = NSPopUpButton(frame: NSRect(x: padding + labelWidth, y: y, width: bounds.width - padding * 2 - labelWidth, height: 24))
        modelPopup.bezelStyle = .roundRect
        modelPopup.addItems(withTitles: ["(선택 안 함)", "claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5",
                                          "claude-opus-4", "claude-sonnet-4"])
        styleControl(modelPopup)
        modelPopup.target = self
        modelPopup.action = #selector(flagChanged)
        addSubview(modelPopup)

        // --max-turns
        y -= rowHeight + 4
        addLabel("--max-turns", x: padding, y: y + 6, w: labelWidth, h: 16, font: .monospacedSystemFont(ofSize: 12, weight: .regular), color: textPrimary)
        maxTurnsField = makeTextField(placeholder: "숫자 (예: 10)")
        maxTurnsField.frame = NSRect(x: padding + labelWidth, y: y, width: 80, height: 22)
        addSubview(maxTurnsField)

        // --system-prompt
        y -= rowHeight + 4
        addLabel("--system-prompt", x: padding, y: y + 6, w: labelWidth, h: 16, font: .monospacedSystemFont(ofSize: 12, weight: .regular), color: textPrimary)
        systemPromptField = makeTextField(placeholder: "시스템 프롬프트")
        systemPromptField.frame = NSRect(x: padding + labelWidth, y: y, width: bounds.width - padding * 2 - labelWidth, height: 22)
        addSubview(systemPromptField)

        // --allowedTools
        y -= rowHeight + 4
        addLabel("--allowedTools", x: padding, y: y + 6, w: labelWidth, h: 16, font: .monospacedSystemFont(ofSize: 12, weight: .regular), color: textPrimary)
        allowedToolsField = makeTextField(placeholder: "예: Bash,Read,Edit")
        allowedToolsField.frame = NSRect(x: padding + labelWidth, y: y, width: bounds.width - padding * 2 - labelWidth, height: 22)
        addSubview(allowedToolsField)

        y -= 16
        addSeparator(y: y)
        y -= 12

        // Preview
        y -= 20
        addLabel("미리보기", x: padding, y: y, w: 100, h: 16, font: .systemFont(ofSize: 11, weight: .medium), color: textSecondary)
        y -= 36
        previewLabel = NSTextField(frame: NSRect(x: padding, y: y, width: bounds.width - padding * 2, height: 32))
        previewLabel.isEditable = false
        previewLabel.isSelectable = true
        previewLabel.isBordered = true
        previewLabel.wantsLayer = true
        previewLabel.layer?.cornerRadius = 4
        previewLabel.backgroundColor = bgTertiary
        previewLabel.textColor = accentColor
        previewLabel.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
        previewLabel.cell?.lineBreakMode = .byTruncatingHead
        previewLabel.stringValue = buildPreview()
        addSubview(previewLabel)

        // Buttons
        let btnY: CGFloat = 12
        let btnW: CGFloat = 70

        let executeBtn = NSButton(frame: NSRect(x: bounds.width - padding - btnW, y: btnY, width: btnW, height: 26))
        executeBtn.title = "실행"
        executeBtn.bezelStyle = .rounded
        executeBtn.target = self
        executeBtn.action = #selector(executePressed)
        styleAccentButton(executeBtn)
        executeBtn.autoresizingMask = [.minXMargin, .maxYMargin]
        addSubview(executeBtn)

        let copyBtn = NSButton(frame: NSRect(x: bounds.width - padding - btnW * 2 - 8, y: btnY, width: btnW, height: 26))
        copyBtn.title = "복사"
        copyBtn.bezelStyle = .rounded
        copyBtn.target = self
        copyBtn.action = #selector(copyPressed)
        copyBtn.autoresizingMask = [.minXMargin, .maxYMargin]
        addSubview(copyBtn)

        let resetBtn = NSButton(frame: NSRect(x: bounds.width - padding - btnW * 3 - 16, y: btnY, width: btnW, height: 26))
        resetBtn.title = "초기화"
        resetBtn.bezelStyle = .rounded
        resetBtn.target = self
        resetBtn.action = #selector(resetPressed)
        resetBtn.autoresizingMask = [.minXMargin, .maxYMargin]
        addSubview(resetBtn)
    }

    // MARK: - Helper builders

    @discardableResult
    private func addLabel(_ text: String, x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
                          font: NSFont, color: NSColor) -> NSTextField {
        let lbl = NSTextField(labelWithString: text)
        lbl.frame = NSRect(x: x, y: y, width: w, height: h)
        lbl.font = font
        lbl.textColor = color
        lbl.autoresizingMask = [.width]
        addSubview(lbl)
        return lbl
    }

    private func addSeparator(y: CGFloat) {
        let sep = NSView(frame: NSRect(x: 0, y: y, width: bounds.width, height: 1))
        sep.wantsLayer = true
        sep.layer?.backgroundColor = borderColor.withAlphaComponent(0.5).cgColor
        sep.autoresizingMask = [.width]
        addSubview(sep)
    }

    @discardableResult
    private func addCheckbox(_ title: String, x: CGFloat, y: CGFloat) -> NSButton {
        let cb = NSButton(frame: NSRect(x: x, y: y + 4, width: bounds.width - x * 2, height: 20))
        cb.setButtonType(.switch)
        cb.title = title
        cb.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        cb.contentTintColor = accentColor
        cb.autoresizingMask = [.width]
        addSubview(cb)
        return cb
    }

    private func makeTextField(placeholder: String) -> NSTextField {
        let f = NSTextField()
        f.placeholderString = placeholder
        f.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
        f.textColor = textPrimary
        f.backgroundColor = bgTertiary
        f.isBordered = true
        f.wantsLayer = true
        f.layer?.cornerRadius = 4
        f.focusRingType = .none
        f.delegate = self
        return f
    }

    private func styleControl(_ control: NSControl) {
        control.font = .monospacedSystemFont(ofSize: 11, weight: .regular)
    }

    private func styleAccentButton(_ btn: NSButton) {
        btn.wantsLayer = true
        btn.layer?.backgroundColor = accentColor.cgColor
        btn.layer?.cornerRadius = 5
        btn.contentTintColor = NSColor.black
        btn.isBordered = false
    }

    // MARK: - Command builder

    private func buildPreview() -> String {
        var parts = ["claude"]

        if skipPermissionsCheck?.state == .on {
            parts.append("--dangerously-skip-permissions")
        }
        if verboseCheck?.state == .on {
            parts.append("--verbose")
        }
        if noCacheCheck?.state == .on {
            parts.append("--no-cache")
        }

        let sel = modelPopup?.titleOfSelectedItem ?? ""
        if !sel.isEmpty && sel != "(선택 안 함)" {
            parts.append("--model \(sel)")
        }

        let turns = maxTurnsField?.stringValue.trimmingCharacters(in: .whitespaces) ?? ""
        if !turns.isEmpty {
            parts.append("--max-turns \(turns)")
        }

        let sysPrompt = systemPromptField?.stringValue.trimmingCharacters(in: .whitespaces) ?? ""
        if !sysPrompt.isEmpty {
            parts.append("--system-prompt \"\(sysPrompt)\"")
        }

        let tools = allowedToolsField?.stringValue.trimmingCharacters(in: .whitespaces) ?? ""
        if !tools.isEmpty {
            parts.append("--allowedTools \(tools)")
        }

        return parts.joined(separator: " ")
    }

    private func refreshPreview() {
        previewLabel?.stringValue = buildPreview()
    }

    // MARK: - Actions

    @objc private func flagChanged() {
        refreshPreview()
    }

    @objc private func executePressed() {
        let cmd = buildPreview()
        delegate?.cliBuilder(self, didExecute: cmd)
    }

    @objc private func copyPressed() {
        let cmd = buildPreview()
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(cmd, forType: .string)
    }

    @objc private func resetPressed() {
        skipPermissionsCheck?.state = .off
        verboseCheck?.state = .off
        noCacheCheck?.state = .off
        modelPopup?.selectItem(at: 0)
        maxTurnsField?.stringValue = ""
        systemPromptField?.stringValue = ""
        allowedToolsField?.stringValue = ""
        refreshPreview()
    }
}

// MARK: - NSTextFieldDelegate

extension CLIBuilderView: NSTextFieldDelegate {
    func controlTextDidChange(_ obj: Notification) {
        refreshPreview()
    }
}
