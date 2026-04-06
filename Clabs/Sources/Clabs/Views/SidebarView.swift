import AppKit

// @TASK Phase3A - Sidebar with real skill scanner + delegate actions
// @SPEC src-tauri/src/skills.rs (category inference logic)

// MARK: - SidebarAction

enum SidebarAction {
    case newTerminal
    case splitHorizontal
    case splitVertical
    case fullscreen
}

// MARK: - SidebarDelegate

protocol SidebarDelegate: AnyObject {
    func sidebar(_ view: SidebarView, didSelectSkill skill: SkillInfo)
    func sidebar(_ view: SidebarView, didSelectCommand command: String)
    func sidebar(_ view: SidebarView, didRequestAction action: SidebarAction)
}

// MARK: - SidebarView

final class SidebarView: NSView {

    // MARK: - Constants

    static let defaultWidth: CGFloat = 260
    private let headerHeight: CGFloat = 36
    private let itemHeight: CGFloat = 32
    private let footerHeight: CGFloat = 36

    // MARK: - Colours (mutable for theme support)

    private var bgColor: NSColor      = ThemePresets.defaultDark.ui.bgSecondary
    private var borderColor: NSColor  = ThemePresets.defaultDark.ui.border
    private var textPrimary: NSColor  = ThemePresets.defaultDark.ui.textPrimary
    private var textSecondary: NSColor = ThemePresets.defaultDark.ui.textSecondary
    private var accentColor: NSColor  = ThemePresets.defaultDark.ui.accent

    // MARK: - State

    weak var delegate: SidebarDelegate?

    private var sections: [Section] = []
    private var sectionViews: [SectionHeaderView] = []
    private var scrollView: NSScrollView!
    private var stackContainer: NSView!

    // Skill data (for click handling)
    private var scannedSkills: [SkillInfo] = []
    private var quickActions: [(String, SidebarAction)] = [
        ("새 터미널", .newTerminal),
        ("수평 분할", .splitHorizontal),
        ("수직 분할", .splitVertical),
        ("전체 화면", .fullscreen),
    ]

    // MARK: - Section model

    struct Section {
        let title: String
        let items: [String]
        var collapsed: Bool
        let kind: SectionKind
    }

