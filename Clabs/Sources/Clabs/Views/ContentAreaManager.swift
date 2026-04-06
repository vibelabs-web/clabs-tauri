import AppKit

// @TASK Phase5C - ContentAreaManager: terminal/editor switching inside contentArea
// @SPEC Sources/Clabs/App/AppDelegate.swift (contentArea)

// MARK: - ContentAreaManagerDelegate

protocol ContentAreaManagerDelegate: AnyObject {
    func contentAreaManager(_ manager: ContentAreaManager, didChangeActiveTab id: String)
}

// MARK: - ContentAreaManager

/// Manages EditorTabBar + Terminal/Editor switching inside the contentArea NSView.
final class ContentAreaManager {

    // MARK: - State

    weak var delegate: ContentAreaManagerDelegate?

    private weak var contentArea: NSView?

    // Tab bar (always at top of contentArea)
    private let tabBar: EditorTabBar

    // The terminal split view supplied externally
    private var terminalView: NSView?

    // Open editors: fileId -> EditorView
    private var editorViews: [String: EditorView] = [:]

    // Tab list (Terminal tab is always first)
    private var tabs: [EditorTab] = [.terminal]
    private var activeTabId: String = "terminal"

    // MARK: - Init

    init(contentArea: NSView) {
        self.contentArea = contentArea
        self.tabBar = EditorTabBar(frame: NSRect(
            x: 0,
            y: contentArea.bounds.height - EditorTabBar.barHeight,
            width: contentArea.bounds.width,
            height: EditorTabBar.barHeight
        ))
        tabBar.autoresizingMask = [.width, .minYMargin]
        tabBar.delegate = self
        contentArea.addSubview(tabBar)
    }

    // MARK: - Terminal view injection

    /// Called once after SplitPaneView is built for the active workspace tab.
    func setTerminalView(_ view: NSView) {
        terminalView?.removeFromSuperview()
        terminalView = view
        view.autoresizingMask = [.width, .height]
        // Size: below tab bar
        view.frame = contentFrame()
        // Make sure it's below tab bar in z-order
        if let ca = contentArea {
            ca.addSubview(view, positioned: .below, relativeTo: tabBar)
        }
        // Show terminal if active
        view.isHidden = (activeTabId != "terminal")
    }

    // MARK: - Open / close file

    func openFile(path: String) {
        // If already open → just activate
        if tabs.contains(where: { $0.id == path }) {
            activateTab(id: path)
            return
        }

        let name = (path as NSString).lastPathComponent
        let tab = EditorTab(id: path, title: name, isModified: false)
        tabs.append(tab)

        let editor = EditorView(frame: contentFrame())
        editor.autoresizingMask = [.width, .height]
        editor.delegate = self
        editor.load(path: path)
        editor.isHidden = true
        editorViews[path] = editor
        contentArea?.addSubview(editor, positioned: .below, relativeTo: tabBar)

        syncTabBar()
        activateTab(id: path)
    }

    func closeFile(path: String) {
        guard let idx = tabs.firstIndex(where: { $0.id == path }) else { return }

        // Prompt if modified
        if let editor = editorViews[path], editor.isModified {
            let alert = NSAlert()
            alert.messageText = "저장하지 않은 변경 사항이 있습니다."
            alert.informativeText = "\((path as NSString).lastPathComponent)의 변경 사항을 저장하시겠습니까?"
            alert.addButton(withTitle: "저장")
            alert.addButton(withTitle: "저장 안 함")
            alert.addButton(withTitle: "취소")
            let resp = alert.runModal()
            if resp == .alertFirstButtonReturn {
                editor.save()
            } else if resp == .alertThirdButtonReturn {
                return // Cancel
            }
        }

        editorViews[path]?.removeFromSuperview()
        editorViews.removeValue(forKey: path)
        tabs.remove(at: idx)

        // Switch to adjacent tab
        if activeTabId == path {
            let nextIdx = min(idx - 1, tabs.count - 1)
            let nextId = tabs[max(0, nextIdx)].id
            activateTab(id: nextId)
        }
        syncTabBar()
    }

    // MARK: - Save current

    func saveCurrentEditor() {
        guard activeTabId != "terminal",
              let editor = editorViews[activeTabId] else { return }
        editor.save()
    }

    // MARK: - Private helpers

    private func activateTab(id: String) {
        activeTabId = id

        // Show/hide terminal
        terminalView?.isHidden = (id != "terminal")

        // Show/hide editors
        for (path, editor) in editorViews {
            editor.isHidden = (path != id)
            // Resize in case contentArea changed
            if !editor.isHidden {
                editor.frame = contentFrame()
                // Focus text view
                DispatchQueue.main.async {
                    editor.becomeFirstResponder()
                }
            }
        }

        syncTabBar()
        delegate?.contentAreaManager(self, didChangeActiveTab: id)
    }

    private func syncTabBar() {
        tabBar.setTabs(tabs, activeId: activeTabId)
    }

    /// Frame for content below tab bar
    private func contentFrame() -> NSRect {
        guard let ca = contentArea else { return .zero }
        let h = ca.bounds.height - EditorTabBar.barHeight
        return NSRect(x: 0, y: 0, width: ca.bounds.width, height: max(0, h))
    }

    // MARK: - Resize support

    func updateFrames() {
        let cf = contentFrame()
        tabBar.frame = NSRect(
            x: 0,
            y: cf.height,
            width: contentArea?.bounds.width ?? 0,
            height: EditorTabBar.barHeight
        )
        terminalView?.frame = cf
        for editor in editorViews.values {
            editor.frame = cf
        }
    }
}

// MARK: - EditorTabBarDelegate

extension ContentAreaManager: EditorTabBarDelegate {

    func editorTabBar(_ bar: EditorTabBar, didSelectTabId id: String) {
        activateTab(id: id)
    }

    func editorTabBar(_ bar: EditorTabBar, didCloseTabId id: String) {
        closeFile(path: id)
    }
}

// MARK: - EditorViewDelegate

extension ContentAreaManager: EditorViewDelegate {

    func editorView(_ view: EditorView, didChangeModified isModified: Bool) {
        tabBar.markModified(tabId: view.filePath, isModified: isModified)
    }
}
