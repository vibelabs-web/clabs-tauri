import Foundation

// MARK: - WorkspaceTab

class WorkspaceTab {
    let id: String
    var title: String
    var projectPath: String
    var rootPane: PaneNode

    init(projectPath: String) {
        self.id = UUID().uuidString
        let folderName = URL(fileURLWithPath: projectPath).lastPathComponent
        self.title = folderName.isEmpty ? "Terminal" : folderName
        self.projectPath = projectPath
        let leaf = PaneLeaf(name: self.title)
        self.rootPane = .leaf(leaf)
    }

    /// The id of the first (root-level) leaf pane.
    var rootLeafId: String {
        switch rootPane {
        case .leaf(let l): return l.id
        case .split(let s): return s.first.allLeaves().first?.id ?? id
        }
    }

    /// All leaf ids in this tab.
    var allLeafIds: [String] {
        rootPane.allLeaves().map(\.id)
    }

    /// Split the pane with the given id.
    func split(paneId: String, direction: SplitDirection) -> PaneLeaf? {
        guard case .leaf(_) = rootPane.find(id: paneId) else { return nil }
        let newLeaf = PaneLeaf(name: title)
        guard let targetNode = rootPane.find(id: paneId) else { return nil }
        let split = PaneSplit(first: targetNode, second: .leaf(newLeaf), direction: direction)
        rootPane = rootPane.replacing(id: paneId, with: .split(split))
        return newLeaf
    }

    /// Remove a pane from the tree. Returns false if it was the last pane.
    @discardableResult
    func removePane(id: String) -> Bool {
        guard let newRoot = rootPane.removing(id: id) else {
            return false // last pane; caller should close the tab
        }
        rootPane = newRoot
        return true
    }
}
