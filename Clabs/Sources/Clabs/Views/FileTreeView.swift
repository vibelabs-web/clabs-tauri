import AppKit

// @TASK Phase5B - File explorer tree view using NSOutlineView
// @SPEC Sources/Clabs/Terminal/FileNode.swift

// MARK: - FileTreeDelegate

protocol FileTreeDelegate: AnyObject {
    func fileTree(_ view: FileTreeView, didRequestOpenFile path: String)
}

// MARK: - FileTreeView

final class FileTreeView: NSView {

    weak var delegate: FileTreeDelegate?

    private var outlineView: NSOutlineView!
    private var scrollView: NSScrollView!
    private var rootNode: FileNode?

    // Theme colours
    private var bgColor: NSColor = NSColor(white: 0.10, alpha: 1)
    private var textPrimary: NSColor = NSColor(white: 0.92, alpha: 1)
    private var textSecondary: NSColor = NSColor(white: 0.55, alpha: 1)
    private var selectedBg: NSColor = NSColor(srgbRed: 0.20, green: 0.44, blue: 0.78, alpha: 0.35)

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        setupOutlineView()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupOutlineView()
    }

    // MARK: - Setup

    private func setupOutlineView() {
        wantsLayer = true
        layer?.backgroundColor = bgColor.cgColor

        let column = NSTableColumn(identifier: NSUserInterfaceItemIdentifier("file"))
        column.minWidth = 80

        outlineView = NSOutlineView()
        outlineView.addTableColumn(column)
        outlineView.outlineTableColumn = column
        outlineView.headerView = nil
        outlineView.rowHeight = 24
        outlineView.backgroundColor = .clear
        if #available(macOS 12.0, *) {
            outlineView.style = .sourceList
        } else {
            outlineView.selectionHighlightStyle = .sourceList
        }
        outlineView.indentationPerLevel = 14
        outlineView.dataSource = self
        outlineView.delegate = self
        outlineView.doubleAction = #selector(didDoubleClick)
        outlineView.target = self
        outlineView.focusRingType = .none

        scrollView = NSScrollView(frame: bounds)
        scrollView.autoresizingMask = [.width, .height]
        scrollView.hasVerticalScroller = true
        scrollView.scrollerStyle = .overlay
        scrollView.drawsBackground = false
        scrollView.backgroundColor = .clear
        scrollView.documentView = outlineView
        addSubview(scrollView)
    }

    // MARK: - Public API

    func load(rootPath: String) {
        let root = FileNode(path: rootPath, name: (rootPath as NSString).lastPathComponent, isDirectory: true)
        root.loadChildren()
        rootNode = root
        outlineView.reloadData()
        // Expand root immediately
        if let r = rootNode {
            outlineView.expandItem(r)
        }
    }

    func applyTheme(bg: NSColor, text: NSColor, secondary: NSColor) {
        bgColor = bg
        textPrimary = text
        textSecondary = secondary
        layer?.backgroundColor = bg.cgColor
        outlineView.reloadData()
    }

    // MARK: - Actions

    @objc private func didDoubleClick() {
        guard outlineView.clickedRow >= 0 else { return }
        guard let node = outlineView.item(atRow: outlineView.clickedRow) as? FileNode else { return }
        if !node.isDirectory {
            delegate?.fileTree(self, didRequestOpenFile: node.path)
        }
    }
}

// MARK: - NSOutlineViewDataSource

extension FileTreeView: NSOutlineViewDataSource {

    func outlineView(_ outlineView: NSOutlineView, numberOfChildrenOfItem item: Any?) -> Int {
        if item == nil {
            return rootNode == nil ? 0 : 1
        }
        guard let node = item as? FileNode, node.isDirectory else { return 0 }
        if !node.isLoaded { node.loadChildren() }
        return node.children?.count ?? 0
    }

    func outlineView(_ outlineView: NSOutlineView, child index: Int, ofItem item: Any?) -> Any {
        if item == nil { return rootNode! }
        let node = item as! FileNode
        if !node.isLoaded { node.loadChildren() }
        return node.children![index]
    }

