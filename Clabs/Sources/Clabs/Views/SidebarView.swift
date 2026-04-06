import AppKit

// @TASK Phase2B - Sidebar panel with collapsible sections
final class SidebarView: NSView {

    // MARK: - Constants

    static let defaultWidth: CGFloat = 260
    private let headerHeight: CGFloat = 36
    private let itemHeight: CGFloat = 32
    private let footerHeight: CGFloat = 36

    // MARK: - Colours (dark theme)

    private let bgColor = NSColor(srgbRed: 0.086, green: 0.106, blue: 0.133, alpha: 1) // #161b22
    private let borderColor = NSColor(srgbRed: 0.188, green: 0.212, blue: 0.239, alpha: 1) // #30363d
    private let textPrimary = NSColor(srgbRed: 0.902, green: 0.929, blue: 0.953, alpha: 1) // #e6edf3
    private let textSecondary = NSColor(srgbRed: 0.545, green: 0.584, blue: 0.616, alpha: 1) // #8b949e
    private let accentColor = NSColor(srgbRed: 0.345, green: 0.651, blue: 1.0, alpha: 1) // #58a6ff

    // MARK: - State

    private var sections: [Section] = []
    private var sectionViews: [SectionHeaderView] = []
    private var scrollView: NSScrollView!
    private var stackContainer: NSView!

    // MARK: - Section model

    struct Section {
        let title: String
        let items: [String]
        var collapsed: Bool
    }

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        setupSections()
        setupViews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupSections()
        setupViews()
    }

    private func setupSections() {
        sections = [
            Section(title: "빠른 실행", items: ["새 터미널", "분할 화면", "전체 화면"], collapsed: false),
            Section(title: "명령어 기록", items: ["ls -la", "git status", "npm run dev"], collapsed: false),
            Section(title: "기본 명령어", items: ["claude --help", "claude --version"], collapsed: false),
            Section(title: "스킬", items: ["token-optimizer", "auto-orchestrate", "cost-router"], collapsed: false),
        ]
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

    // MARK: - Subview factories

    private func makeTitleBar(width: CGFloat) -> NSView {
        let v = NSView()
        v.wantsLayer = true
        v.layer?.backgroundColor = bgColor.cgColor

        let label = NSTextField(labelWithString: "Clabs")
        label.font = .systemFont(ofSize: 16, weight: .semibold)
        label.textColor = textPrimary
        label.frame = NSRect(x: 16, y: 12, width: 200, height: 24)
        v.addSubview(label)
        return v
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

        let versionLabel = NSTextField(labelWithString: "v0.1.0-phase2b")
        versionLabel.font = .systemFont(ofSize: 11)
        versionLabel.textColor = textSecondary
        versionLabel.frame = NSRect(x: 16, y: 10, width: 200, height: 16)
        v.addSubview(versionLabel)

        return v
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

        // Title
        let titleLabel = NSTextField(labelWithString: section.title.uppercased())
        titleLabel.font = .systemFont(ofSize: 10, weight: .medium)
        titleLabel.textColor = textSecondary
        titleLabel.frame = NSRect(x: 32, y: (headerH - 16) / 2, width: 180, height: 16)
        headerRow.addSubview(titleLabel)

        // Item rows (below header)
        for (i, item) in section.items.enumerated() {
            if section.collapsed { break }
            let rowY = totalH - headerH - CGFloat(i + 1) * itemH
            let row = makeItemRow(text: item, y: rowY, width: frame.width)
            addSubview(row)
        }
    }

    private func makeItemRow(text: String, y: CGFloat, width: CGFloat) -> NSView {
        let v = NSView(frame: NSRect(x: 0, y: y, width: width, height: itemH))
        v.wantsLayer = true
        v.layer?.backgroundColor = NSColor.clear.cgColor

        let label = NSTextField(labelWithString: text)
        label.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        label.textColor = textPrimary
        label.frame = NSRect(x: 40, y: (itemH - 16) / 2, width: width - 56, height: 16)
        v.addSubview(label)

        // Dot indicator
        let dot = NSView(frame: NSRect(x: 24, y: (itemH - 5) / 2, width: 5, height: 5))
        dot.wantsLayer = true
        dot.layer?.backgroundColor = textSecondary.withAlphaComponent(0.5).cgColor
        dot.layer?.cornerRadius = 2.5
        v.addSubview(dot)

        return v
    }

    @objc private func headerTapped() {
        onToggle?(index)
    }
}
