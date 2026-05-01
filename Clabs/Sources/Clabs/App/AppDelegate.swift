import AppKit
import CGhostty

// MARK: - AppDelegate

class AppDelegate: NSObject, NSApplicationDelegate {

    let ghosttyManager = GhosttyManager()

    // Orchestrator
    private var orchestrator: OrchestratorServer?

    // Main window
    private var mainWindow: NSWindow?

    // Tab bar (top strip)
    private let tabBarHeight: CGFloat = 36
    private var tabBarView: TabBarView!

    // Sidebar
    private var sidebarView: SidebarView!
    private var sidebarVisible: Bool = true

    // Terminal content area
    private var contentArea: NSView!

    // InputBox (bottom strip)
    private var inputBoxView: InputBox!

    // StatusBar (bottom-most strip)
    private var statusBarView: StatusBar!

    // Workspace state
    private var tabs: [WorkspaceTab] = []
    private var activeTabId: String = ""

    // Map paneId → GhosttyNSView (all tabs, all panes)
    private var termViews: [String: GhosttyNSView] = [:]

    // Currently visible SplitPaneView
    private var currentSplitView: SplitPaneView?

    // ContentArea manager (editor tabs + terminal switching)
    private var contentAreaManager: ContentAreaManager?

    // CLI Builder panel
    private var cliBuilderPanel: NSPanel?
    private var cliBuilderView: CLIBuilderView?

    // MARK: - App Lifecycle

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        NSApp.appearance = NSAppearance(named: .darkAqua)

        let argc = CommandLine.argc
        let argv = CommandLine.unsafeArgv
        let ret = ghostty_init(UInt(argc), argv)
        if ret != GHOSTTY_SUCCESS {
            NSLog("[AppDelegate] ghostty_init FAILED: \(ret)")
            return
        }
        NSLog("[AppDelegate] ghostty_init OK")

        ghosttyManager.initializeApp()

        // Terminal title change callback: update the tab title
        ghosttyManager.onTitleChange = { [weak self] paneId, title in
            guard let self else { return }
            // Find the tab that owns this paneId and update its title
            for i in self.tabs.indices {
                if self.tabs[i].allLeafIds.contains(paneId) {
                    self.tabs[i].title = title
                    self.updateTabBar()
                    if self.tabs[i].id == self.activeTabId {
                        self.mainWindow?.title = "Clabs — \(title)"
                    }
                    break
                }
            }
        }

        // Start orchestrator socket server
        let orch = OrchestratorServer()
        orch.delegate = self
        orch.start()
        orchestrator = orch

