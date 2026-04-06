import AppKit

// @TASK Phase4A - SettingsWindow: Cmd+, preferences panel backed by AppSettings

// MARK: - SettingsWindow

final class SettingsWindow: NSWindowController {

    // MARK: - Singleton accessor

    static func open() {
        if let existing = _shared {
            existing.window?.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
            return
        }
        let wc = SettingsWindow()
        _shared = wc
        wc.showWindow(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    private static weak var _shared: SettingsWindow?

    // MARK: - Controls

    private var themePopup: NSPopUpButton!
    private var fontSlider: NSSlider!
    private var fontValueLabel: NSTextField!
    private var projectPathField: NSTextField!
    private var defaultCommandField: NSTextField!

    // MARK: - Init

    init() {
        let w = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 480, height: 320),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        w.title = "설정"
        w.center()
        super.init(window: w)
        buildContent()
        loadValues()
    }

    required init?(coder: NSCoder) { fatalError() }

    // MARK: - Build UI

    private func buildContent() {
        guard let root = window?.contentView else { return }
        root.wantsLayer = true
        root.layer?.backgroundColor = NSColor(white: 0.12, alpha: 1).cgColor

        let pad: CGFloat = 24
        let lw: CGFloat  = 160
        let fw: CGFloat  = root.bounds.width - pad * 2 - lw - 8
        var y = root.bounds.height - pad

        // MARK: Title
        y -= 20
        addLabel("일반 설정", x: pad, y: y, w: 200, h: 20,
                 font: .systemFont(ofSize: 14, weight: .semibold), parent: root,
                 color: .white)

        y -= 8
        addSeparator(x: 0, y: y, w: root.bounds.width, parent: root)
        y -= 24

        // MARK: Theme
        y -= 28
        addLabel("테마", x: pad, y: y + 6, w: lw, h: 16, parent: root)
        themePopup = NSPopUpButton(frame: NSRect(x: pad + lw + 8, y: y, width: fw, height: 24))
        themePopup.addItems(withTitles: ThemePresets.all.map { $0.name })
        root.addSubview(themePopup)

        // MARK: Font size
        y -= 36
        addLabel("폰트 크기", x: pad, y: y + 10, w: lw, h: 16, parent: root)
        fontSlider = NSSlider(value: Double(AppSettings.shared.fontSize),
                              minValue: 10, maxValue: 24,
                              target: self,
                              action: #selector(fontSliderChanged))
        fontSlider.frame = NSRect(x: pad + lw + 8, y: y + 4, width: fw - 50, height: 20)
        fontSlider.numberOfTickMarks = 15
        fontSlider.allowsTickMarkValuesOnly = true
        root.addSubview(fontSlider)
        fontValueLabel = NSTextField(labelWithString: "\(AppSettings.shared.fontSize)pt")
        fontValueLabel.frame = NSRect(x: pad + lw + 8 + fw - 44, y: y + 4, width: 44, height: 20)
        fontValueLabel.textColor = .white
        root.addSubview(fontValueLabel)

        // MARK: Default project path
        y -= 36
        addLabel("기본 프로젝트 경로", x: pad, y: y + 6, w: lw, h: 16, parent: root)
        projectPathField = makeTextField(width: fw - 32)
        projectPathField.frame = NSRect(x: pad + lw + 8, y: y, width: fw - 32, height: 22)
        root.addSubview(projectPathField)
        let browseBtn = NSButton(frame: NSRect(x: pad + lw + 8 + fw - 28, y: y, width: 28, height: 22))
        browseBtn.title = "..."
        browseBtn.bezelStyle = .rounded
        browseBtn.target = self
        browseBtn.action = #selector(browsePressed)
        root.addSubview(browseBtn)

        // MARK: Default command
        y -= 36
        addLabel("기본 명령어", x: pad, y: y + 6, w: lw, h: 16, parent: root)
        defaultCommandField = makeTextField(width: fw)
        defaultCommandField.frame = NSRect(x: pad + lw + 8, y: y, width: fw, height: 22)
        defaultCommandField.placeholderString = "InputBox 플레이스홀더"
        root.addSubview(defaultCommandField)

        // MARK: Buttons
        let btnY: CGFloat = pad
        let saveBtn = NSButton(frame: NSRect(x: root.bounds.width - pad - 80, y: btnY, width: 80, height: 26))
        saveBtn.title = "저장"
        saveBtn.bezelStyle = .rounded
        saveBtn.target = self
        saveBtn.action = #selector(savePressed)
        root.addSubview(saveBtn)

        let cancelBtn = NSButton(frame: NSRect(x: root.bounds.width - pad - 80 - 88, y: btnY, width: 80, height: 26))
        cancelBtn.title = "취소"
        cancelBtn.bezelStyle = .rounded
        cancelBtn.target = self
        cancelBtn.action = #selector(cancelPressed)
        root.addSubview(cancelBtn)
    }

    // MARK: - Helpers

    @discardableResult
    private func addLabel(_ text: String, x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat,
                          font: NSFont = .systemFont(ofSize: 13),
                          parent: NSView,
                          color: NSColor = NSColor(white: 0.8, alpha: 1)) -> NSTextField {
        let lbl = NSTextField(labelWithString: text)
        lbl.frame = NSRect(x: x, y: y, width: w, height: h)
        lbl.font = font
        lbl.textColor = color
        parent.addSubview(lbl)
        return lbl
    }

    private func addSeparator(x: CGFloat, y: CGFloat, w: CGFloat, parent: NSView) {
        let sep = NSView(frame: NSRect(x: x, y: y, width: w, height: 1))
        sep.wantsLayer = true
        sep.layer?.backgroundColor = NSColor(white: 0.25, alpha: 1).cgColor
        parent.addSubview(sep)
    }

    private func makeTextField(width: CGFloat) -> NSTextField {
        let f = NSTextField()
        f.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        f.textColor = .white
        f.backgroundColor = NSColor(white: 0.18, alpha: 1)
        f.isBordered = true
        f.focusRingType = .none
        return f
    }

    // MARK: - Load / Save

    private func loadValues() {
        let s = AppSettings.shared

        // Theme popup
        if let idx = ThemePresets.all.firstIndex(where: { $0.id == s.theme }) {
            themePopup.selectItem(at: idx)
        }

        fontSlider.doubleValue = Double(s.fontSize)
        fontValueLabel.stringValue = "\(s.fontSize)pt"
        projectPathField.stringValue = s.defaultProjectPath
        defaultCommandField.stringValue = s.defaultCommand
    }

    // MARK: - Actions

    @objc private func fontSliderChanged() {
        let v = Int(fontSlider.doubleValue)
        fontValueLabel.stringValue = "\(v)pt"
    }

    @objc private func browsePressed() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.canCreateDirectories = false
        panel.prompt = "선택"
        if let w = window {
            panel.beginSheetModal(for: w) { [weak self] response in
                if response == .OK, let url = panel.url {
                    self?.projectPathField.stringValue = url.path
                }
            }
        }
    }

    @objc private func savePressed() {
        let s = AppSettings.shared
        let idx = themePopup.indexOfSelectedItem
        if idx >= 0 && idx < ThemePresets.all.count {
            s.theme = ThemePresets.all[idx].id
            // Apply theme immediately
            ThemeManager.shared.apply(ThemePresets.all[idx])
        }
        s.fontSize = Int(fontSlider.doubleValue)
        s.defaultProjectPath = projectPathField.stringValue
        s.defaultCommand = defaultCommandField.stringValue
        NSLog("[SettingsWindow] settings saved: theme=%@ fontSize=%d", s.theme, s.fontSize)
        close()
    }

    @objc private func cancelPressed() {
        close()
    }
}
