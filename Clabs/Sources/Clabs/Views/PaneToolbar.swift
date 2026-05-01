import AppKit

/// Callback actions for PaneToolbar buttons
protocol PaneToolbarDelegate: AnyObject {
    func paneToolbar(_ toolbar: PaneToolbar, didRequestSplit direction: SplitDirection, forPane paneId: String)
    func paneToolbar(_ toolbar: PaneToolbar, didRequestClose paneId: String)
}

/// Small toolbar overlay at the top-right of each terminal pane.
/// Shows split (horizontal/vertical) and close buttons.
final class PaneToolbar: NSView {

    static let height: CGFloat = 28

    weak var delegate: PaneToolbarDelegate?
    var paneId: String = ""

    private var hSplitBtn: NSButton!
    private var vSplitBtn: NSButton!
    private var closeBtn: NSButton!

    override init(frame: NSRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        wantsLayer = true
        layer?.backgroundColor = NSColor(white: 0.1, alpha: 0.7).cgColor
        layer?.cornerRadius = 4

        let btnSize: CGFloat = 22
        let spacing: CGFloat = 2
        var x: CGFloat = 4

        // Vertical split (좌우 분할)
        vSplitBtn = makeButton(
            symbol: "rectangle.split.2x1",
            tooltip: "수직 분할",
            action: #selector(splitVertical)
        )
        vSplitBtn.frame = NSRect(x: x, y: (PaneToolbar.height - btnSize) / 2, width: btnSize, height: btnSize)
        addSubview(vSplitBtn)
        x += btnSize + spacing

        // Horizontal split (상하 분할)
        hSplitBtn = makeButton(
            symbol: "rectangle.split.1x2",
            tooltip: "수평 분할",
            action: #selector(splitHorizontal)
        )
        hSplitBtn.frame = NSRect(x: x, y: (PaneToolbar.height - btnSize) / 2, width: btnSize, height: btnSize)
        addSubview(hSplitBtn)
        x += btnSize + spacing

        // Close pane
        closeBtn = makeButton(
            symbol: "xmark",
            tooltip: "패인 닫기",
            action: #selector(closePane)
        )
        closeBtn.frame = NSRect(x: x, y: (PaneToolbar.height - btnSize) / 2, width: btnSize, height: btnSize)
        addSubview(closeBtn)
    }

    private func makeButton(symbol: String, tooltip: String, action: Selector) -> NSButton {
        let btn = NSButton(frame: .zero)
        btn.bezelStyle = .inline
        btn.isBordered = false
        btn.image = NSImage(systemSymbolName: symbol, accessibilityDescription: tooltip)
        btn.contentTintColor = .lightGray
        btn.toolTip = tooltip
        btn.target = self
        btn.action = action
        return btn
    }

    @objc private func splitHorizontal() {
        delegate?.paneToolbar(self, didRequestSplit: .horizontal, forPane: paneId)
    }

    @objc private func splitVertical() {
        delegate?.paneToolbar(self, didRequestSplit: .vertical, forPane: paneId)
    }

    @objc private func closePane() {
        delegate?.paneToolbar(self, didRequestClose: paneId)
    }

    /// Preferred width based on button count
    static var preferredWidth: CGFloat {
        let btnW: CGFloat = 22
        let sp: CGFloat = 2
        let pad: CGFloat = 4
        return pad + btnW * 3 + sp * 2 + pad
    }
}
