import AppKit

// MARK: - SplitPaneDelegate

protocol SplitPaneDelegate: AnyObject {
    /// Called when a leaf pane needs a GhosttyNSView installed.
    func splitPane(_ view: SplitPaneView, createViewForPane paneId: String) -> GhosttyNSView
    /// Called when the ratio of a split changes via divider drag.
    func splitPane(_ view: SplitPaneView, didChangeRatioFor splitId: String, to ratio: Double)
}

// MARK: - SplitPaneView

/// Recursively renders a PaneNode tree using nested NSSplitViews.
/// Leaf nodes host a GhosttyNSView; split nodes create a child NSSplitView.
final class SplitPaneView: NSView {

    weak var delegate: SplitPaneDelegate?

    private(set) var rootNode: PaneNode
    private var splitViewControllers: [String: ManagedSplitViewController] = [:]

    init(frame: NSRect, rootNode: PaneNode) {
        self.rootNode = rootNode
        super.init(frame: frame)
        wantsLayer = true
        // NOTE: buildLayout is NOT called here — delegate is nil at init time.
        // Call build() after setting delegate.
    }

    /// Must be called after setting delegate.
    func build() {
        buildLayout(from: rootNode, into: self)
    }

    required init?(coder: NSCoder) { fatalError("not supported") }

    // MARK: - Layout build

    private func buildLayout(from node: PaneNode, into container: NSView) {
        switch node {
        case .leaf(let leaf):
            guard let delegate else { return }
            let termView = delegate.splitPane(self, createViewForPane: leaf.id)
            termView.translatesAutoresizingMaskIntoConstraints = false
            container.addSubview(termView)
            NSLayoutConstraint.activate([
                termView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
                termView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
                termView.topAnchor.constraint(equalTo: container.topAnchor),
                termView.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            ])

        case .split(let split):
            let controller = ManagedSplitViewController(split: split)
            controller.splitDelegate = self
            splitViewControllers[split.id] = controller

            let splitView = controller.splitView
            splitView.translatesAutoresizingMaskIntoConstraints = false
            container.addSubview(splitView)
            NSLayoutConstraint.activate([
                splitView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
                splitView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
                splitView.topAnchor.constraint(equalTo: container.topAnchor),
                splitView.bottomAnchor.constraint(equalTo: container.bottomAnchor),
            ])

            buildLayout(from: split.first, into: controller.firstPane)
            buildLayout(from: split.second, into: controller.secondPane)
        }
    }

    // MARK: - Public: reload

    func reload(rootNode: PaneNode) {
        self.rootNode = rootNode
        subviews.forEach { $0.removeFromSuperview() }
        splitViewControllers.removeAll()
        buildLayout(from: rootNode, into: self) // OK here — delegate is already set
    }
}

// MARK: - SplitPaneView: ManagedSplitViewControllerDelegate

extension SplitPaneView: ManagedSplitViewControllerDelegate {
    func managedSplit(_ ctrl: ManagedSplitViewController, didChangeRatioTo ratio: Double) {
        delegate?.splitPane(self, didChangeRatioFor: ctrl.splitId, to: ratio)
    }
}

// MARK: - ManagedSplitViewControllerDelegate

protocol ManagedSplitViewControllerDelegate: AnyObject {
    func managedSplit(_ ctrl: ManagedSplitViewController, didChangeRatioTo ratio: Double)
}

// MARK: - ManagedSplitViewController

/// Wraps an NSSplitView for one PaneSplit node and reports ratio changes.
final class ManagedSplitViewController: NSObject, NSSplitViewDelegate {

    let splitId: String
    let splitView: NSSplitView
    let firstPane: NSView
    let secondPane: NSView
    private var initialRatio: Double
    weak var splitDelegate: ManagedSplitViewControllerDelegate?

    init(split: PaneSplit) {
        self.splitId = split.id
        self.initialRatio = split.ratio

        let sv = NSSplitView(frame: .zero)
        sv.isVertical = split.direction == .horizontal // horizontal split = vertical divider
        sv.dividerStyle = .thin
        sv.autoresizingMask = [.width, .height]

        let first = NSView(frame: .zero)
        let second = NSView(frame: .zero)
        sv.addArrangedSubview(first)
        sv.addArrangedSubview(second)

        self.splitView = sv
        self.firstPane = first
        self.secondPane = second
        super.init()
        sv.delegate = self
    }

    // Apply initial ratio after the split view has been laid out.
    func applyInitialRatio() {
        guard splitView.frame.width > 0 || splitView.frame.height > 0 else { return }
        if splitView.isVertical {
            let w = splitView.frame.width * CGFloat(initialRatio)
            splitView.setPosition(w, ofDividerAt: 0)
        } else {
            let h = splitView.frame.height * CGFloat(initialRatio)
            splitView.setPosition(h, ofDividerAt: 0)
        }
    }

    // NSSplitViewDelegate
    func splitViewDidResizeSubviews(_ notification: Notification) {
        let total = splitView.isVertical ? splitView.frame.width : splitView.frame.height
        guard total > 0 else { return }
        let firstSize = splitView.isVertical ? firstPane.frame.width : firstPane.frame.height
        let ratio = Double(firstSize / total)
        splitDelegate?.managedSplit(self, didChangeRatioTo: ratio)
    }
}