        DispatchQueue.main.async { [self] in
            buildWindow()
            let home = FileManager.default.homeDirectoryForCurrentUser.path
            openNewTab(projectPath: home)
            mainWindow?.makeKeyAndOrderFront(nil)
            NSApp.activate(ignoringOtherApps: true)
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        orchestrator?.stop()
        ghosttyManager.destroyAll()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    // MARK: - Window Setup

    private func buildWindow() {
        let w = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1200, height: 800),
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        w.title = "Clabs"
        w.titlebarAppearsTransparent = true
        w.titleVisibility = .hidden
        w.isMovableByWindowBackground = true
        w.center()

        let root = NSView(frame: w.contentView!.bounds)
        root.autoresizingMask = [.width, .height]
        root.wantsLayer = true
        root.layer?.backgroundColor = ThemePresets.githubDark.ui.bgPrimary.cgColor
        w.contentView = root

        // Traffic light area: reserve ~28px at top for titlebar buttons in fullSizeContentView mode
        let titlebarHeight: CGFloat = 28

        // Tab bar sits immediately below traffic lights
        tabBarView = TabBarView(frame: NSRect(
            x: 0,
            y: root.bounds.height - titlebarHeight - tabBarHeight,
            width: root.bounds.width,
            height: tabBarHeight
        ))
        tabBarView.autoresizingMask = [.width, .minYMargin]
        tabBarView.delegate = self
        root.addSubview(tabBarView)

        let bodyHeight = root.bounds.height - titlebarHeight - tabBarHeight
        let sbW = SidebarView.defaultWidth
        let ibH = InputBox.defaultHeight
        let sbH = StatusBar.defaultHeight

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

        // StatusBar (bottom-most strip, right of sidebar)
        statusBarView = StatusBar(frame: NSRect(
            x: sbW,
            y: 0,
            width: root.bounds.width - sbW,
            height: sbH
        ))
        statusBarView.autoresizingMask = [.width, .maxYMargin]
        root.addSubview(statusBarView)

        // InputBox (above status bar, right of sidebar)
        inputBoxView = InputBox(frame: NSRect(
            x: sbW,
            y: sbH,
            width: root.bounds.width - sbW,
            height: ibH
        ))
        inputBoxView.autoresizingMask = [.width, .maxYMargin]
        inputBoxView.ghosttyManager = ghosttyManager
        root.addSubview(inputBoxView)

        // Terminal content area (right of sidebar, above inputbox)
        contentArea = NSView(frame: NSRect(
            x: sbW,
            y: ibH + sbH,
            width: root.bounds.width - sbW,
            height: bodyHeight - ibH - sbH
        ))
        contentArea.autoresizingMask = [.width, .height]
        root.addSubview(contentArea)

        // ContentAreaManager (editor tab bar lives here)
        let cam = ContentAreaManager(contentArea: contentArea)
        cam.delegate = self
        contentAreaManager = cam

        // Cmd+B: toggle sidebar; Cmd+S: save editor
        NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard let self else { return event }
            if event.modifierFlags.contains(.command) {
                switch event.charactersIgnoringModifiers {
                case "b":
                    self.toggleSidebar()
                    return nil
                case "s":
                    self.contentAreaManager?.saveCurrentEditor()
                    return nil
                default:
                    break
                }
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
            self.statusBarView?.applyTheme(theme)
        }
        // Apply GitHub Dark theme as default to match Tauri app
        ThemeManager.shared.apply(ThemePresets.githubDark, ghosttyManager: ghosttyManager)

        mainWindow = w
    }

    // MARK: - Sidebar Toggle

