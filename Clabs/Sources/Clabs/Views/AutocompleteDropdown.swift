import AppKit

// @TASK Phase3C - AutocompleteDropdown: keyboard-navigable popup for slash/history/path completions

// MARK: - DropdownItem

struct DropdownItem {
    enum Icon { case slashBuiltin, slashSkill, folder, file, history }

    let label: String
    let description: String
    let value: String          // text inserted on selection
    let icon: Icon
}

// MARK: - AutocompleteDropdownDelegate

protocol AutocompleteDropdownDelegate: AnyObject {
    func dropdown(_ dropdown: AutocompleteDropdown, didSelect item: DropdownItem)
    func dropdownDidClose(_ dropdown: AutocompleteDropdown)
}

// MARK: - AutocompleteDropdown

/// A floating NSView that shows a list of completions above the InputBox.
final class AutocompleteDropdown: NSView {

    // MARK: - Colours
    private let bgColor       = NSColor(srgbRed: 0.110, green: 0.133, blue: 0.157, alpha: 1) // #1c2128
    private let borderColor   = NSColor(srgbRed: 0.188, green: 0.212, blue: 0.239, alpha: 1) // #30363d
    private let textColor     = NSColor(srgbRed: 0.902, green: 0.929, blue: 0.953, alpha: 1) // #e6edf3
    private let descColor     = NSColor(srgbRed: 0.545, green: 0.584, blue: 0.616, alpha: 1) // #8b949e
    private let selectionColor = NSColor(srgbRed: 0.345, green: 0.651, blue: 1.0, alpha: 0.18) // #58a6ff tinted
    private let accentColor   = NSColor(srgbRed: 0.345, green: 0.651, blue: 1.0, alpha: 1)   // #58a6ff

    // MARK: - Layout
    static let rowHeight: CGFloat = 36
    static let maxVisibleRows: Int = 8
    static let width: CGFloat = 460

    // MARK: - State
    private var items: [DropdownItem] = []
    private(set) var selectedIndex: Int = 0

    private var scrollView: NSScrollView!
    private var stackView: NSStackView!
    private var rowViews: [DropdownRowView] = []

    weak var delegate: AutocompleteDropdownDelegate?

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        buildUI()
    }

    required init?(coder: NSCoder) { fatalError("not supported") }

    private func buildUI() {
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor
        layer?.cornerRadius = 8
        layer?.borderWidth = 1
        layer?.borderColor = borderColor.cgColor

        // Drop shadow
        layer?.shadowColor = NSColor.black.cgColor
        layer?.shadowOpacity = 0.5
        layer?.shadowRadius = 12
        layer?.shadowOffset = CGSize(width: 0, height: -4)

        stackView = NSStackView(frame: .zero)
        stackView.orientation = .vertical
        stackView.spacing = 0
        stackView.alignment = .leading
        stackView.distribution = .fill

        scrollView = NSScrollView(frame: .zero)
        scrollView.drawsBackground = false
        scrollView.hasVerticalScroller = true
        scrollView.hasHorizontalScroller = false
        scrollView.autohidesScrollers = true
        scrollView.documentView = stackView

        addSubview(scrollView)
        scrollView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            scrollView.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 4),
            scrollView.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -4),
            scrollView.topAnchor.constraint(equalTo: topAnchor, constant: 6),
            scrollView.bottomAnchor.constraint(equalTo: bottomAnchor, constant: -6),
        ])
    }

    // MARK: - Public API

    func reload(items: [DropdownItem]) {
        self.items = items
        self.selectedIndex = 0
        rebuildRows()
        updateHeight()
    }

    func moveSelection(by delta: Int) {
        let newIdx = (selectedIndex + delta)
            .clamped(to: 0...(max(items.count - 1, 0)))
        selectedIndex = newIdx
        updateRowHighlights()
        scrollToSelected()
    }

    func confirmSelection() {
        guard selectedIndex < items.count else { return }
        delegate?.dropdown(self, didSelect: items[selectedIndex])
    }

    // MARK: - Row building

    private func rebuildRows() {
        // Remove old rows
        rowViews.forEach { $0.removeFromSuperview() }
        rowViews = []
        stackView.arrangedSubviews.forEach { stackView.removeArrangedSubview($0) }

        for (idx, item) in items.enumerated() {
            let row = DropdownRowView(
                item: item,
                index: idx,
                textColor: textColor,
                descColor: descColor,
                selectionColor: selectionColor,
                accentColor: accentColor
            )
            row.translatesAutoresizingMaskIntoConstraints = false
            row.heightAnchor.constraint(equalToConstant: Self.rowHeight).isActive = true
            row.widthAnchor.constraint(equalToConstant: Self.width - 8).isActive = true
            row.onClick = { [weak self] in
                guard let self else { return }
                self.selectedIndex = idx
                self.delegate?.dropdown(self, didSelect: item)
            }
            stackView.addArrangedSubview(row)
            rowViews.append(row)
        }

        updateRowHighlights()

        // Force layout so scrollView knows content size
        stackView.needsLayout = true
        stackView.layoutSubtreeIfNeeded()
        stackView.frame = NSRect(
            x: 0, y: 0,
            width: Self.width - 8,
            height: CGFloat(items.count) * Self.rowHeight
        )
    }

    private func updateRowHighlights() {
        for (idx, row) in rowViews.enumerated() {
            row.setHighlighted(idx == selectedIndex)
        }
    }

    private func updateHeight() {
        let visible = min(items.count, Self.maxVisibleRows)
        let contentH = CGFloat(visible) * Self.rowHeight
        let frameH = contentH + 12  // top + bottom padding
        var f = frame
        f.size.height = frameH
        frame = f
    }

    private func scrollToSelected() {
        guard selectedIndex < rowViews.count else { return }
        let row = rowViews[selectedIndex]
        scrollView.contentView.scrollToVisible(row.frame)
    }
}