    enum SectionKind {
        case quickAction
        case commandHistory
        case skills(category: String)
    }

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        loadSkillsAndSetup()
        setupViews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        loadSkillsAndSetup()
        setupViews()
    }

    // MARK: - Skill Loading

    private func loadSkillsAndSetup() {
        scannedSkills = SkillScanner.scan()
        rebuildSections()
    }

    /// Reload skills from disk and refresh sidebar
    func reloadSkills(projectPath: String? = nil) {
        scannedSkills = SkillScanner.scan(projectPath: projectPath)
        rebuildSections()
        rebuildStack()
    }

    private func rebuildSections() {
        var newSections: [Section] = []

        // 1. Quick actions
        newSections.append(Section(
            title: "빠른 실행",
            items: quickActions.map { $0.0 },
            collapsed: false,
            kind: .quickAction
        ))

        // 2. Command history
        let history = CommandHistory.shared.list(limit: 8).map { $0.command }
        if !history.isEmpty {
            newSections.append(Section(
                title: "명령어 기록",
                items: history,
                collapsed: false,
                kind: .commandHistory
            ))
        }

        // 3. Skills grouped by category
        let categorized = SkillScanner.categorize(scannedSkills)
        for (category, skills) in categorized {
            newSections.append(Section(
                title: "스킬: \(category)",
                items: skills.map { $0.name },
                collapsed: true,
                kind: .skills(category: category)
            ))
        }

        sections = newSections
    }

    private func setupViews() {
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor

        // Right border
        let border = NSView()
        border.wantsLayer = true
        border.layer?.backgroundColor = borderColor.cgColor
        addSubview(border)
        border.frame = NSRect(x: bounds.width - 1, y: 0, width: 1, height: bounds.height)
        border.autoresizingMask = [.height, .minXMargin]

        // Scroll view fills sidebar
        scrollView = NSScrollView(frame: bounds)
        scrollView.autoresizingMask = [.width, .height]
        scrollView.hasVerticalScroller = true
        scrollView.scrollerStyle = .overlay
        scrollView.drawsBackground = false
        scrollView.backgroundColor = .clear
        addSubview(scrollView)

        rebuildStack()
    }

    // MARK: - Stack rebuild

    private func rebuildStack() {
        stackContainer?.removeFromSuperview()

        let container = NSView()
        container.wantsLayer = true
        container.layer?.backgroundColor = bgColor.cgColor

        var y = footerHeight
        var builtViews: [SectionHeaderView] = []

        // Build sections bottom-up (NSView coords: y=0 at bottom)
        for (index, section) in sections.enumerated().reversed() {
            let itemCount = section.collapsed ? 0 : section.items.count
            let sectionHeight = headerHeight + CGFloat(itemCount) * itemHeight

            let header = SectionHeaderView(
                frame: NSRect(x: 0, y: y, width: bounds.width, height: sectionHeight),
                section: section,
                index: index,
                headerHeight: headerHeight,
                itemHeight: itemHeight,
                textPrimary: textPrimary,
                textSecondary: textSecondary,
                accentColor: accentColor,
                bgColor: bgColor,
                borderColor: borderColor
            )
            header.autoresizingMask = [.width]
            header.onToggle = { [weak self] idx in
                self?.toggleSection(at: idx)
            }
            header.onItemClick = { [weak self] idx, itemIdx in
                self?.handleItemClick(sectionIndex: idx, itemIndex: itemIdx)
            }
            container.addSubview(header)
            builtViews.insert(header, at: 0)
            y += sectionHeight
        }

        // Title bar at top
        let titleBar = makeTitleBar(width: bounds.width)
        titleBar.frame = NSRect(x: 0, y: y, width: bounds.width, height: 48)
        titleBar.autoresizingMask = [.width]
        container.addSubview(titleBar)
        y += 48

        // Footer
        let footer = makeFooter(width: bounds.width)
        footer.frame = NSRect(x: 0, y: 0, width: bounds.width, height: footerHeight)
        footer.autoresizingMask = [.width]
        container.addSubview(footer)

        container.frame = NSRect(x: 0, y: 0, width: bounds.width, height: y)
        scrollView.documentView = container
        stackContainer = container
        sectionViews = builtViews

        // Scroll to top
        scrollView.documentView?.scroll(NSPoint(x: 0, y: max(0, y - scrollView.bounds.height)))
    }

    private func toggleSection(at index: Int) {
        sections[index].collapsed.toggle()
        rebuildStack()
    }

    // MARK: - Item click handling

    private func handleItemClick(sectionIndex: Int, itemIndex: Int) {
        guard sectionIndex < sections.count else { return }
        let section = sections[sectionIndex]
        guard itemIndex < section.items.count else { return }

        switch section.kind {
        case .quickAction:
            let action = quickActions[itemIndex].1
            delegate?.sidebar(self, didRequestAction: action)

        case .commandHistory:
            let command = section.items[itemIndex]
            delegate?.sidebar(self, didSelectCommand: command)

        case .skills:
            let skillName = section.items[itemIndex]
            if let skill = scannedSkills.first(where: { $0.name == skillName }) {
                delegate?.sidebar(self, didSelectSkill: skill)
            }
        }
    }

    // MARK: - Subview factories

    private func makeTitleBar(width: CGFloat) -> NSView {
        let v = NSView()
        v.wantsLayer = true
        v.layer?.backgroundColor = bgColor.cgColor

        let label = NSTextField(labelWithString: "Clabs")
        label.font = .systemFont(ofSize: 16, weight: .semibold)
        label.textColor = textPrimary
        label.frame = NSRect(x: 16, y: 12, width: 120, height: 24)
        v.addSubview(label)

        // Refresh button
        let refreshBtn = NSButton(frame: NSRect(x: width - 40, y: 10, width: 28, height: 28))
        refreshBtn.bezelStyle = .inline
        refreshBtn.isBordered = false
        refreshBtn.image = NSImage(systemSymbolName: "arrow.clockwise", accessibilityDescription: "Refresh skills")
        refreshBtn.contentTintColor = textSecondary
        refreshBtn.target = self
        refreshBtn.action = #selector(refreshTapped)
        refreshBtn.autoresizingMask = [.minXMargin]
        v.addSubview(refreshBtn)

        return v
    }

    @objc private func refreshTapped() {
        reloadSkills()
        NSLog("[SidebarView] skills refreshed: %d found", scannedSkills.count)
    }

    private func makeFooter(width: CGFloat) -> NSView {
        let v = NSView()
        v.wantsLayer = true
        v.layer?.backgroundColor = bgColor.cgColor

        // Top separator
        let sep = NSView(frame: NSRect(x: 0, y: footerHeight - 1, width: width, height: 1))
        sep.wantsLayer = true
        sep.layer?.backgroundColor = borderColor.cgColor
        sep.autoresizingMask = [.width]
        v.addSubview(sep)

        let skillCount = scannedSkills.count
        let versionLabel = NSTextField(labelWithString: "v0.1.0-phase3a  |  \(skillCount) skills")
        versionLabel.font = .systemFont(ofSize: 11)
        versionLabel.textColor = textSecondary
        versionLabel.frame = NSRect(x: 16, y: 10, width: 220, height: 16)
        v.addSubview(versionLabel)

        return v
    }

    // MARK: - Theme

    func applyTheme(_ theme: Theme) {
        bgColor       = theme.ui.bgSecondary
        borderColor   = theme.ui.border
        textPrimary   = theme.ui.textPrimary
        textSecondary = theme.ui.textSecondary
        accentColor   = theme.ui.accent
        layer?.backgroundColor = bgColor.cgColor
        rebuildStack()
    }

    // MARK: - Layout

    override func setFrameSize(_ newSize: NSSize) {
        super.setFrameSize(newSize)
        rebuildStack()
    }
}

