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
    func sidebar(_ view: SidebarView, didRequestOpenFile path: String)
}

// MARK: - SidebarView

final class SidebarView: NSView {

    // MARK: - Constants

    static let defaultWidth: CGFloat = 260
    private let headerHeight: CGFloat = 36
    private let itemHeight: CGFloat = 32
    private let footerHeight: CGFloat = 36

    // MARK: - Colours (mutable for theme support)

    private var bgColor: NSColor      = ThemePresets.githubDark.ui.bgSecondary
    private var bgHoverColor: NSColor = ThemePresets.githubDark.ui.bgTertiary
    private var borderColor: NSColor  = ThemePresets.githubDark.ui.border
    private var textPrimary: NSColor  = ThemePresets.githubDark.ui.textPrimary
    private var textSecondary: NSColor = ThemePresets.githubDark.ui.textSecondary
    private var accentColor: NSColor  = ThemePresets.githubDark.ui.accent

    // MARK: - State

    weak var delegate: SidebarDelegate?

    private var sections: [Section] = []
    private var sectionViews: [SectionHeaderView] = []
    private var scrollView: NSScrollView!
    private var stackContainer: NSView!

    // Tab mode
    private enum SidebarTab { case skills, files }
    private var activeTab: SidebarTab = .skills
    private var segmentControl: NSSegmentedControl!
    private var fileTreeView: FileTreeView?
    private var currentProjectPath: String = FileManager.default.homeDirectoryForCurrentUser.path

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

    private let segmentHeight: CGFloat = 32

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

        // Segment control at top — rounded tab style
        segmentControl = NSSegmentedControl(labels: ["Skills", "Files"], trackingMode: .selectOne, target: self, action: #selector(segmentChanged))
        segmentControl.selectedSegment = 0
        segmentControl.segmentStyle = .rounded
        segmentControl.font = .systemFont(ofSize: 13, weight: .medium)
        segmentControl.frame = NSRect(x: 8, y: bounds.height - segmentHeight - 6, width: bounds.width - 16, height: segmentHeight)
        segmentControl.autoresizingMask = [.width, .minYMargin]
        addSubview(segmentControl)

        // Scroll view below segment control
        let scrollY: CGFloat = 0
        let scrollH = bounds.height - segmentHeight - 12
        scrollView = NSScrollView(frame: NSRect(x: 0, y: scrollY, width: bounds.width, height: scrollH))
        scrollView.autoresizingMask = [.width, .height]
        scrollView.hasVerticalScroller = true
        scrollView.scrollerStyle = .overlay
        scrollView.drawsBackground = false
        scrollView.backgroundColor = .clear
        addSubview(scrollView)

        rebuildStack()
    }

    @objc private func segmentChanged() {
        activeTab = segmentControl.selectedSegment == 0 ? .skills : .files
        updateTabContent()
    }

    private func updateTabContent() {
        switch activeTab {
        case .skills:
            fileTreeView?.isHidden = true
            scrollView.isHidden = false
        case .files:
            scrollView.isHidden = true
            if fileTreeView == nil {
                let ftv = FileTreeView(frame: scrollView.frame)
                ftv.autoresizingMask = [.width, .height]
                ftv.delegate = self
                ftv.applyTheme(bg: bgColor, text: textPrimary, secondary: textSecondary)
                addSubview(ftv)
                fileTreeView = ftv
            }
            fileTreeView?.frame = scrollView.frame
            fileTreeView?.isHidden = false
            if let ftv = fileTreeView {
                // Load if not yet loaded or path changed
                ftv.load(rootPath: currentProjectPath)
            }
        }
    }

    /// Update file tree root when project path changes
    func setProjectPath(_ path: String) {
        currentProjectPath = path
        fileTreeView?.load(rootPath: path)
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
                bgHoverColor: bgHoverColor,
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

        // Refresh button bar (compact, no title)
        let titleBar = makeTitleBar(width: bounds.width)
        titleBar.frame = NSRect(x: 0, y: y, width: bounds.width, height: 36)
        titleBar.autoresizingMask = [.width]
        container.addSubview(titleBar)
        y += 36

        // Footer
        let footer = makeFooter(width: bounds.width)
        footer.frame = NSRect(x: 0, y: 0, width: bounds.width, height: footerHeight)
        footer.autoresizingMask = [.width]
        container.addSubview(footer)

        container.frame = NSRect(x: 0, y: 0, width: bounds.width, height: y)

        // Use a flipped container so content starts from top
        let flippedContainer = FlippedView(frame: container.frame)
        flippedContainer.addSubview(container)
        container.frame.origin = .zero
        scrollView.documentView = flippedContainer
        stackContainer = container
        sectionViews = builtViews
    }

    private func toggleSection(at index: Int) {
        sections[index].collapsed.toggle()
        rebuildStack()
    }

    // MARK: - Item click handling

    private func handleItemClick(sectionIndex: Int, itemIndex: Int) {
        NSLog("[SidebarView] handleItemClick section=%d item=%d delegate=%d", sectionIndex, itemIndex, delegate != nil ? 1 : 0)
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

        // Refresh button only — no title text
        let refreshBtn = NSButton(frame: NSRect(x: width - 40, y: 4, width: 28, height: 28))
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
        let versionLabel = NSTextField(labelWithString: "v0.1.0  ·  \(skillCount) skills")
        versionLabel.font = .systemFont(ofSize: 10)
        versionLabel.textColor = textSecondary.withAlphaComponent(0.5)
        versionLabel.frame = NSRect(x: 16, y: 8, width: 220, height: 14)
        v.addSubview(versionLabel)

        return v
    }

    // MARK: - Theme

