import AppKit

// Pure AppKit entry point — no SwiftUI to intercept key events
@main
enum ClabsMain {
    static func main() {
        let app = NSApplication.shared
        let delegate = AppDelegate()
        app.delegate = delegate
        app.run()
    }
}