// MARK: - SectionHeaderView

final class SectionHeaderView: NSView {

    var onToggle: ((Int) -> Void)?
    var onItemClick: ((Int, Int) -> Void)?

    private let section: SidebarView.Section
    private let index: Int
    private let headerH: CGFloat
    private let itemH: CGFloat
    private let textPrimary: NSColor
    private let textSecondary: NSColor
    private let accentColor: NSColor
    private let bgColor: NSColor
    private let borderColor: NSColor

    init(
        frame: NSRect,
        section: SidebarView.Section,
        index: Int,
        headerHeight: CGFloat,
        itemHeight: CGFloat,
        textPrimary: NSColor,
        textSecondary: NSColor,
        accentColor: NSColor,
        bgColor: NSColor,
        borderColor: NSColor
    ) {
        self.section = section
        self.index = index
        self.headerH = headerHeight
        self.itemH = itemHeight
        self.textPrimary = textPrimary
        self.textSecondary = textSecondary
        self.accentColor = accentColor
        self.bgColor = bgColor
        self.borderColor = borderColor
        super.init(frame: frame)
        build()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func build() {
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor

        let totalH = frame.height

        // Header row (at top, since NSView y=0 is bottom)
        let headerY = totalH - headerH
        let headerRow = NSView(frame: NSRect(x: 0, y: headerY, width: frame.width, height: headerH))
        headerRow.wantsLayer = true
        headerRow.layer?.backgroundColor = bgColor.cgColor
        addSubview(headerRow)

        // Bottom border under header
        let sep = NSView(frame: NSRect(x: 0, y: headerY - 1, width: frame.width, height: 1))
        sep.wantsLayer = true
        sep.layer?.backgroundColor = borderColor.withAlphaComponent(0.5).cgColor
        addSubview(sep)

        // Chevron
        let chevron = NSButton(frame: NSRect(x: 8, y: (headerH - 20) / 2, width: 20, height: 20))
        chevron.bezelStyle = .inline
        chevron.isBordered = false
        chevron.title = section.collapsed ? "▶" : "▼"
        chevron.font = .systemFont(ofSize: 9)
        chevron.contentTintColor = textSecondary
        chevron.target = self
        chevron.action = #selector(headerTapped)
        headerRow.addSubview(chevron)

        // Title + count
        let countStr = " (\(section.items.count))"
        let titleLabel = NSTextField(labelWithString: section.title.uppercased() + countStr)
        titleLabel.font = .systemFont(ofSize: 10, weight: .medium)
        titleLabel.textColor = textSecondary
        titleLabel.frame = NSRect(x: 32, y: (headerH - 16) / 2, width: 200, height: 16)
        headerRow.addSubview(titleLabel)

        // Item rows (below header)
        for (i, item) in section.items.enumerated() {
            if section.collapsed { break }
            let rowY = totalH - headerH - CGFloat(i + 1) * itemH
            let row = makeItemRow(text: item, y: rowY, width: frame.width, itemIndex: i)
            addSubview(row)
        }
    }

    private func makeItemRow(text: String, y: CGFloat, width: CGFloat, itemIndex: Int) -> NSView {
        let btn = ItemRowButton(frame: NSRect(x: 0, y: y, width: width, height: itemH))
        btn.wantsLayer = true
        btn.layer?.backgroundColor = NSColor.clear.cgColor
        btn.sectionIndex = index
        btn.itemIndex = itemIndex
        btn.onPress = { [weak self] sIdx, iIdx in
            self?.onItemClick?(sIdx, iIdx)
        }

        let label = NSTextField(labelWithString: text)
        label.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        label.textColor = textPrimary
        label.lineBreakMode = .byTruncatingTail
        label.frame = NSRect(x: 40, y: (itemH - 16) / 2, width: width - 56, height: 16)
        btn.addSubview(label)

        // Dot indicator — color based on section kind
        let dot = NSView(frame: NSRect(x: 24, y: (itemH - 5) / 2, width: 5, height: 5))
        dot.wantsLayer = true
        let dotColor: NSColor
        switch section.kind {
        case .quickAction: dotColor = accentColor
        case .commandHistory: dotColor = NSColor(srgbRed: 0.545, green: 0.784, blue: 0.369, alpha: 1)
        case .skills: dotColor = textSecondary.withAlphaComponent(0.7)
        }
        dot.layer?.backgroundColor = dotColor.cgColor
        dot.layer?.cornerRadius = 2.5
        btn.addSubview(dot)

        return btn
    }

    @objc private func headerTapped() {
        onToggle?(index)
    }
}

// MARK: - ItemRowButton (clickable row)

private final class ItemRowButton: NSView {