    private func toggleSidebar() {
        sidebarVisible.toggle()
        guard let root = mainWindow?.contentView else { return }
        let sbW: CGFloat = sidebarVisible ? SidebarView.defaultWidth : 0
        let ibH = InputBox.defaultHeight
        let sbH = StatusBar.defaultHeight
        let titlebarHeight: CGFloat = 28
        let bodyHeight = root.bounds.height - titlebarHeight - tabBarHeight

        NSAnimationContext.runAnimationGroup { ctx in
            ctx.duration = 0.2
            ctx.timingFunction = CAMediaTimingFunction(name: .easeInEaseOut)
            sidebarView.animator().frame = NSRect(x: 0, y: 0, width: sidebarVisible ? SidebarView.defaultWidth : 0, height: bodyHeight)
            sidebarView.isHidden = !sidebarVisible
            statusBarView.animator().frame = NSRect(x: sbW, y: 0, width: root.bounds.width - sbW, height: sbH)
            inputBoxView.animator().frame = NSRect(x: sbW, y: sbH, width: root.bounds.width - sbW, height: ibH)
            contentArea.animator().frame = NSRect(x: sbW, y: ibH + sbH, width: root.bounds.width - sbW, height: bodyHeight - ibH - sbH)
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
        splitView.paneToolbarDelegate = self
        splitView.build() // must be called AFTER delegate is set
        currentSplitView = splitView

        // Hand the terminal view to ContentAreaManager (it adds it to contentArea)
        contentAreaManager?.setTerminalView(splitView)

        mainWindow?.title = "Clabs — \(tab.title)"
        sidebarView?.setProjectPath(tab.projectPath)

        // Force layout so new panes get valid frames → triggers tryCreateSurface
        contentArea.layoutSubtreeIfNeeded()

        // Also delay-trigger surface creation for any panes that didn't get it
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) { [self] in
            for leaf in tab.rootPane.allLeaves() {
                if let tv = self.termViews[leaf.id], tv.surface == nil {
                    let size = tv.frame.size.width > 0 ? tv.frame.size : tv.bounds.size
                    NSLog("[AppDelegate] forcing surface for pane %@ frame=%.0fx%.0f bounds=%.0fx%.0f", leaf.id, tv.frame.size.width, tv.frame.size.height, tv.bounds.size.width, tv.bounds.size.height)
                    if size.width > 10 && size.height > 10 {
                        _ = self.ghosttyManager.createSurface(paneId: leaf.id, in: tv, workingDirectory: tv.workingDirectory)
                    } else {
                        // Frame still 0 — try again later
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
                            guard let self, let tv = self.termViews[leaf.id], tv.surface == nil else { return }
                            NSLog("[AppDelegate] retry surface for pane %@ frame=%.0fx%.0f", leaf.id, tv.frame.width, tv.frame.height)
                            if tv.frame.width > 10 && tv.frame.height > 10 {
                                _ = self.ghosttyManager.createSurface(paneId: leaf.id, in: tv, workingDirectory: tv.workingDirectory)
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
        tv.workingDirectory = workingDirectory
        tv.onClosePane = { [weak self] id in
            self?.closePane(id: id)
        }
        tv.onBecameActive = { [weak self] id in
            self?.inputBoxView?.activePaneId = id
        }
        termViews[paneId] = tv
        NSLog("[AppDelegate] installed termView for pane \(paneId), wd=\(workingDirectory)")
    }

    private func removeTermView(paneId: String) {
        if let tv = termViews.removeValue(forKey: paneId) {
            tv.removeFromSuperview()
        }
        ghosttyManager.destroySurface(paneId: paneId)
    }

    private func closePane(id: String) {
        guard let tab = tabs.first(where: { $0.id == activeTabId }) else { return }
        // If this is the only pane, close the tab instead
        if tab.allLeafIds.count <= 1 {
            closeTab(id: tab.id)
            return
        }
        // Remove from model
        tab.removePane(id: id)
        removeTermView(paneId: id)
        // Rebuild split view
        switchToTab(id: tab.id)
        NSLog("[AppDelegate] closed pane %@", id)
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

        // Settings (Cmd+,) — add to App menu
        let appMenu = mainMenu.item(at: 0)?.submenu
        let settingsItem = NSMenuItem(title: "Preferences…", action: #selector(menuOpenSettings), keyEquivalent: ",")
        settingsItem.keyEquivalentModifierMask = .command
        settingsItem.target = self
        appMenu?.insertItem(settingsItem, at: 0)

        let closeTab = NSMenuItem(title: "Close Tab", action: #selector(menuCloseTab), keyEquivalent: "w")
        closeTab.keyEquivalentModifierMask = .command
        closeTab.target = self
        tabMenu.addItem(closeTab)

        tabMenu.addItem(.separator())

        // CLI Builder (Cmd+Shift+B)
        let cliItem = NSMenuItem(title: "CLI Builder…", action: #selector(menuOpenCLIBuilder), keyEquivalent: "b")
        cliItem.keyEquivalentModifierMask = [.command, .shift]
        cliItem.target = self
        tabMenu.addItem(cliItem)

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

    @objc private func menuOpenSettings() {
        SettingsWindow.open()
    }

    @objc private func menuOpenCLIBuilder() {
        if let panel = cliBuilderPanel {
            panel.makeKeyAndOrderFront(nil)
            return
        }
        let panelWidth: CGFloat = 500
        let panelHeight: CGFloat = 420
        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: panelWidth, height: panelHeight),
            styleMask: [.titled, .closable, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        panel.title = "CLI 명령어 빌더"
        panel.isFloatingPanel = true
        panel.hidesOnDeactivate = false
        if let mw = mainWindow {
            let mf = mw.frame
            panel.setFrameOrigin(NSPoint(
                x: mf.origin.x + mf.width - panelWidth - 20,
                y: mf.origin.y + mf.height - panelHeight - 40
            ))
        } else {
            panel.center()
        }
        let builderView = CLIBuilderView(frame: NSRect(x: 0, y: 0, width: panelWidth, height: panelHeight))
        builderView.autoresizingMask = [.width, .height]
        builderView.delegate = self
        panel.contentView = builderView
        cliBuilderView = builderView
        cliBuilderPanel = panel
        panel.makeKeyAndOrderFront(nil)
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

    func sidebar(_ view: SidebarView, didRequestOpenFile path: String) {
        openFile(path: path)
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

// MARK: - PaneToolbarDelegate

extension AppDelegate: PaneToolbarDelegate {
    func paneToolbar(_ toolbar: PaneToolbar, didRequestSplit direction: SplitDirection, forPane paneId: String) {
        guard let tab = tabs.first(where: { $0.id == activeTabId }) else { return }
        guard let newLeaf = tab.split(paneId: paneId, direction: direction) else { return }
        installTermView(paneId: newLeaf.id, workingDirectory: tab.projectPath)
        switchToTab(id: tab.id)
        NSLog("[AppDelegate] toolbar split %@ → %@", paneId, newLeaf.id)
    }

    func paneToolbar(_ toolbar: PaneToolbar, didRequestClose paneId: String) {
        closePane(id: paneId)
    }
}

// MARK: - CLIBuilderDelegate

extension AppDelegate: CLIBuilderDelegate {

    func cliBuilder(_ view: CLIBuilderView, didExecute command: String) {
        inputBoxView?.insertText(command)
        cliBuilderPanel?.orderOut(nil)
        mainWindow?.makeKeyAndOrderFront(nil)
        NSLog("[AppDelegate] CLIBuilder execute: %@", command)
    }
}

// MARK: - OrchestratorDelegate

extension AppDelegate: OrchestratorDelegate {

    func orchestratorListPanes() -> [[String: String]] {
        var result: [[String: String]] = []
        for tab in tabs {
            for leaf in tab.rootPane.allLeaves() {
                result.append([
                    "pane_id": leaf.id,
                    "tab_id": tab.id,
                    "tab_title": tab.title,
                ])
            }
        }
        return result
    }

    func orchestratorSendToPane(paneId: String, text: String) -> Bool {
        guard let surface = ghosttyManager.surface(for: paneId) else { return false }
        let fullText = text + "\r"
        fullText.withCString { ptr in
            ghostty_surface_text(surface, ptr, UInt(fullText.utf8.count))
        }
        return true
    }

    func orchestratorResolveName(_ name: String) -> String? {
        // Simple name resolution: match tab title (case-insensitive) -> first pane
        let lower = name.lowercased()
        for tab in tabs {
            if tab.title.lowercased().contains(lower) {
                return tab.rootPane.allLeaves().first?.id
            }
        }
        return nil
    }
}

// MARK: - File editor API

extension AppDelegate {

    /// Open a file in the editor tab. Called from SidebarDelegate and any external source.
    func openFile(path: String) {
        NSLog("[AppDelegate] openFile: %@", path)
        contentAreaManager?.openFile(path: path)
    }
}

// MARK: - ContentAreaManagerDelegate

extension AppDelegate: ContentAreaManagerDelegate {

    func contentAreaManager(_ manager: ContentAreaManager, didChangeActiveTab id: String) {
        NSLog("[AppDelegate] contentArea active tab: %@", id)
        // When terminal tab is active, give focus back to terminal
        if id == "terminal" {
            if let tab = tabs.first(where: { $0.id == activeTabId }),
               let firstLeafId = tab.rootPane.allLeaves().first?.id,
               let termView = termViews[firstLeafId] {
                mainWindow?.makeFirstResponder(termView)
                inputBoxView?.activePaneId = firstLeafId
            }
        }
    }
}
