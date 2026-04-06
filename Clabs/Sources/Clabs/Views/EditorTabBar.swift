import AppKit

// @TASK Phase5C - Editor tab bar (Terminal + open file tabs) inside contentArea
// @SPEC Sources/Clabs/Views/EditorView.swift

// MARK: - EditorTabBarDelegate

protocol EditorTabBarDelegate: AnyObject {
    func editorTabBar(_ bar: EditorTabBar, didSelectTabId id: String)
    func editorTabBar(_ bar: EditorTabBar, didCloseTabId id: String)
}

// MARK: - EditorTab model

struct EditorTab: Equatable {
    let id: String           // "terminal" or file path
    var title: String
    var isModified: Bool

    static let terminal = EditorTab(id: "terminal", title: "Terminal", isModified: false)
}

// MARK: - EditorTabBar

final class EditorTabBar: NSView {

    // MARK: - Constants

    static let barHeight: CGFloat = 34

    private let tabHeight: CGFloat = 26
    private let tabMinWidth: CGFloat = 80
    private let tabMaxWidth: CGFloat = 180
    private let closeSize: CGFloat = 14
    private let dotSize: CGFloat = 6

    // Colours
    private var bgColor    = NSColor(white: 0.12, alpha: 1)
    private var activeBg   = NSColor(white: 0.17, alpha: 1)
    private var inactiveBg = NSColor.clear
    private var textColor  = NSColor(white: 0.85, alpha: 1)
    private var dimColor   = NSColor(white: 0.50, alpha: 1)
    private var borderColor = NSColor(white: 0.22, alpha: 1)
    private var accentDot   = NSColor(srgbRed: 0.98, green: 0.68, blue: 0.24, alpha: 1)

    // MARK: - State

    weak var delegate: EditorTabBarDelegate?

    private(set) var tabs: [EditorTab] = [.terminal]
    private(set) var activeTabId: String = "terminal"

    private var tabViews: [EditorTabItemView] = []
    private var stackView: NSStackView!

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    // MARK: - Setup

    private func setup() {
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor

        stackView = NSStackView()
        stackView.orientation = .horizontal
        stackView.spacing = 0
        stackView.alignment = .centerY
        stackView.distribution = .fillProportionally
        stackView.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stackView)

        NSLayoutConstraint.activate([
            stackView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 4),
            stackView.trailingAnchor.constraint(lessThanOrEqualTo: trailingAnchor, constant: -4),
            stackView.centerYAnchor.constraint(equalTo: centerYAnchor),
            stackView.heightAnchor.constraint(equalToConstant: tabHeight),
        ])

        rebuildTabViews()
    }

    // MARK: - Draw bottom border

    override func draw(_ dirtyRect: NSRect) {
        super.draw(dirtyRect)
        borderColor.setFill()
        NSRect(x: 0, y: 0, width: bounds.width, height: 1).fill()
    }

    // MARK: - Public API

    func setTabs(_ tabs: [EditorTab], activeId: String) {
        self.tabs = tabs
        self.activeTabId = activeId
        rebuildTabViews()
        needsDisplay = true
    }

    func markModified(tabId: String, isModified: Bool) {
        guard let idx = tabs.firstIndex(where: { $0.id == tabId }) else { return }
        tabs[idx].isModified = isModified
        tabViews[safe: idx]?.configure(tab: tabs[idx], isActive: tabs[idx].id == activeTabId)
    }

    // MARK: - Rebuild

    private func rebuildTabViews() {
        stackView.arrangedSubviews.forEach { stackView.removeArrangedSubview($0); $0.removeFromSuperview() }
        tabViews.removeAll()

        for tab in tabs {
            let isActive = tab.id == activeTabId
            let tv = EditorTabItemView(
                tab: tab,
                isActive: isActive,
                activeBg: activeBg,
                textColor: textColor,
                dimColor: dimColor,
                accentDot: accentDot,
                closeSize: closeSize,
                dotSize: dotSize,
                minWidth: tabMinWidth,
                maxWidth: tabMaxWidth,
                height: tabHeight
            )
            tv.onSelect = { [weak self] in self?.selectTab(id: tab.id) }
            tv.onClose  = { [weak self] in self?.closeTab(id: tab.id) }
            stackView.addArrangedSubview(tv)
            tabViews.append(tv)
        }
    }

    // MARK: - Actions

    private func selectTab(id: String) {
        activeTabId = id
        for (i, tab) in tabs.enumerated() {
            tabViews[safe: i]?.configure(tab: tab, isActive: tab.id == id)
        }
        delegate?.editorTabBar(self, didSelectTabId: id)
        needsDisplay = true
    }

    private func closeTab(id: String) {
        guard id != "terminal" else { return }
        delegate?.editorTabBar(self, didCloseTabId: id)
    }

    // MARK: - Theme

    func applyTheme(bg: NSColor, text: NSColor, border: NSColor) {
        bgColor = bg
        textColor = text
        borderColor = border
        layer?.backgroundColor = bg.cgColor
        rebuildTabViews()
        needsDisplay = true
    }
}