    func applyTheme(_ theme: Theme) {
        bgColor       = theme.ui.bgSecondary
        bgHoverColor  = theme.ui.bgTertiary
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
        // Sync fileTreeView frame with scrollView
        if let ftv = fileTreeView {
            ftv.frame = scrollView.frame
        }
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
    private let bgHoverColor: NSColor
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
        bgHoverColor: NSColor,
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
        self.bgHoverColor = bgHoverColor
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

        // Subtle separator below header
        let sep = NSView(frame: NSRect(x: 8, y: headerY - 1, width: frame.width - 16, height: 1))
        sep.wantsLayer = true
        sep.layer?.backgroundColor = borderColor.withAlphaComponent(0.3).cgColor
        addSubview(sep)

        // Chevron (small, muted)
        let chevron = NSButton(frame: NSRect(x: 8, y: (headerH - 16) / 2, width: 16, height: 16))
        chevron.bezelStyle = .inline
        chevron.isBordered = false
        chevron.title = section.collapsed ? "›" : "⌄"
        chevron.font = .systemFont(ofSize: 12, weight: .medium)
        chevron.contentTintColor = textSecondary.withAlphaComponent(0.6)
        chevron.target = self
        chevron.action = #selector(headerTapped)
        headerRow.addSubview(chevron)

        // Title — small uppercase, muted
        let shortTitle = sectionShortTitle(section.title)
        let titleLabel = NSTextField(labelWithString: shortTitle.uppercased())
        titleLabel.font = .systemFont(ofSize: 12, weight: .semibold)
        titleLabel.textColor = textSecondary.withAlphaComponent(0.6)
        titleLabel.frame = NSRect(x: 28, y: (headerH - 14) / 2, width: frame.width - 60, height: 14)
        headerRow.addSubview(titleLabel)

        // Count badge (right-aligned)
        let countLabel = NSTextField(labelWithString: "\(section.items.count)")
        countLabel.font = .monospacedDigitSystemFont(ofSize: 9, weight: .regular)
        countLabel.textColor = textSecondary.withAlphaComponent(0.4)
        countLabel.alignment = .right
        countLabel.frame = NSRect(x: frame.width - 28, y: (headerH - 12) / 2, width: 20, height: 12)
        headerRow.addSubview(countLabel)

        // Item rows (below header)
        for (i, item) in section.items.enumerated() {
            if section.collapsed { break }
            let rowY = totalH - headerH - CGFloat(i + 1) * itemH
            let row = makeItemRow(text: item, y: rowY, width: frame.width, itemIndex: i)
            addSubview(row)
        }
    }

    private func sectionShortTitle(_ title: String) -> String {
        // "스킬: category" → "category", else keep as-is
        if title.hasPrefix("스킬: ") {
            return String(title.dropFirst(4))
        }
        return title
    }

    private func makeItemRow(text: String, y: CGFloat, width: CGFloat, itemIndex: Int) -> NSView {
        let btn = ItemRowButton(frame: NSRect(x: 0, y: y, width: width, height: itemH))
        btn.wantsLayer = true
        btn.layer?.backgroundColor = NSColor.clear.cgColor
        btn.sectionIndex = index
        btn.itemIndex = itemIndex
        btn.hoverColor = bgHoverColor
        btn.onPress = { [weak self] sIdx, iIdx in
            self?.onItemClick?(sIdx, iIdx)
        }

        let label = NSTextField(labelWithString: text)
        label.font = .systemFont(ofSize: 14, weight: .regular)
        label.textColor = textPrimary
        label.lineBreakMode = .byTruncatingTail
        label.frame = NSRect(x: 36, y: (itemH - 15) / 2, width: width - 52, height: 15)
        btn.addSubview(label)

        // Dot indicator — color based on section kind
        let dot = NSView(frame: NSRect(x: 20, y: (itemH - 5) / 2, width: 5, height: 5))
        dot.wantsLayer = true
        let dotColor: NSColor
        switch section.kind {
        case .quickAction: dotColor = accentColor
        case .commandHistory: dotColor = NSColor(srgbRed: 0.545, green: 0.784, blue: 0.369, alpha: 1)
        case .skills: dotColor = textSecondary.withAlphaComponent(0.5)
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
    var hoverColor: NSColor = NSColor(srgbRed: 0.129, green: 0.149, blue: 0.176, alpha: 1)

    override func mouseDown(with event: NSEvent) {
        wantsLayer = true
        layer?.backgroundColor = hoverColor.withAlphaComponent(0.8).cgColor
    }

    override func mouseUp(with event: NSEvent) {
        layer?.backgroundColor = hoverColor.cgColor
        let loc = convert(event.locationInWindow, from: nil)
        NSLog("[ItemRowButton] mouseUp section=%d item=%d inBounds=%d onPress=%d", sectionIndex, itemIndex, bounds.contains(loc) ? 1 : 0, onPress != nil ? 1 : 0)
        if bounds.contains(loc) {
            onPress?(sectionIndex, itemIndex)
            // brief flash then clear
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) { [weak self] in
                self?.layer?.backgroundColor = NSColor.clear.cgColor
            }
        } else {
            layer?.backgroundColor = NSColor.clear.cgColor
        }
    }

    override func mouseEntered(with event: NSEvent) {
        wantsLayer = true
        layer?.backgroundColor = hoverColor.withAlphaComponent(0.4).cgColor
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


// MARK: - FlippedView (top-to-bottom layout for NSScrollView)
private class FlippedView: NSView {
    override var isFlipped: Bool { true }
}

// MARK: - FileTreeDelegate

extension SidebarView: FileTreeDelegate {
    func fileTree(_ view: FileTreeView, didRequestOpenFile path: String) {
        delegate?.sidebar(self, didRequestOpenFile: path)
    }
}
