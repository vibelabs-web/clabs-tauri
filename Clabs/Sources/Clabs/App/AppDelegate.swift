import AppKit
import CGhostty

class AppDelegate: NSObject, NSApplicationDelegate {
    let ghosttyManager = GhosttyManager()
    var window: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Make this a regular GUI app (shows in Dock, receives key events)
        NSApp.setActivationPolicy(.regular)

        // Initialize ghostty runtime — must be on main thread
        let argc = CommandLine.argc
        let argv = CommandLine.unsafeArgv
        let ret = ghostty_init(UInt(argc), argv)
        if ret != GHOSTTY_SUCCESS {
            NSLog("[Clabs] ghostty_init FAILED: \(ret)")
            return
        }
        NSLog("[Clabs] ghostty_init OK")

        // Initialize the ghostty app (config + runtime callbacks)
        ghosttyManager.initializeApp()

        // Create window with GhosttyNSView directly (bypass SwiftUI key event issues)
        DispatchQueue.main.async { [self] in
            let w = NSWindow(
                contentRect: NSRect(x: 0, y: 0, width: 1200, height: 800),
                styleMask: [.titled, .closable, .miniaturizable, .resizable],
                backing: .buffered,
                defer: false
            )
            w.title = "Clabs"
            w.center()

            let termView = GhosttyNSView(frame: w.contentView!.bounds)
            termView.autoresizingMask = [.width, .height]
            termView.manager = ghosttyManager
            termView.paneId = "pane-main"
            w.contentView = termView
            w.makeKeyAndOrderFront(nil)
            w.makeFirstResponder(termView)

            self.window = w
            NSApp.activate(ignoringOtherApps: true)
            NSLog("[Clabs] native window created with GhosttyNSView")
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        ghosttyManager.destroyAll()
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
