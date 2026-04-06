import Foundation
import AppKit
import CGhostty

/// Manages ghostty app lifecycle and surface instances.
/// Based on cmux's GhosttyApp pattern.
class GhosttyManager: ObservableObject {
    private(set) var app: ghostty_app_t?
    private(set) var config: ghostty_config_t?
    private var surfaces: [String: SurfaceInstance] = [:]
    private var tickScheduled = false
    private let tickLock = NSLock()

    struct SurfaceInstance {
        let surface: ghostty_surface_t
        let view: GhosttyNSView
    }

    // MARK: - App Lifecycle

    func initializeApp() {
        // 1. Config
        guard let cfg = ghostty_config_new() else {
            NSLog("[GhosttyManager] ghostty_config_new FAILED")
            return
        }
        ghostty_config_load_default_files(cfg)
        ghostty_config_finalize(cfg)
        self.config = cfg
        NSLog("[GhosttyManager] config created")

        // Check diagnostics
        let diagCount = ghostty_config_diagnostics_count(cfg)
        if diagCount > 0 {
            for i in 0..<diagCount {
                let diag = ghostty_config_get_diagnostic(cfg, i)
                if let msg = diag.message {
                    NSLog("[GhosttyManager] config diagnostic: \(String(cString: msg))")
                }
            }
        }

        // 2. Runtime callbacks
        var runtime = ghostty_runtime_config_s()
        runtime.userdata = Unmanaged.passUnretained(self).toOpaque()
        runtime.supports_selection_clipboard = false
        runtime.wakeup_cb = { userdata in
            guard let userdata else { return }
            let mgr = Unmanaged<GhosttyManager>.fromOpaque(userdata).takeUnretainedValue()
            mgr.scheduleTick()
        }
        runtime.action_cb = { _, _, _ in
            return false // default handling
        }
        runtime.read_clipboard_cb = { _, _, _ in
            return false
        }
        runtime.confirm_read_clipboard_cb = { _, _, _, _ in }
        runtime.write_clipboard_cb = { _, location, content, count, _ in
            guard let content, count > 0 else { return }
            let buffer = UnsafeBufferPointer(start: content, count: Int(count))
            for item in buffer {
                guard let dataPtr = item.data else { continue }
                let value = String(cString: dataPtr)
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(value, forType: .string)
                return
            }
        }
        runtime.close_surface_cb = { userdata, _ in
            guard let userdata else { return }
            let mgr = Unmanaged<GhosttyManager>.fromOpaque(userdata).takeUnretainedValue()
            DispatchQueue.main.async {
                // TODO: close the pane
                NSLog("[GhosttyManager] close_surface_cb")
            }
        }

        // 3. App
        guard let ghosttyApp = ghostty_app_new(&runtime, cfg) else {
            NSLog("[GhosttyManager] ghostty_app_new FAILED")
            ghostty_config_free(cfg)
            self.config = nil
            return
        }
        self.app = ghosttyApp
        NSLog("[GhosttyManager] app created")
    }

    // MARK: - Tick (wakeup-driven, main thread)

    func scheduleTick() {
        tickLock.lock()
        defer { tickLock.unlock() }
        guard !tickScheduled else { return }
        tickScheduled = true
        DispatchQueue.main.async { [weak self] in
            self?.tick()
        }
    }

    private func tick() {
        tickLock.lock()
        tickScheduled = false
        tickLock.unlock()
        guard let app else { return }
        ghostty_app_tick(app)
    }

    // MARK: - Surface Lifecycle

    func createSurface(paneId: String, in view: GhosttyNSView) -> Bool {
        guard let app else {
            NSLog("[GhosttyManager] no app — cannot create surface")
            return false
        }
        guard surfaces[paneId] == nil else {
            NSLog("[GhosttyManager] surface already exists for \(paneId)")
            return false
        }

        var surfaceConfig = ghostty_surface_config_new()
        surfaceConfig.platform_tag = GHOSTTY_PLATFORM_MACOS
        surfaceConfig.platform = ghostty_platform_u(
            macos: ghostty_platform_macos_s(
                nsview: Unmanaged.passUnretained(view).toOpaque()
            )
        )

        // Scale factor from screen
        let scaleFactor = view.window?.backingScaleFactor ?? NSScreen.main?.backingScaleFactor ?? 2.0
        surfaceConfig.scale_factor = scaleFactor
        surfaceConfig.font_size = 14 // explicit font size
        surfaceConfig.context = GHOSTTY_SURFACE_CONTEXT_WINDOW

        // Working directory
        let home = FileManager.default.homeDirectoryForCurrentUser.path
        let cHome = (home as NSString).utf8String
        surfaceConfig.working_directory = cHome

        guard let surface = ghostty_surface_new(app, &surfaceConfig) else {
            NSLog("[GhosttyManager] ghostty_surface_new FAILED for \(paneId)")
            return false
        }

        surfaces[paneId] = SurfaceInstance(surface: surface, view: view)
        view.surface = surface
        NSLog("[GhosttyManager] surface created for \(paneId)")

        // Set display ID for proper vsync
        if let screen = view.window?.screen ?? NSScreen.main,
           let displayID = screen.deviceDescription[NSDeviceDescriptionKey("NSScreenNumber")] as? UInt32 {
            ghostty_surface_set_display_id(surface, displayID)
        }

        return true
    }

    func destroySurface(paneId: String) {
        guard let instance = surfaces.removeValue(forKey: paneId) else { return }
        instance.view.surface = nil
        ghostty_surface_free(instance.surface)
        NSLog("[GhosttyManager] surface destroyed for \(paneId)")
    }

    func destroyAll() {
        for (id, instance) in surfaces {
            instance.view.surface = nil
            ghostty_surface_free(instance.surface)
            NSLog("[GhosttyManager] destroyed \(id)")
        }
        surfaces.removeAll()
        if let app { ghostty_app_free(app); self.app = nil }
        if let config { ghostty_config_free(config); self.config = nil }
    }

    func surface(for paneId: String) -> ghostty_surface_t? {
        surfaces[paneId]?.surface
    }

    func firstSurface() -> ghostty_surface_t? {
        surfaces.values.first?.surface
    }

    var surfaceCount: Int { surfaces.count }
}