    func outlineView(_ outlineView: NSOutlineView, isItemExpandable item: Any) -> Bool {
        guard let node = item as? FileNode else { return false }
        return node.isDirectory
    }
}

// MARK: - NSOutlineViewDelegate

extension FileTreeView: NSOutlineViewDelegate {

    func outlineView(_ outlineView: NSOutlineView, viewFor tableColumn: NSTableColumn?, item: Any) -> NSView? {
        guard let node = item as? FileNode else { return nil }

        let id = NSUserInterfaceItemIdentifier("FileCell")
        var cell = outlineView.makeView(withIdentifier: id, owner: nil) as? FileCell
        if cell == nil {
            cell = FileCell(identifier: id)
        }
        cell?.configure(node: node, textColor: node.isDirectory ? textPrimary : textSecondary.withAlphaComponent(0.9))
        return cell
    }

    func outlineView(_ outlineView: NSOutlineView, rowViewForItem item: Any) -> NSTableRowView? {
        let rv = DarkRowView()
        return rv
    }

    func outlineViewItemWillExpand(_ notification: Notification) {
        guard let node = notification.userInfo?["NSObject"] as? FileNode else { return }
        if !node.isLoaded { node.loadChildren() }
    }
}

// MARK: - FileCell

private final class FileCell: NSTableCellView {

    private let iconView = NSImageView()
    private let nameLabel = NSTextField(labelWithString: "")

    init(identifier: NSUserInterfaceItemIdentifier) {
        super.init(frame: .zero)
        self.identifier = identifier

        iconView.imageScaling = .scaleProportionallyDown
        iconView.frame = NSRect(x: 2, y: 3, width: 16, height: 16)
        addSubview(iconView)

        nameLabel.font = .systemFont(ofSize: 13)
        nameLabel.lineBreakMode = .byTruncatingTail
        nameLabel.frame = NSRect(x: 22, y: 3, width: 200, height: 18)
        nameLabel.autoresizingMask = [.width]
        addSubview(nameLabel)
    }

    required init?(coder: NSCoder) { fatalError() }

    func configure(node: FileNode, textColor: NSColor) {
        nameLabel.stringValue = node.name
        nameLabel.textColor = textColor

        if node.isDirectory {
            iconView.image = NSImage(systemSymbolName: "folder.fill", accessibilityDescription: nil)
            iconView.contentTintColor = NSColor(srgbRed: 0.95, green: 0.77, blue: 0.28, alpha: 1)
        } else {
            iconView.image = iconForFile(node.name)
            iconView.contentTintColor = textColor.withAlphaComponent(0.6)
        }
    }

    private func iconForFile(_ name: String) -> NSImage? {
        let ext = (name as NSString).pathExtension.lowercased()
        let symbolName: String
        switch ext {
        case "swift":       symbolName = "swift"
        case "ts", "tsx":   symbolName = "t.square"
        case "js", "jsx":   symbolName = "j.square"
        case "py":          symbolName = "p.square"
        case "json":        symbolName = "curlybraces"
        case "md":          symbolName = "doc.text"
        case "yaml", "yml": symbolName = "list.bullet.indent"
        case "sh", "zsh":   symbolName = "terminal"
        case "png", "jpg", "jpeg", "gif", "svg", "webp":
                            symbolName = "photo"
        default:            symbolName = "doc"
        }
        return NSImage(systemSymbolName: symbolName, accessibilityDescription: nil)
    }
}

// MARK: - DarkRowView

private final class DarkRowView: NSTableRowView {
    override var isSelected: Bool {
        didSet { needsDisplay = true }
    }
    override func drawSelection(in dirtyRect: NSRect) {
        NSColor(srgbRed: 0.20, green: 0.44, blue: 0.78, alpha: 0.30).setFill()
        NSBezierPath(roundedRect: bounds.insetBy(dx: 2, dy: 1), xRadius: 4, yRadius: 4).fill()
    }
}
