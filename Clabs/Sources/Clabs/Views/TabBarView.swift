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
    private let barHeight: CGFloat = 36
    private let tabMinWidth: CGFloat = 100
    private let tabMaxWidth: CGFloat = 200
    private let closeBtnSize: CGFloat = 16
    private let addBtnWidth: CGFloat = 36

    // Colors (mutable for theme support)
    private var bgColor: NSColor          = ThemePresets.githubDark.ui.bgSecondary
    private var activeTabColor: NSColor   = ThemePresets.githubDark.ui.bgSecondary
    private var inactiveTabColor: NSColor = ThemePresets.githubDark.ui.bgSecondary
    private var textColor: NSColor        = ThemePresets.githubDark.ui.textPrimary
    private var mutedTextColor: NSColor   = ThemePresets.githubDark.ui.textSecondary
    private var accentColor: NSColor      = ThemePresets.githubDark.ui.accent
    private var separatorColor: NSColor   = ThemePresets.githubDark.ui.border

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
        let btn = HoverButton(frame: .zero)
        btn.bezelStyle = .inline
        btn.isBordered = false
        btn.title = "+"
        btn.font = NSFont.systemFont(ofSize: 16, weight: .light)
        btn.contentTintColor = mutedTextColor
        btn.toolTip = "New Tab (⌘T)"
        btn.target = self
        btn.action = #selector(addButtonClicked)
        btn.normalColor = .clear
        btn.hoverColor = ThemePresets.githubDark.ui.bgTertiary
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
        // Remove spacing between tabs
        tabStackView.spacing = 0
    }

    private func makeTabButton(id: String, title: String, isActive: Bool) -> NSView {
        let container = TabItemView(frame: .zero)
        container.translatesAutoresizingMaskIntoConstraints = false
        container.wantsLayer = true
        container.layer?.backgroundColor = bgColor.cgColor
        container.hoverBgColor = inactiveTabColor.withAlphaComponent(0.5)

        // Active tab: bottom accent border (2px)
        if isActive {
            let accent = CALayer()
            accent.backgroundColor = accentColor.cgColor
            accent.frame = CGRect(x: 0, y: 0, width: 0, height: 2)
            accent.autoresizingMask = [.layerWidthSizable]
            accent.name = "accentBorder"
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

        // Close button (hidden by default, shown on hover)
        let closeBtn = NSButton(frame: .zero)
        closeBtn.translatesAutoresizingMaskIntoConstraints = false
        closeBtn.bezelStyle = .inline
        closeBtn.isBordered = false
        closeBtn.title = "×"
        closeBtn.font = NSFont.systemFont(ofSize: 11, weight: .medium)
        closeBtn.contentTintColor = mutedTextColor
        closeBtn.alphaValue = 0  // hidden until hover
        closeBtn.target = self
        closeBtn.action = #selector(closeTabButtonClicked(_:))
        closeBtn.identifier = NSUserInterfaceItemIdentifier(id)
        container.addSubview(closeBtn)
        container.closeButton = closeBtn

        // Click gesture on the whole container
        let clickGesture = NSClickGestureRecognizer(target: self, action: #selector(tabContainerClicked(_:)))
        container.addGestureRecognizer(clickGesture)
        container.identifier = NSUserInterfaceItemIdentifier(id)

        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 12),
            label.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            label.trailingAnchor.constraint(equalTo: closeBtn.leadingAnchor, constant: -4),

            closeBtn.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -8),
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
        bgColor          = theme.ui.bgSecondary
        activeTabColor   = theme.ui.bgSecondary
        inactiveTabColor = theme.ui.bgSecondary
        textColor        = theme.ui.textPrimary
        mutedTextColor   = theme.ui.textSecondary
        accentColor      = theme.ui.accent
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

// MARK: - TabItemView (hover-aware tab container)

final class TabItemView: NSView {

    var closeButton: NSButton?
    var hoverBgColor: NSColor = .clear

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

    override func mouseEntered(with event: NSEvent) {
        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.1
            closeButton?.animator().alphaValue = 1
            layer?.backgroundColor = hoverBgColor.cgColor
        }
    }

    override func mouseExited(with event: NSEvent) {
        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.15
            closeButton?.animator().alphaValue = 0
            layer?.backgroundColor = NSColor.clear.cgColor
        }
    }
}

// MARK: - HoverButton (hover background)

final class HoverButton: NSButton {

    var normalColor: NSColor = .clear
    var hoverColor: NSColor = .clear

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

    override func mouseEntered(with event: NSEvent) {
        wantsLayer = true
        layer?.backgroundColor = hoverColor.cgColor
    }

    override func mouseExited(with event: NSEvent) {
        layer?.backgroundColor = normalColor.cgColor
    }
}
