import Foundation

// @TASK Phase5B - File tree node model
// @SPEC Sources/Clabs/Views/FileTreeView.swift

final class FileNode {
    let path: String
    let name: String
    let isDirectory: Bool
    var children: [FileNode]?
    var isLoaded: Bool = false

    // Directories to exclude
    private static let excludedNames: Set<String> = [
        "node_modules", ".git", ".build", ".swiftpm", ".DS_Store",
        "__pycache__", ".venv", "dist", ".next", "build", "coverage"
    ]

    init(path: String, name: String, isDirectory: Bool) {
        self.path = path
        self.name = name
        self.isDirectory = isDirectory
    }

    // Lazy load children for directory nodes
    func loadChildren() {
        guard isDirectory, !isLoaded else { return }
        isLoaded = true

        let fm = FileManager.default
        let keys: [URLResourceKey] = [.isDirectoryKey, .isHiddenKey]
        guard let contents = try? fm.contentsOfDirectory(
            at: URL(fileURLWithPath: path),
            includingPropertiesForKeys: keys,
            options: [.skipsHiddenFiles]
        ) else {
            children = []
            return
        }

        children = contents
            .filter { url in
                let n = url.lastPathComponent
                guard !n.hasPrefix(".") else { return false }
                guard !FileNode.excludedNames.contains(n) else { return false }
                return true
            }
            .map { url -> FileNode in
                let isDir = (try? url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) ?? false
                return FileNode(path: url.path, name: url.lastPathComponent, isDirectory: isDir)
            }
            .sorted { a, b in
                // Directories first, then alphabetical
                if a.isDirectory != b.isDirectory { return a.isDirectory }
                return a.name.localizedCaseInsensitiveCompare(b.name) == .orderedAscending
            }
    }
}
