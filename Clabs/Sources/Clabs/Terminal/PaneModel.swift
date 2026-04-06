import Foundation

// MARK: - SplitDirection

enum SplitDirection {
    case horizontal
    case vertical
}

// MARK: - PaneNode

indirect enum PaneNode {
    case leaf(PaneLeaf)
    case split(PaneSplit)

    var id: String {
        switch self {
        case .leaf(let l): return l.id
        case .split(let s): return s.id
        }
    }

    /// Collect all leaf nodes in depth-first order.
    func allLeaves() -> [PaneLeaf] {
        switch self {
        case .leaf(let l):
            return [l]
        case .split(let s):
            return s.first.allLeaves() + s.second.allLeaves()
        }
    }

    /// Find a node by id.
    func find(id: String) -> PaneNode? {
        if self.id == id { return self }
        if case .split(let s) = self {
            return s.first.find(id: id) ?? s.second.find(id: id)
        }
        return nil
    }

    /// Replace a node by id, returning a new tree.
    func replacing(id: String, with replacement: PaneNode) -> PaneNode {
        if self.id == id { return replacement }
        if case .split(var s) = self {
            s.first = s.first.replacing(id: id, with: replacement)
            s.second = s.second.replacing(id: id, with: replacement)
            return .split(s)
        }
        return self
    }

    /// Remove a leaf by id; if its sibling is also a leaf the parent split
    /// collapses into that sibling. Returns nil when the tree becomes empty.
    func removing(id: String) -> PaneNode? {
        switch self {
        case .leaf(let l):
            return l.id == id ? nil : self
        case .split(var s):
            let firstRemoved = s.first.removing(id: id)
            let secondRemoved = s.second.removing(id: id)
            if firstRemoved == nil { return s.second }
            if secondRemoved == nil { return s.first }
            s.first = firstRemoved!
            s.second = secondRemoved!
            return .split(s)
        }
    }
}

// MARK: - PaneLeaf

struct PaneLeaf {
    let id: String
    var name: String

    init(name: String = "Terminal") {
        self.id = "pane-\(UUID().uuidString)"
        self.name = name
    }
}

// MARK: - PaneSplit

struct PaneSplit {
    let id: String
    var first: PaneNode
    var second: PaneNode
    var direction: SplitDirection
    var ratio: Double // 0.0–1.0, fraction for `first`

    init(first: PaneNode, second: PaneNode, direction: SplitDirection, ratio: Double = 0.5) {
        self.id = "split-\(UUID().uuidString)"
        self.first = first
        self.second = second
        self.direction = direction
        self.ratio = ratio
    }
}
