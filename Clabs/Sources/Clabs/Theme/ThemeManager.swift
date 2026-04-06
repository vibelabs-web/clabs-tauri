import AppKit
import CGhostty

// @TASK Phase3B - ThemeManager: single source of truth for active theme

// MARK: - ThemeManager

final class ThemeManager {

    // MARK: Singleton

    static let shared = ThemeManager()
    private init() {}

    // MARK: State

    private(set) var currentTheme: Theme = ThemePresets.defaultDark

    /// Called whenever the theme changes. Receives the new theme.
    var onChange: ((Theme) -> Void)?

    // MARK: Apply

    /// Apply a theme preset. Updates state, notifies observers, and writes
    /// a new ghostty config fragment so the terminal reflects the new colors.
    func apply(_ theme: Theme, ghosttyManager: GhosttyManager? = nil) {
        currentTheme = theme
        if let gm = ghosttyManager {
            applyToGhostty(gm)
        }
        onChange?(theme)
    }

    // MARK: Ghostty integration

    /// Write a temporary ghostty config file with palette + base colors and
    /// reload it via the live config-update API.
    func applyToGhostty(_ manager: GhosttyManager) {
        guard let app = manager.app else {
            NSLog("[ThemeManager] ghostty app not ready — skipping config reload")
            return
        }

        let configContent = buildGhosttyConfig(for: currentTheme)

        // Write to a temp file
        let tmpURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("clabs-theme.conf")
        do {
            try configContent.write(to: tmpURL, atomically: true, encoding: .utf8)
        } catch {
            NSLog("[ThemeManager] failed to write theme config: \(error)")
            return
        }

        // Create a fresh config, load defaults + our overrides, then push to app
        guard let cfg = ghostty_config_new() else {
            NSLog("[ThemeManager] ghostty_config_new failed")
            return
        }
        ghostty_config_load_default_files(cfg)
        ghostty_config_load_file(cfg, tmpURL.path)
        ghostty_config_finalize(cfg)
        ghostty_app_update_config(app, cfg)
        ghostty_config_free(cfg)

        NSLog("[ThemeManager] applied theme '\(currentTheme.name)' to ghostty")
    }

    // MARK: Config builder

    private func buildGhosttyConfig(for theme: Theme) -> String {
        let t = theme.terminal
        var lines: [String] = []

        lines.append("# Clabs auto-generated theme: \(theme.name)")
        lines.append("background = \(hexString(t.background))")
        lines.append("foreground = \(hexString(t.foreground))")
        lines.append("cursor-color = \(hexString(t.cursor))")
        lines.append("cursor-text = \(hexString(t.cursorAccent))")
        lines.append("selection-background = \(hexStringWithAlpha(t.selectionBackground))")

        // ANSI palette: ghostty uses palette = N=#RRGGBB
        for (index, color) in t.ansi.enumerated() {
            lines.append("palette = \(index)=#\(hexString(color))")
        }

        return lines.joined(separator: "\n") + "\n"
    }

    // MARK: Color helpers

    private func hexString(_ color: NSColor) -> String {
        guard let srgb = color.usingColorSpace(.sRGB) else { return "ffffff" }
        let r = Int(srgb.redComponent   * 255)
        let g = Int(srgb.greenComponent * 255)
        let b = Int(srgb.blueComponent  * 255)
        return String(format: "%02x%02x%02x", r, g, b)
    }

    private func hexStringWithAlpha(_ color: NSColor) -> String {
        // ghostty supports #RRGGBBAA for selection
        guard let srgb = color.usingColorSpace(.sRGB) else { return "ffffff" }
        let r = Int(srgb.redComponent   * 255)
        let g = Int(srgb.greenComponent * 255)
        let b = Int(srgb.blueComponent  * 255)
        let a = Int(srgb.alphaComponent * 255)
        return "#\(String(format: "%02x%02x%02x%02x", r, g, b, a))"
    }
}