// MARK: - EditorTabItemView

private final class EditorTabItemView: NSView {

    var onSelect: (() -> Void)?
    var onClose: (() -> Void)?

    private var tab: EditorTab
    private var isActive: Bool

    private let activeBg: NSColor
    private let textColor: NSColor
    private let dimColor: NSColor
    private let accentDot: NSColor
    private let closeSize: CGFloat
    private let dotSize: CGFloat
    private let minWidth: CGFloat
    private let maxWidth: CGFloat
    private let height: CGFloat

    private var titleLabel: NSTextField!
    private var closeBtn: NSButton!
    private var dotIndicator: NSView!

    init(tab: EditorTab, isActive: Bool,
         activeBg: NSColor, textColor: NSColor, dimColor: NSColor, accentDot: NSColor,
         closeSize: CGFloat, dotSize: CGFloat, minWidth: CGFloat, maxWidth: CGFloat, height: CGFloat) {
        self.tab = tab
        self.isActive = isActive
        self.activeBg = activeBg
        self.textColor = textColor
        self.dimColor = dimColor
        self.accentDot = accentDot
        self.closeSize = closeSize
        self.dotSize = dotSize
        self.minWidth = minWidth
        self.maxWidth = maxWidth
        self.height = height
        super.init(frame: .zero)
        setup()
    }

    required init?(coder: NSCoder) { fatalError() }

    private func setup() {
        wantsLayer = true
        layer?.cornerRadius = 5

        // Modified dot
        dotIndicator = NSView(frame: .zero)
        dotIndicator.wantsLayer = true
        dotIndicator.layer?.cornerRadius = dotSize / 2
        dotIndicator.layer?.backgroundColor = accentDot.cgColor
        dotIndicator.translatesAutoresizingMaskIntoConstraints = false
        addSubview(dotIndicator)

        // Title label
        titleLabel = NSTextField(labelWithString: tab.title)
        titleLabel.font = .systemFont(ofSize: 12.5, weight: .regular)
        titleLabel.lineBreakMode = .byTruncatingTail
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        addSubview(titleLabel)

        // Close button (X)
        closeBtn = NSButton(frame: .zero)
        closeBtn.title = ""
        closeBtn.image = NSImage(systemSymbolName: "xmark", accessibilityDescription: "Close")
        closeBtn.imageScaling = .scaleProportionallyDown
        closeBtn.bezelStyle = .inline
        closeBtn.isBordered = false
        closeBtn.contentTintColor = dimColor
        closeBtn.translatesAutoresizingMaskIntoConstraints = false
        closeBtn.target = self
        closeBtn.action = #selector(closeTapped)
        addSubview(closeBtn)

        NSLayoutConstraint.activate([
            dotIndicator.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 8),
            dotIndicator.centerYAnchor.constraint(equalTo: centerYAnchor),
            dotIndicator.widthAnchor.constraint(equalToConstant: dotSize),
            dotIndicator.heightAnchor.constraint(equalToConstant: dotSize),

            titleLabel.leadingAnchor.constraint(equalTo: dotIndicator.trailingAnchor, constant: 6),
            titleLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            titleLabel.trailingAnchor.constraint(equalTo: closeBtn.leadingAnchor, constant: -4),

            closeBtn.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -6),
            closeBtn.centerYAnchor.constraint(equalTo: centerYAnchor),
            closeBtn.widthAnchor.constraint(equalToConstant: closeSize),
            closeBtn.heightAnchor.constraint(equalToConstant: closeSize),

            widthAnchor.constraint(greaterThanOrEqualToConstant: minWidth),
            widthAnchor.constraint(lessThanOrEqualToConstant: maxWidth),
            heightAnchor.constraint(equalToConstant: height),
        ])

        configure(tab: tab, isActive: isActive)

        // Click gesture
        let click = NSClickGestureRecognizer(target: self, action: #selector(selectTapped))
        addGestureRecognizer(click)
    }

    func configure(tab: EditorTab, isActive: Bool) {
        self.tab = tab
        self.isActive = isActive

        titleLabel.stringValue = tab.title
        titleLabel.textColor = isActive ? textColor : textColor.withAlphaComponent(0.65)
        titleLabel.font = .systemFont(ofSize: 12.5, weight: isActive ? .medium : .regular)

        dotIndicator.isHidden = !tab.isModified
        // Terminal tab has no close button
        closeBtn.isHidden = tab.id == "terminal"

        layer?.backgroundColor = isActive ? activeBg.cgColor : NSColor.clear.cgColor
    }

    @objc private func selectTapped() { onSelect?() }
    @objc private func closeTapped()  { onClose?() }
}

// MARK: - Array safe subscript

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
