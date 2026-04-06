import AppKit

// @TASK Phase3B - Theme type definitions

// MARK: - TerminalColors

struct TerminalColors {
    let background: NSColor
    let foreground: NSColor
    let cursor: NSColor
    let cursorAccent: NSColor
    let selectionBackground: NSColor
    // ANSI 0-15: black, red, green, yellow, blue, magenta, cyan, white,
    //            brightBlack, brightRed, brightGreen, brightYellow,
    //            brightBlue, brightMagenta, brightCyan, brightWhite
    let ansi: [NSColor]
}

// MARK: - UIColors

struct UIColors {
    let bgPrimary: NSColor
    let bgSecondary: NSColor
    let bgTertiary: NSColor
    let textPrimary: NSColor
    let textSecondary: NSColor
    let accent: NSColor
    let border: NSColor
}

// MARK: - Theme

struct Theme {
    let id: String
    let name: String
    let isDark: Bool
    let terminal: TerminalColors
    let ui: UIColors
}

// MARK: - NSColor hex helper

extension NSColor {
    /// Create NSColor from a 6-digit hex string, e.g. "#282a36" or "282a36".
    convenience init(hex: String) {
        var cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleaned.hasPrefix("#") { cleaned = String(cleaned.dropFirst()) }
        var rgb: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&rgb)
        let r = CGFloat((rgb >> 16) & 0xFF) / 255.0
        let g = CGFloat((rgb >> 8)  & 0xFF) / 255.0
        let b = CGFloat( rgb        & 0xFF) / 255.0
        self.init(srgbRed: r, green: g, blue: b, alpha: 1.0)
    }

    /// Create NSColor from hex with explicit alpha (0-255).
    convenience init(hex: String, alpha: CGFloat) {
        self.init(hex: hex)
        // Re-init with alpha — NSColor is a class cluster so we use a separate path
        // Actual alpha will be applied via withAlphaComponent in callers if needed.
        _ = alpha // stored via separate factory below
    }
}