    var sectionIndex: Int = 0
    var itemIndex: Int = 0
    var onPress: ((Int, Int) -> Void)?

    private let hoverColor = NSColor(srgbRed: 0.188, green: 0.212, blue: 0.239, alpha: 0.5)

    override func mouseDown(with event: NSEvent) {
        wantsLayer = true
        layer?.backgroundColor = hoverColor.cgColor
    }

    override func mouseUp(with event: NSEvent) {
        layer?.backgroundColor = NSColor.clear.cgColor
        // Check if mouse is still inside
        let loc = convert(event.locationInWindow, from: nil)
        if bounds.contains(loc) {
            onPress?(sectionIndex, itemIndex)
        }
    }

    override func mouseEntered(with event: NSEvent) {
        wantsLayer = true
        layer?.backgroundColor = hoverColor.withAlphaComponent(0.3).cgColor
    }

    override func mouseExited(with event: NSEvent) {
        layer?.backgroundColor = NSColor.clear.cgColor
    }

    override func updateTrackingAreas() {
        super.updateTrackingAreas()
        for area in trackingAreas { removeTrackingArea(area) }
        addTrackingArea(NSTrackingArea(
            rect: bounds,
            options: [.mouseEnteredAndExited, .activeInKeyWindow],
            owner: self,
            userInfo: nil
        ))
    }
}
