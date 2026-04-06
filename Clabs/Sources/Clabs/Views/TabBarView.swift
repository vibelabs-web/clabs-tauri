import AppKit

// MARK: - TabBarDelegate

protocol TabBarDelegate: AnyObject {
    func tabBar(_ bar: TabBarView, didSelectTabId id: String)
    func tabBar(_ bar: TabBarView, didCloseTabId id: String)
    func tabBarDidRequestNewTab(_ bar: TabBarView)
}

// MARK: - TabBarView

/// A horizontal strip of tab buttons with a "+" new-tab button on the right.
/// Designed for the top of the window content area.
final class TabBarView: NSView {

    weak var delegate: TabBarDelegate?

    private var tabItems: [(id: String, title: String)] = []
    private var activeTabId: String = ""

    // Layout constants
    private let barHeight: CGFloat = 38
    private let tabMinWidth: CGFloat = 100
    private let tabMaxWidth: CGFloat = 200
    private let closeBtnSize: CGFloat = 16
    private let addBtnWidth: CGFloat = 38

    // Colors (mutable for theme support)
    private var bgColor: NSColor          = ThemePresets.defaultDark.ui.bgPrimary
    private var activeTabColor: NSColor   = ThemePresets.defaultDark.ui.bgTertiary
    private var inactiveTabColor: NSColor = ThemePresets.defaultDark.ui.bgSecondary
    private var textColor: NSColor        = ThemePresets.defaultDark.ui.textPrimary
    private var mutedTextColor: NSColor   = ThemePresets.defaultDark.ui.textSecondary
    private var separatorColor: NSColor   = ThemePresets.defaultDark.ui.border

