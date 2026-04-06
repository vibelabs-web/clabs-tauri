import AppKit
import CGhostty

// MARK: - AppDelegate

class AppDelegate: NSObject, NSApplicationDelegate {

    let ghosttyManager = GhosttyManager()

    // Main window
    private var mainWindow: NSWindow?

    // Tab bar (top strip)
    private let tabBarHeight: CGFloat = 38
    private var tabBarView: TabBarView!

    // Sidebar
    private var sidebarView: SidebarView!
    private var sidebarVisible: Bool = true

    // Terminal content area
    private var contentArea: NSView!

    // InputBox (bottom strip)
    private var inputBoxView: InputBox!

    // Workspace state
    private var tabs: [WorkspaceTab] = []
    private var activeTabId: String = ""

    // Map paneId → GhosttyNSView (all tabs, all panes)
    private var termViews: [String: GhosttyNSView] = [:]

    // Currently visible SplitPaneView
    private var currentSplitView: SplitPaneView?

    // MARK: - App Lifecycle

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)

        let argc = CommandLine.argc
        let argv = CommandLine.unsafeArgv
        let ret = ghostty_init(UInt(argc), argv)
        if ret != GHOSTTY_SUCCESS {
            NSLog("[AppDelegate] ghostty_init FAILED: \(ret)")
            return
        }
        NSLog("[AppDelegate] ghostty_init OK")

        ghosttyManager.initializeApp()

        DispatchQueue.main.async { [self] in
            buildWindow()
            let home = FileManager.default.homeDirectoryForCurrentUser.path
            openNewTab(projectPath: home)
            mainWindow?.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)

            // Auto-test removed — all features verified via logs
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        ghosttyManager.destroyAll()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    // MARK: - Window Setup

    private func buildWindow() {
        let w = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1200, height: 800),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        w.title = "Clabs"
        w.center()

        let root = NSView(frame: w.contentView!.bounds)
        root.autoresizingMask = [.width, .height]
        root.wantsLayer = true
        root.layer?.backgroundColor = NSColor(white: 0.10, alpha: 1).cgColor
        w.contentView = root

        // Tab bar (full width at top)
        tabBarView = TabBarView(frame: NSRect(
            x: 0,
            y: root.bounds.height - tabBarHeight,
            width: root.bounds.width,
            height: tabBarHeight
        ))
        tabBarView.autoresizingMask = [.width, .minYMargin]
        tabBarView.delegate = self
        root.addSubview(tabBarView)

        let bodyHeight = root.bounds.height - tabBarHeight
        let sbW = SidebarView.defaultWidth
        let ibH = InputBox.defaultHeight

        // Sidebar (left column, below tab bar)
        sidebarView = SidebarView(frame: NSRect(
            x: 0,
            y: 0,
            width: sbW,
            height: bodyHeight
        ))
        sidebarView.autoresizingMask = [.height]
        sidebarView.delegate = self
        root.addSubview(sidebarView)

        // InputBox (bottom strip, right of sidebar)
        inputBoxView = InputBox(frame: NSRect(
            x: sbW,
            y: 0,
            width: root.bounds.width - sbW,
            height: ibH
        ))
        inputBoxView.autoresizingMask = [.width, .maxYMargin]
        inputBoxView.ghosttyManager = ghosttyManager
        root.addSubview(inputBoxView)

        // Terminal content area (right of sidebar, above inputbox)
        contentArea = NSView(frame: NSRect(
            x: sbW,
            y: ibH,
            width: root.bounds.width - sbW,
            height: bodyHeight - ibH
        ))
        contentArea.autoresizingMask = [.width, .height]
        root.addSubview(contentArea)

        // Cmd+B: toggle sidebar
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard let self else { return event }
            if event.modifierFlags.contains(.command),
               event.charactersIgnoringModifiers == "b" {
                self.toggleSidebar()
                return nil
            }
            return event
        }

        // Menu shortcuts
        setupMenu()

        // Theme system: propagate changes to all views
        setupThemeMenu()
        ThemeManager.shared.onChange = { [weak self] theme in
            guard let self else { return }
            self.sidebarView?.applyTheme(theme)
            self.tabBarView?.applyTheme(theme)
            self.inputBoxView?.applyTheme(theme)
        }
        // Apply default theme immediately
        ThemeManager.shared.apply(ThemePresets.defaultDark, ghosttyManager: ghosttyManager)

        mainWindow = w
    }

    // MARK: - Sidebar Toggle

    private func toggleSidebar() {
        sidebarVisible.toggle()
        guard let root = mainWindow?.contentView else { return }
        let sbW: CGFloat = sidebarVisible ? SidebarView.defaultWidth : 0
        let ibH = InputBox.defaultHeight
        let bodyHeight = root.bounds.height - tabBarHeight

        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.2
            ctx.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            sidebarView.animator().frame = NSRect(x: 0, y: 0, width: sidebarVisible ? SidebarView.defaultWidth : 0, height: bodyHeight)
            sidebarView.isHidden = !sidebarVisible
            inputBoxView.animator().frame = NSRect(x: sbW, y: 0, width: root.bounds.width - sbW, height: ibH)
            contentArea.animator().frame = NSRect(x: sbW, y: ibH, width: root.bounds.width - sbW, height: bodyHeight - ibH)
        }
        NSLog("[AppDelegate] sidebar %@", sidebarVisible ? "shown" : "hidden")
    }

    // MARK: - Tab Management

    @discardableResult
    func openNewTab(projectPath: String) -> WorkspaceTab {
        let tab = WorkspaceTab(projectPath: projectPath)
        tabs.append(tab)

        // Create a GhosttyNSView for each leaf in this tab's initial tree
        for leaf in tab.rootPane.allLeaves() {
            installTermView(paneId: leaf.id, workingDirectory: tab.projectPath)
        }

        switchToTab(id: tab.id)
        return tab
    }

    func closeTab(id: String) {
        guard let idx = tabs.firstIndex(where: { $0.id == id }) else { return }
        let tab = tabs[idx]

        // Destroy surfaces + views for all panes in this tab
        for leaf in tab.rootPane.allLeaves() {
            removeTermView(paneId: leaf.id)
        }

        tabs.remove(at: idx)

        if tabs.isEmpty {
            NSApp.terminate(nil)
            return
        }

        let nextIdx = min(idx, tabs.count - 1)
        switchToTab(id: tabs[nextIdx].id)
    }

    func switchToTab(id: String) {
        // Hide current split view
        currentSplitView?.removeFromSuperview()
        currentSplitView = nil

        activeTabId = id
        updateTabBar()

        guard let tab = tabs.first(where: { $0.id == id }) else { return }

        // Build a new SplitPaneView for this tab's pane tree
        let splitView = SplitPaneView(frame: contentArea.bounds, rootNode: tab.rootPane)
        splitView.autoresizingMask = [.width, .height]
        splitView.delegate = self
        splitView.build() // must be called AFTER delegate is set
        contentArea.addSubview(splitView)
        currentSplitView = splitView

        mainWindow?.title = "Clabs — \(tab.title)"

        // Force layout so new panes get valid frames → triggers tryCreateSurface
        contentArea.layoutSubtreeIfNeeded()

        // Also delay-trigger surface creation for any panes that didn't get it
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [self] in
            for leaf in tab.rootPane.allLeaves() {
                if let tv = self.termViews[leaf.id], tv.surface == nil {
                    let size = tv.frame.size.width > 0 ? tv.frame.size : tv.bounds.size
                    NSLog("[AppDelegate] forcing surface for pane %@ frame=%.0fx%.0f bounds=%.0fx%.0f", leaf.id, tv.frame.size.width, tv.frame.size.height, tv.bounds.size.width, tv.bounds.size.height)
                    if size.width > 10 && size.height > 10 {
                        _ = self.ghosttyManager.createSurface(paneId: leaf.id, in: tv)
                    } else {
                        // Frame still 0 — try again later
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                            guard let self, let tv = self.termViews[leaf.id], tv.surface == nil else { return }
                            NSLog("[AppDelegate] retry surface for pane %@ frame=%.0fx%.0f", leaf.id, tv.frame.width, tv.frame.height)
                            if tv.frame.width > 10 && tv.frame.height > 10 {
                                _ = self.ghosttyManager.createSurface(paneId: leaf.id, in: tv)
                            }
                        }
                    }
                }
            }
        }

        // Focus the first visible terminal and update InputBox target
        if let firstLeafId = tab.rootPane.allLeaves().first?.id,
           let termView = termViews[firstLeafId] {
            mainWindow?.makeFirstResponder(termView)
            inputBoxView?.activePaneId = firstLeafId
        }
    }

    // MARK: - Pane Views

    private func installTermView(paneId: String, workingDirectory: String) {
        guard termViews[paneId] == nil else { return }
        let tv = GhosttyNSView(frame: .zero)
        tv.manager = ghosttyManager
        tv.paneId = paneId
        termViews[paneId] = tv
        NSLog("[AppDelegate] installed termView for pane \(paneId), wd=\(workingDirectory)")
    }

    private func removeTermView(paneId: String) {
        if let tv = termViews.removeValue(forKey: paneId) {
            tv.removeFromSuperview()
        }
        ghosttyManager.destroySurface(paneId: paneId)
    }

    // MARK: - Tab Bar Updates

    private func updateTabBar() {
        let items = tabs.map { (id: $0.id, title: $0.title) }
        tabBarView.setTabs(items, activeId: activeTabId)
    }

    // MARK: - Split Pane

    private func splitActivePane(direction: SplitDirection) {
        guard let tab = tabs.first(where: { $0.id == activeTabId }) else { return }

        // Find the currently focused pane
        let focusedPaneId: String
        if let firstResponder = mainWindow?.firstResponder as? GhosttyNSView, !firstResponder.paneId.isEmpty {
            focusedPaneId = firstResponder.paneId
        } else if let first = tab.rootPane.allLeaves().first {
            focusedPaneId = first.id
        } else {
            return
        }

        // Split the pane in the model
        guard let newLeaf = tab.split(paneId: focusedPaneId, direction: direction) else {
            NSLog("[AppDelegate] split failed for pane %@", focusedPaneId)
            return
        }

        // Create a GhosttyNSView for the new pane
        installTermView(paneId: newLeaf.id, workingDirectory: tab.projectPath)

        // Rebuild the split view
        switchToTab(id: tab.id)

        NSLog("[AppDelegate] split %@ → new pane %@", focusedPaneId, newLeaf.id)
    }

    // MARK: - Menu / Keyboard Shortcuts

    private func setupMenu() {
        let mainMenu = NSApp.mainMenu ?? NSMenu()
        NSApp.mainMenu = mainMenu

        // App menu
        if mainMenu.item(withTitle: "Clabs") == nil {
            let appItem = NSMenuItem()
            mainMenu.insertItem(appItem, at: 0)
            let appMenu = NSMenu(title: "Clabs")
            appItem.submenu = appMenu
            appMenu.addItem(withTitle: "Quit Clabs", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        }

        // Window/Tab menu
        var tabMenu: NSMenu
        if let existing = mainMenu.item(withTitle: "Window")?.submenu {
            tabMenu = existing
        } else {
            let windowItem = NSMenuItem()
            mainMenu.addItem(windowItem)
            tabMenu = NSMenu(title: "Window")
            windowItem.submenu = tabMenu
        }

        let newTab = NSMenuItem(title: "New Tab", action: #selector(menuNewTab), keyEquivalent: "t")
        newTab.keyEquivalentModifierMask = .command
        newTab.target = self
        tabMenu.addItem(newTab)

        let closeTab = NSMenuItem(title: "Close Tab", action: #selector(menuCloseTab), keyEquivalent: "w")
        closeTab.keyEquivalentModifierMask = .command
        closeTab.target = self
        tabMenu.addItem(closeTab)

        tabMenu.addItem(.separator())

        let prevTab = NSMenuItem(title: "Previous Tab", action: #selector(menuPrevTab), keyEquivalent: "[")
        prevTab.keyEquivalentModifierMask = [.command, .shift]
        prevTab.target = self
        tabMenu.addItem(prevTab)

        let nextTab = NSMenuItem(title: "Next Tab", action: #selector(menuNextTab), keyEquivalent: "]")
        nextTab.keyEquivalentModifierMask = [.command, .shift]
        nextTab.target = self
        tabMenu.addItem(nextTab)
    }

    // MARK: - Theme Menu

    private func setupThemeMenu() {
        let mainMenu = NSApp.mainMenu ?? NSMenu()

        let themeItem = NSMenuItem()
        mainMenu.addItem(themeItem)
        let themeMenu = NSMenu(title: "Theme")
        themeItem.submenu = themeMenu

        for preset in ThemePresets.all {
            let item = NSMenuItem(
                title: preset.name,
                action: #selector(menuSelectTheme(_:)),
                keyEquivalent: ""
            )
            item.target = self
            item.representedObject = preset.id
            themeMenu.addItem(item)
        }
    }

    @objc private func menuSelectTheme(_ sender: NSMenuItem) {
        guard let id = sender.representedObject as? String,
              let theme = ThemePresets.all.first(where: { $0.id == id }) else { return }
        ThemeManager.shared.apply(theme, ghosttyManager: ghosttyManager)
        NSLog("[AppDelegate] theme changed to: %@", theme.name)
    }

    @objc private func menuNewTab() {
        presentFolderPicker { [weak self] path in
            self?.openNewTab(projectPath: path)
        }
    }

    @objc private func menuCloseTab() {
        guard !activeTabId.isEmpty else { return }
        closeTab(id: activeTabId)
    }

    @objc private func menuPrevTab() {
        guard let idx = tabs.firstIndex(where: { $0.id == activeTabId }), idx > 0 else { return }
        switchToTab(id: tabs[idx - 1].id)
    }

    @objc private func menuNextTab() {
        guard let idx = tabs.firstIndex(where: { $0.id == activeTabId }), idx < tabs.count - 1 else { return }
        switchToTab(id: tabs[idx + 1].id)
    }

    // MARK: - Folder Picker

    private func presentFolderPicker(completion: @escaping (String) -> Void) {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.canCreateDirectories = false
        panel.allowsMultipleSelection = false
        panel.prompt = "Open in Terminal"
        panel.message = "Select a project folder"

        guard let window = mainWindow else {
            let home = FileManager.default.homeDirectoryForCurrentUser.path
            completion(home)
            return
        }

        panel.beginSheetModal(for: window) { response in
            if response == .OK, let url = panel.url {
                completion(url.path)
            } else {
                let home = FileManager.default.homeDirectoryForCurrentUser.path
                completion(home)
            }
        }
    }
}

// MARK: - TabBarDelegate

extension AppDelegate: TabBarDelegate {

    func tabBar(_ bar: TabBarView, didSelectTabId id: String) {
        switchToTab(id: id)
    }

    func tabBar(_ bar: TabBarView, didCloseTabId id: String) {
        closeTab(id: id)
    }

    func tabBarDidRequestNewTab(_ bar: TabBarView) {
        presentFolderPicker { [weak self] path in
            self?.openNewTab(projectPath: path)
        }
    }
}

// MARK: - SidebarDelegate

extension AppDelegate: SidebarDelegate {

    func sidebar(_ view: SidebarView, didSelectSkill skill: SkillInfo) {
        // Insert /skillname into InputBox
        inputBoxView?.insertText("/\(skill.name)")
        NSLog("[AppDelegate] sidebar skill selected: %@", skill.name)
    }

    func sidebar(_ view: SidebarView, didSelectCommand command: String) {
        // Send command directly to terminal
        inputBoxView?.insertText(command)
        NSLog("[AppDelegate] sidebar command selected: %@", command)
    }

    func sidebar(_ view: SidebarView, didRequestAction action: SidebarAction) {
        switch action {
        case .newTerminal:
            menuNewTab()
        case .splitHorizontal:
            splitActivePane(direction: .horizontal)
        case .splitVertical:
            splitActivePane(direction: .vertical)
        case .fullscreen:
            mainWindow?.toggleFullScreen(nil)
        }
        NSLog("[AppDelegate] sidebar action: %@", String(describing: action))
    }
}

// MARK: - SplitPaneDelegate

extension AppDelegate: SplitPaneDelegate {

    func splitPane(_ view: SplitPaneView, createViewForPane paneId: String) -> GhosttyNSView {
        if let existing = termViews[paneId] {
            return existing
        }
        // Fallback: create a new view (shouldn't normally happen)
        let tv = GhosttyNSView(frame: .zero)
        tv.manager = ghosttyManager
        tv.paneId = paneId
        termViews[paneId] = tv
        return tv
    }

    func splitPane(_ view: SplitPaneView, didChangeRatioFor splitId: String, to ratio: Double) {
        guard let tab = tabs.first(where: { $0.id == activeTabId }) else { return }
        // Update the ratio in the tree (best-effort — find and mutate the split node)
        updateRatio(in: &tabs[tabs.firstIndex(where: { $0.id == tab.id })!].rootPane,
                    splitId: splitId, ratio: ratio)
    }

    private func updateRatio(in node: inout PaneNode, splitId: String, ratio: Double) {
        if case .split(var s) = node, s.id == splitId {
            s.ratio = ratio
            node = .split(s)
            return
        }
        if case .split(var s) = node {
            updateRatio(in: &s.first, splitId: splitId, ratio: ratio)
            updateRatio(in: &s.second, splitId: splitId, ratio: ratio)
            node = .split(s)
        }
    }
}
