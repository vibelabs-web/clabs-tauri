import AppKit

// @TASK Phase4B - Bottom status bar (context, usage, task timer)
// @SPEC src/renderer/components/layout/StatusBar.tsx

final class StatusBar: NSView {

    // MARK: - Layout

    static let defaultHeight: CGFloat = 22

    // MARK: - Colors

    private var bgColor: NSColor     = ThemePresets.githubDark.ui.bgPrimary
    private var textColor: NSColor   = ThemePresets.githubDark.ui.textSecondary
    private var accentColor: NSColor = ThemePresets.githubDark.ui.accent

    // MARK: - Labels

    private var contextLabel: NSTextField!
    private var usageLabel: NSTextField!
    private var taskLabel: NSTextField!
    private var separatorLine: NSView!

    // MARK: - State

    private var taskStartDate: Date?
    private var taskTimer: Timer?

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        setupViews()
        startTaskTimer()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupViews()
        startTaskTimer()
    }

    // MARK: - Setup

    private func setupViews() {
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor

        // Top separator line (1px)
        separatorLine = NSView(frame: NSRect(x: 0, y: bounds.height - 1, width: bounds.width, height: 1))
        separatorLine.wantsLayer = true
        separatorLine.layer?.backgroundColor = ThemePresets.githubDark.ui.border.cgColor
        separatorLine.autoresizingMask = [.width, .minYMargin]
        addSubview(separatorLine)

        let fontSize: CGFloat = 10
        let font = NSFont.monospacedSystemFont(ofSize: fontSize, weight: .regular)

        // Left: context usage
        contextLabel = makeLabel(font: font, alignment: .left)
        contextLabel.frame = NSRect(x: 12, y: 0, width: 160, height: bounds.height)
        contextLabel.autoresizingMask = [.maxXMargin]
        addSubview(contextLabel)

        // Center: 5H / 7D usage
        usageLabel = makeLabel(font: font, alignment: .center)
        usageLabel.frame = NSRect(x: bounds.width / 2 - 100, y: 0, width: 200, height: bounds.height)
        usageLabel.autoresizingMask = [.minXMargin, .maxXMargin]
        addSubview(usageLabel)

        // Right: task timer
        taskLabel = makeLabel(font: font, alignment: .right)
        taskLabel.frame = NSRect(x: bounds.width - 140, y: 0, width: 128, height: bounds.height)
        taskLabel.autoresizingMask = [.minXMargin]
        addSubview(taskLabel)

        // Initial values (dummy)
        updateContext(percent: 0, tokens: 0)
        updateUsage(fiveHour: "---", sevenDay: "---")
        taskStartDate = Date()
        updateTaskTimer()
    }

    private func makeLabel(font: NSFont, alignment: NSTextAlignment) -> NSTextField {
        let label = NSTextField(labelWithString: "")
        label.font = font
        label.textColor = textColor
        label.alignment = alignment
        label.backgroundColor = .clear
        label.isBezeled = false
        label.isEditable = false
        label.isSelectable = false
        label.lineBreakMode = .byTruncatingTail
        return label
    }

    // MARK: - Public Update Methods

    func updateContext(percent: Int, tokens: Int) {
        let display = tokens > 1000 ? "\(tokens / 1000)K" : "\(tokens)"
        contextLabel.stringValue = "CTX \(percent)% (\(display))"

        // Color coding
        if percent > 80 {
            contextLabel.textColor = NSColor(hex: "ff5555")  // red
        } else if percent > 50 {
            contextLabel.textColor = NSColor(hex: "ffb86c")  // orange
        } else {
            contextLabel.textColor = textColor
        }
    }

    func updateUsage(fiveHour: String, sevenDay: String) {
        usageLabel.stringValue = "5H \(fiveHour)    7D \(sevenDay)"
    }

    // MARK: - Task Timer

    private func startTaskTimer() {
        taskTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            self?.updateTaskTimer()
        }
    }

    private func updateTaskTimer() {
        guard let start = taskStartDate else {
            taskLabel.stringValue = "Task 0s"
            return
        }
        let elapsed = Int(Date().timeIntervalSince(start))
        if elapsed < 60 {
            taskLabel.stringValue = "Task \(elapsed)s"
        } else if elapsed < 3600 {
            taskLabel.stringValue = "Task \(elapsed / 60)m \(elapsed % 60)s"
        } else {
            let h = elapsed / 3600
            let m = (elapsed % 3600) / 60
            taskLabel.stringValue = "Task \(h)h \(m)m"
        }
    }

    func resetTaskTimer() {
        taskStartDate = Date()
    }

    // MARK: - Theme

    func applyTheme(_ theme: Theme) {
        bgColor = theme.ui.bgPrimary
        textColor = theme.ui.textSecondary
        accentColor = theme.ui.accent

        layer?.backgroundColor = bgColor.cgColor
        contextLabel?.textColor = textColor
        usageLabel?.textColor = textColor
        taskLabel?.textColor = textColor
        separatorLine?.layer?.backgroundColor = theme.ui.border.cgColor
    }

    deinit {
        taskTimer?.invalidate()
    }
}