    // Subviews
    private var addButton: NSButton!
    private var scrollView: NSScrollView!
    private var tabStackView: NSStackView!

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        setupViews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupViews()
    }

    private func setupViews() {
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor

        // Scroll view for tabs (in case there are many)
        scrollView = NSScrollView(frame: .zero)
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.hasHorizontalScroller = false
        scrollView.hasVerticalScroller = false
        scrollView.drawsBackground = false
        scrollView.horizontalScrollElasticity = .allowed
        addSubview(scrollView)

        // Stack view holding tab buttons
        tabStackView = NSStackView(frame: .zero)
        tabStackView.orientation = .horizontal
        tabStackView.spacing = 1
        tabStackView.distribution = .fillProportionally
        tabStackView.alignment = .centerY
        scrollView.documentView = tabStackView

        // "+" button
        addButton = makeAddButton()
        addButton.translatesAutoresizingMaskIntoConstraints = false
        addSubview(addButton)

        NSLayoutConstraint.activate([
            scrollView.leadingAnchor.constraint(equalTo: leadingAnchor),
            scrollView.topAnchor.constraint(equalTo: topAnchor),
            scrollView.bottomAnchor.constraint(equalTo: bottomAnchor),
            scrollView.trailingAnchor.constraint(equalTo: addButton.leadingAnchor),

            addButton.trailingAnchor.constraint(equalTo: trailingAnchor),
            addButton.topAnchor.constraint(equalTo: topAnchor),
            addButton.bottomAnchor.constraint(equalTo: bottomAnchor),
            addButton.widthAnchor.constraint(equalToConstant: addBtnWidth),
        ])
    }

    private func makeAddButton() -> NSButton {
        let btn = NSButton(frame: .zero)
        btn.bezelStyle = .inline
        btn.isBordered = false
        btn.title = "+"
        btn.font = NSFont.systemFont(ofSize: 18, weight: .light)
        btn.contentTintColor = mutedTextColor
        btn.toolTip = "New Tab (⌘T)"
        btn.target = self
        btn.action = #selector(addButtonClicked)
        return btn
    }

    // MARK: - Public API

    func setTabs(_ tabs: [(id: String, title: String)], activeId: String) {
        tabItems = tabs
        activeTabId = activeId
        rebuildTabButtons()
    }

    func setActiveTab(id: String) {
        activeTabId = id
        rebuildTabButtons()
    }

    // MARK: - Rebuild

    private func rebuildTabButtons() {
        tabStackView.arrangedSubviews.forEach { $0.removeFromSuperview() }

        for item in tabItems {
            let tabBtn = makeTabButton(id: item.id, title: item.title, isActive: item.id == activeTabId)
            tabStackView.addArrangedSubview(tabBtn)
        }

        // Resize stack view to fit content
        let totalWidth = max(
            CGFloat(tabItems.count) * tabMinWidth,
            frame.width - addBtnWidth
        )
        tabStackView.frame = NSRect(x: 0, y: 0, width: totalWidth, height: barHeight)
    }

    private func makeTabButton(id: String, title: String, isActive: Bool) -> NSView {
        let container = NSView(frame: .zero)
        container.translatesAutoresizingMaskIntoConstraints = false
        container.wantsLayer = true
        container.layer?.backgroundColor = isActive ? activeTabColor.cgColor : inactiveTabColor.cgColor

        // Bottom border for active tab
        if isActive {
            let accent = CALayer()
            accent.backgroundColor = NSColor.controlAccentColor.cgColor
            accent.frame = CGRect(x: 0, y: 0, width: 0, height: 2) // width set in layout
            accent.autoresizingMask = [.layerWidthSizable]
            container.layer?.addSublayer(accent)
        }

        // Title label
        let label = NSTextField(labelWithString: title)
        label.translatesAutoresizingMaskIntoConstraints = false
        label.font = NSFont.systemFont(ofSize: 12, weight: isActive ? .medium : .regular)
        label.textColor = isActive ? textColor : mutedTextColor
        label.lineBreakMode = .byTruncatingMiddle
        label.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        container.addSubview(label)

        // Close button
        let closeBtn = NSButton(frame: .zero)
        closeBtn.translatesAutoresizingMaskIntoConstraints = false
        closeBtn.bezelStyle = .inline
        closeBtn.isBordered = false
        closeBtn.title = "×"
        closeBtn.font = NSFont.systemFont(ofSize: 13, weight: .regular)
        closeBtn.contentTintColor = mutedTextColor
        closeBtn.target = self
        closeBtn.action = #selector(closeTabButtonClicked(_:))
        closeBtn.identifier = NSUserInterfaceItemIdentifier(id)
        container.addSubview(closeBtn)

        // Click gesture on the whole container
        let clickGesture = NSClickGestureRecognizer(target: self, action: #selector(tabContainerClicked(_:)))
        container.addGestureRecognizer(clickGesture)
        container.identifier = NSUserInterfaceItemIdentifier(id)

        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 10),
            label.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            label.trailingAnchor.constraint(equalTo: closeBtn.leadingAnchor, constant: -4),

            closeBtn.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -6),
            closeBtn.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            closeBtn.widthAnchor.constraint(equalToConstant: closeBtnSize),
            closeBtn.heightAnchor.constraint(equalToConstant: closeBtnSize),

            container.heightAnchor.constraint(equalToConstant: barHeight),
            container.widthAnchor.constraint(greaterThanOrEqualToConstant: tabMinWidth),
            container.widthAnchor.constraint(lessThanOrEqualToConstant: tabMaxWidth),
        ])

        return container
    }

    // MARK: - Actions

    @objc private func addButtonClicked() {
        delegate?.tabBarDidRequestNewTab(self)
    }

    @objc private func tabContainerClicked(_ gesture: NSClickGestureRecognizer) {
        guard let view = gesture.view, let id = view.identifier?.rawValue else { return }
        delegate?.tabBar(self, didSelectTabId: id)
    }

    @objc private func closeTabButtonClicked(_ sender: NSButton) {
        let id = sender.identifier?.rawValue ?? ""
        guard !id.isEmpty else { return }
        delegate?.tabBar(self, didCloseTabId: id)
    }

    // MARK: - Theme

    func applyTheme(_ theme: Theme) {
        bgColor          = theme.ui.bgPrimary
        activeTabColor   = theme.ui.bgTertiary
        inactiveTabColor = theme.ui.bgSecondary
        textColor        = theme.ui.textPrimary
        mutedTextColor   = theme.ui.textSecondary
        separatorColor   = theme.ui.border
        layer?.backgroundColor = bgColor.cgColor
        addButton?.contentTintColor = mutedTextColor
        rebuildTabButtons()
        needsDisplay = true
    }

    // MARK: - Drawing

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        // Bottom separator line
        separatorColor.setFill()
        NSRect(x: 0, y: 0, width: bounds.width, height: 1).fill()
    }
}