// MARK: - Int clamped extension

private extension Int {
    func clamped(to range: ClosedRange<Int>) -> Int {
        Swift.max(range.lowerBound, Swift.min(self, range.upperBound))
    }
}

// MARK: - DropdownRowView

private final class DropdownRowView: NSView {

    var onClick: (() -> Void)?

    private let iconLabel = NSTextField(labelWithString: "")
    private let titleLabel = NSTextField(labelWithString: "")
    private let descLabel = NSTextField(labelWithString: "")
    private var bgLayer: CALayer?

    init(
        item: DropdownItem,
        index: Int,
        textColor: NSColor,
        descColor: NSColor,
        selectionColor: NSColor,
        accentColor: NSColor
    ) {
        super.init(frame: .zero)
        wantsLayer = true

        let bg = CALayer()
        bg.cornerRadius = 6
        bg.backgroundColor = NSColor.clear.cgColor
        layer?.addSublayer(bg)
        bgLayer = bg

        // Icon
        iconLabel.font = .systemFont(ofSize: 13)
        iconLabel.isEditable = false
        iconLabel.isBordered = false
        iconLabel.drawsBackground = false
        iconLabel.stringValue = iconGlyph(for: item.icon, type: item.icon)
        iconLabel.textColor = item.icon == .slashBuiltin || item.icon == .slashSkill ? accentColor : descColor

        // Title
        titleLabel.font = .monospacedSystemFont(ofSize: 12, weight: .regular)
        titleLabel.textColor = textColor
        titleLabel.isEditable = false
        titleLabel.isBordered = false
        titleLabel.drawsBackground = false
        titleLabel.stringValue = item.label
        titleLabel.lineBreakMode = .byTruncatingTail

        // Description
        descLabel.font = .systemFont(ofSize: 11)
        descLabel.textColor = descColor
        descLabel.isEditable = false
        descLabel.isBordered = false
        descLabel.drawsBackground = false
        descLabel.stringValue = item.description
        descLabel.lineBreakMode = .byTruncatingTail

        [iconLabel, titleLabel, descLabel].forEach {
            $0.translatesAutoresizingMaskIntoConstraints = false
            addSubview($0)
        }

        NSLayoutConstraint.activate([
            iconLabel.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 10),
            iconLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            iconLabel.widthAnchor.constraint(equalToConstant: 20),

            titleLabel.leadingAnchor.constraint(equalTo: iconLabel.trailingAnchor, constant: 6),
            titleLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            titleLabel.widthAnchor.constraint(lessThanOrEqualToConstant: 200),

            descLabel.leadingAnchor.constraint(equalTo: titleLabel.trailingAnchor, constant: 10),
            descLabel.centerYAnchor.constraint(equalTo: centerYAnchor),
            descLabel.trailingAnchor.constraint(lessThanOrEqualTo: trailingAnchor, constant: -10),
        ])

        // Click gesture
        let click = NSClickGestureRecognizer(target: self, action: #selector(handleClick))
        addGestureRecognizer(click)
    }

    required init?(coder: NSCoder) { fatalError("not supported") }

    override func layout() {
        super.layout()
        bgLayer?.frame = bounds.insetBy(dx: 2, dy: 2)
    }

    func setHighlighted(_ highlighted: Bool) {
        bgLayer?.backgroundColor = highlighted
            ? NSColor(srgbRed: 0.345, green: 0.651, blue: 1.0, alpha: 0.18).cgColor
            : NSColor.clear.cgColor
    }

    @objc private func handleClick() {
        onClick?()
    }

    private func iconGlyph(for icon: DropdownItem.Icon, type _: DropdownItem.Icon) -> String {
        switch icon {
        case .slashBuiltin: return "/"
        case .slashSkill:   return "S"
        case .folder:       return "D"
        case .file:         return "F"
        case .history:      return "H"
        }
    }
}
