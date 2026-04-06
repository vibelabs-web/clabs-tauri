import AppKit

// @TASK Phase3B - 15 theme presets ported from src/shared/themes/presets/

// MARK: - ThemePresets

enum ThemePresets {

    // MARK: Default Dark

    static let defaultDark = Theme(
        id: "default-dark",
        name: "Default Dark",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#0a0a0a"),
            foreground:          NSColor(hex: "#e0e0e0"),
            cursor:              NSColor(hex: "#00ff88"),
            cursorAccent:        NSColor(hex: "#0a0a0a"),
            selectionBackground: NSColor(hex: "#00ff88").withAlphaComponent(0.2),
            ansi: [
                NSColor(hex: "#1a1a1a"), // 0  black
                NSColor(hex: "#ff4444"), // 1  red
                NSColor(hex: "#00ff88"), // 2  green
                NSColor(hex: "#ffcc00"), // 3  yellow
                NSColor(hex: "#00aaff"), // 4  blue
                NSColor(hex: "#ff66ff"), // 5  magenta
                NSColor(hex: "#00ffff"), // 6  cyan
                NSColor(hex: "#e0e0e0"), // 7  white
                NSColor(hex: "#666666"), // 8  brightBlack
                NSColor(hex: "#ff6666"), // 9  brightRed
                NSColor(hex: "#33ff99"), // 10 brightGreen
                NSColor(hex: "#ffdd33"), // 11 brightYellow
                NSColor(hex: "#33bbff"), // 12 brightBlue
                NSColor(hex: "#ff88ff"), // 13 brightMagenta
                NSColor(hex: "#33ffff"), // 14 brightCyan
                NSColor(hex: "#ffffff"), // 15 brightWhite
            ]
        ),
        ui: UIColors(
            bgPrimary:   NSColor(hex: "#1a1a1a"),
            bgSecondary: NSColor(hex: "#242424"),
            bgTertiary:  NSColor(hex: "#2d2d2d"),
            textPrimary: NSColor(hex: "#ffffff"),
            textSecondary: NSColor(hex: "#e0e0e0"),
            accent:      NSColor(hex: "#00ff88"),
            border:      NSColor(hex: "#2d2d2d")
        )
    )

    // MARK: Dracula

    static let dracula = Theme(
        id: "dracula",
        name: "Dracula",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#282a36"),
            foreground:          NSColor(hex: "#f8f8f2"),
            cursor:              NSColor(hex: "#f8f8f2"),
            cursorAccent:        NSColor(hex: "#282a36"),
            selectionBackground: NSColor(hex: "#bd93f9").withAlphaComponent(0.3),
            ansi: [
                NSColor(hex: "#21222c"),
                NSColor(hex: "#ff5555"),
                NSColor(hex: "#50fa7b"),
                NSColor(hex: "#f1fa8c"),
                NSColor(hex: "#bd93f9"),
                NSColor(hex: "#ff79c6"),
                NSColor(hex: "#8be9fd"),
                NSColor(hex: "#f8f8f2"),
                NSColor(hex: "#6272a4"),
                NSColor(hex: "#ff6e6e"),
                NSColor(hex: "#69ff94"),
                NSColor(hex: "#ffffa5"),
                NSColor(hex: "#d6acff"),
                NSColor(hex: "#ff92df"),
                NSColor(hex: "#a4ffff"),
                NSColor(hex: "#ffffff"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#282a36"),
            bgSecondary:  NSColor(hex: "#21222c"),
            bgTertiary:   NSColor(hex: "#44475a"),
            textPrimary:  NSColor(hex: "#f8f8f2"),
            textSecondary: NSColor(hex: "#f8f8f2"),
            accent:       NSColor(hex: "#bd93f9"),
            border:       NSColor(hex: "#44475a")
        )
    )

    // MARK: Nord

    static let nord = Theme(
        id: "nord",
        name: "Nord",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#2e3440"),
            foreground:          NSColor(hex: "#d8dee9"),
            cursor:              NSColor(hex: "#d8dee9"),
            cursorAccent:        NSColor(hex: "#2e3440"),
            selectionBackground: NSColor(hex: "#88c0d0").withAlphaComponent(0.25),
            ansi: [
                NSColor(hex: "#3b4252"),
                NSColor(hex: "#bf616a"),
                NSColor(hex: "#a3be8c"),
                NSColor(hex: "#ebcb8b"),
                NSColor(hex: "#81a1c1"),
                NSColor(hex: "#b48ead"),
                NSColor(hex: "#88c0d0"),
                NSColor(hex: "#e5e9f0"),
                NSColor(hex: "#4c566a"),
                NSColor(hex: "#bf616a"),
                NSColor(hex: "#a3be8c"),
                NSColor(hex: "#ebcb8b"),
                NSColor(hex: "#81a1c1"),
                NSColor(hex: "#b48ead"),
                NSColor(hex: "#8fbcbb"),
                NSColor(hex: "#eceff4"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#2e3440"),
            bgSecondary:  NSColor(hex: "#3b4252"),
            bgTertiary:   NSColor(hex: "#434c5e"),
            textPrimary:  NSColor(hex: "#eceff4"),
            textSecondary: NSColor(hex: "#e5e9f0"),
            accent:       NSColor(hex: "#88c0d0"),
            border:       NSColor(hex: "#4c566a")
        )
    )

    // MARK: Solarized Dark

    static let solarizedDark = Theme(
        id: "solarized-dark",
        name: "Solarized Dark",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#002b36"),
            foreground:          NSColor(hex: "#839496"),
            cursor:              NSColor(hex: "#839496"),
            cursorAccent:        NSColor(hex: "#002b36"),
            selectionBackground: NSColor(hex: "#268bd2").withAlphaComponent(0.3),
            ansi: [
                NSColor(hex: "#073642"),
                NSColor(hex: "#dc322f"),
                NSColor(hex: "#859900"),
                NSColor(hex: "#b58900"),
                NSColor(hex: "#268bd2"),
                NSColor(hex: "#d33682"),
                NSColor(hex: "#2aa198"),
                NSColor(hex: "#eee8d5"),
                NSColor(hex: "#002b36"),
                NSColor(hex: "#cb4b16"),
                NSColor(hex: "#586e75"),
                NSColor(hex: "#657b83"),
                NSColor(hex: "#839496"),
                NSColor(hex: "#6c71c4"),
                NSColor(hex: "#93a1a1"),
                NSColor(hex: "#fdf6e3"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#002b36"),
            bgSecondary:  NSColor(hex: "#073642"),
            bgTertiary:   NSColor(hex: "#094552"),
            textPrimary:  NSColor(hex: "#fdf6e3"),
            textSecondary: NSColor(hex: "#eee8d5"),
            accent:       NSColor(hex: "#268bd2"),
            border:       NSColor(hex: "#094552")
        )
    )

    // MARK: Solarized Light

    static let solarizedLight = Theme(
        id: "solarized-light",
        name: "Solarized Light",
        isDark: false,
        terminal: TerminalColors(
            background:          NSColor(hex: "#fdf6e3"),
            foreground:          NSColor(hex: "#657b83"),
            cursor:              NSColor(hex: "#657b83"),
            cursorAccent:        NSColor(hex: "#fdf6e3"),
            selectionBackground: NSColor(hex: "#268bd2").withAlphaComponent(0.2),
            ansi: [
                NSColor(hex: "#073642"),
                NSColor(hex: "#dc322f"),
                NSColor(hex: "#859900"),
                NSColor(hex: "#b58900"),
                NSColor(hex: "#268bd2"),
                NSColor(hex: "#d33682"),
                NSColor(hex: "#2aa198"),
                NSColor(hex: "#eee8d5"),
                NSColor(hex: "#002b36"),
                NSColor(hex: "#cb4b16"),
                NSColor(hex: "#586e75"),
                NSColor(hex: "#657b83"),
                NSColor(hex: "#839496"),
                NSColor(hex: "#6c71c4"),
                NSColor(hex: "#93a1a1"),
                NSColor(hex: "#fdf6e3"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#fdf6e3"),
            bgSecondary:  NSColor(hex: "#eee8d5"),
            bgTertiary:   NSColor(hex: "#ddd6c1"),
            textPrimary:  NSColor(hex: "#073642"),
            textSecondary: NSColor(hex: "#586e75"),
            accent:       NSColor(hex: "#268bd2"),
            border:       NSColor(hex: "#ddd6c1")
        )
    )

    // MARK: Tokyo Night

    static let tokyoNight = Theme(
        id: "tokyo-night",
        name: "Tokyo Night",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#1a1b26"),
            foreground:          NSColor(hex: "#a9b1d6"),
            cursor:              NSColor(hex: "#c0caf5"),
            cursorAccent:        NSColor(hex: "#1a1b26"),
            selectionBackground: NSColor(hex: "#7aa2f7").withAlphaComponent(0.25),
            ansi: [
                NSColor(hex: "#15161e"),
                NSColor(hex: "#f7768e"),
                NSColor(hex: "#9ece6a"),
                NSColor(hex: "#e0af68"),
                NSColor(hex: "#7aa2f7"),
                NSColor(hex: "#bb9af7"),
                NSColor(hex: "#7dcfff"),
                NSColor(hex: "#a9b1d6"),
                NSColor(hex: "#414868"),
                NSColor(hex: "#f7768e"),
                NSColor(hex: "#9ece6a"),
                NSColor(hex: "#e0af68"),
                NSColor(hex: "#7aa2f7"),
                NSColor(hex: "#bb9af7"),
                NSColor(hex: "#7dcfff"),
                NSColor(hex: "#c0caf5"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#1a1b26"),
            bgSecondary:  NSColor(hex: "#16161e"),
            bgTertiary:   NSColor(hex: "#24283b"),
            textPrimary:  NSColor(hex: "#c0caf5"),
            textSecondary: NSColor(hex: "#a9b1d6"),
            accent:       NSColor(hex: "#7aa2f7"),
            border:       NSColor(hex: "#24283b")
        )
    )

    // MARK: Gruvbox Dark

    static let gruvboxDark = Theme(
        id: "gruvbox-dark",
        name: "Gruvbox Dark",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#1d2021"),
            foreground:          NSColor(hex: "#ebdbb2"),
            cursor:              NSColor(hex: "#b8bb26"),
            cursorAccent:        NSColor(hex: "#1d2021"),
            selectionBackground: NSColor(hex: "#b8bb26").withAlphaComponent(0.25),
            ansi: [
                NSColor(hex: "#1d2021"),
                NSColor(hex: "#cc241d"),
                NSColor(hex: "#98971a"),
                NSColor(hex: "#d79921"),
                NSColor(hex: "#458588"),
                NSColor(hex: "#b16286"),
                NSColor(hex: "#689d6a"),
                NSColor(hex: "#a89984"),
                NSColor(hex: "#928374"),
                NSColor(hex: "#fb4934"),
                NSColor(hex: "#b8bb26"),
                NSColor(hex: "#fabd2f"),
                NSColor(hex: "#83a598"),
                NSColor(hex: "#d3869b"),
                NSColor(hex: "#8ec07c"),
                NSColor(hex: "#ebdbb2"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#1d2021"),
            bgSecondary:  NSColor(hex: "#282828"),
            bgTertiary:   NSColor(hex: "#3c3836"),
            textPrimary:  NSColor(hex: "#ebdbb2"),
            textSecondary: NSColor(hex: "#d5c4a1"),
            accent:       NSColor(hex: "#b8bb26"),
            border:       NSColor(hex: "#3c3836")
        )
    )

    // MARK: Gruvbox Light

    static let gruvboxLight = Theme(
        id: "gruvbox-light",
        name: "Gruvbox Light",
        isDark: false,
        terminal: TerminalColors(
            background:          NSColor(hex: "#fbf1c7"),
            foreground:          NSColor(hex: "#3c3836"),
            cursor:              NSColor(hex: "#98971a"),
            cursorAccent:        NSColor(hex: "#fbf1c7"),
            selectionBackground: NSColor(hex: "#98971a").withAlphaComponent(0.25),
            ansi: [
                NSColor(hex: "#fbf1c7"),
                NSColor(hex: "#cc241d"),
                NSColor(hex: "#98971a"),
                NSColor(hex: "#d79921"),
                NSColor(hex: "#458588"),
                NSColor(hex: "#b16286"),
                NSColor(hex: "#689d6a"),
                NSColor(hex: "#7c6f64"),
                NSColor(hex: "#928374"),
                NSColor(hex: "#9d0006"),
                NSColor(hex: "#79740e"),
                NSColor(hex: "#b57614"),
                NSColor(hex: "#076678"),
                NSColor(hex: "#8f3f71"),
                NSColor(hex: "#427b58"),
                NSColor(hex: "#3c3836"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#fbf1c7"),
            bgSecondary:  NSColor(hex: "#f2e5bc"),
            bgTertiary:   NSColor(hex: "#ebdbb2"),
            textPrimary:  NSColor(hex: "#282828"),
            textSecondary: NSColor(hex: "#3c3836"),
            accent:       NSColor(hex: "#98971a"),
            border:       NSColor(hex: "#d5c4a1")
        )
    )

    // MARK: Catppuccin Mocha

    static let catppuccinMocha = Theme(
        id: "catppuccin-mocha",
        name: "Catppuccin Mocha",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#1e1e2e"),
            foreground:          NSColor(hex: "#cdd6f4"),
            cursor:              NSColor(hex: "#f5e0dc"),
            cursorAccent:        NSColor(hex: "#1e1e2e"),
            selectionBackground: NSColor(hex: "#89b4fa").withAlphaComponent(0.25),
            ansi: [
                NSColor(hex: "#45475a"),
                NSColor(hex: "#f38ba8"),
                NSColor(hex: "#a6e3a1"),
                NSColor(hex: "#f9e2af"),
                NSColor(hex: "#89b4fa"),
                NSColor(hex: "#f5c2e7"),
                NSColor(hex: "#94e2d5"),
                NSColor(hex: "#bac2de"),
                NSColor(hex: "#585b70"),
                NSColor(hex: "#f38ba8"),
                NSColor(hex: "#a6e3a1"),
                NSColor(hex: "#f9e2af"),
                NSColor(hex: "#89b4fa"),
                NSColor(hex: "#f5c2e7"),
                NSColor(hex: "#94e2d5"),
                NSColor(hex: "#a6adc8"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#1e1e2e"),
            bgSecondary:  NSColor(hex: "#181825"),
            bgTertiary:   NSColor(hex: "#313244"),
            textPrimary:  NSColor(hex: "#cdd6f4"),
            textSecondary: NSColor(hex: "#bac2de"),
            accent:       NSColor(hex: "#89b4fa"),
            border:       NSColor(hex: "#313244")
        )
    )

    // MARK: Catppuccin Latte

    static let catppuccinLatte = Theme(
        id: "catppuccin-latte",
        name: "Catppuccin Latte",
        isDark: false,
        terminal: TerminalColors(
            background:          NSColor(hex: "#eff1f5"),
            foreground:          NSColor(hex: "#4c4f69"),
            cursor:              NSColor(hex: "#dc8a78"),
            cursorAccent:        NSColor(hex: "#eff1f5"),
            selectionBackground: NSColor(hex: "#1e66f5").withAlphaComponent(0.2),
            ansi: [
                NSColor(hex: "#5c5f77"),
                NSColor(hex: "#d20f39"),
                NSColor(hex: "#40a02b"),
                NSColor(hex: "#df8e1d"),
                NSColor(hex: "#1e66f5"),
                NSColor(hex: "#ea76cb"),
                NSColor(hex: "#179299"),
                NSColor(hex: "#acb0be"),
                NSColor(hex: "#6c6f85"),
                NSColor(hex: "#d20f39"),
                NSColor(hex: "#40a02b"),
                NSColor(hex: "#df8e1d"),
                NSColor(hex: "#1e66f5"),
                NSColor(hex: "#ea76cb"),
                NSColor(hex: "#179299"),
                NSColor(hex: "#bcc0cc"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#eff1f5"),
            bgSecondary:  NSColor(hex: "#e6e9ef"),
            bgTertiary:   NSColor(hex: "#ccd0da"),
            textPrimary:  NSColor(hex: "#4c4f69"),
            textSecondary: NSColor(hex: "#5c5f77"),
            accent:       NSColor(hex: "#1e66f5"),
            border:       NSColor(hex: "#ccd0da")
        )
    )

    // MARK: Monokai Pro

    static let monokaiPro = Theme(
        id: "monokai-pro",
        name: "Monokai Pro",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#2d2a2e"),
            foreground:          NSColor(hex: "#fcfcfa"),
            cursor:              NSColor(hex: "#fcfcfa"),
            cursorAccent:        NSColor(hex: "#2d2a2e"),
            selectionBackground: NSColor(hex: "#fcfcfa").withAlphaComponent(0.15),
            ansi: [
                NSColor(hex: "#403e41"),
                NSColor(hex: "#ff6188"),
                NSColor(hex: "#a9dc76"),
                NSColor(hex: "#ffd866"),
                NSColor(hex: "#fc9867"),
                NSColor(hex: "#ab9df2"),
                NSColor(hex: "#78dce8"),
                NSColor(hex: "#fcfcfa"),
                NSColor(hex: "#727072"),
                NSColor(hex: "#ff6188"),
                NSColor(hex: "#a9dc76"),
                NSColor(hex: "#ffd866"),
                NSColor(hex: "#fc9867"),
                NSColor(hex: "#ab9df2"),
                NSColor(hex: "#78dce8"),
                NSColor(hex: "#fcfcfa"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#2d2a2e"),
            bgSecondary:  NSColor(hex: "#221f22"),
            bgTertiary:   NSColor(hex: "#403e41"),
            textPrimary:  NSColor(hex: "#fcfcfa"),
            textSecondary: NSColor(hex: "#c1c0c0"),
            accent:       NSColor(hex: "#ffd866"),
            border:       NSColor(hex: "#403e41")
        )
    )

    // MARK: Material Dark

    static let materialDark = Theme(
        id: "material-dark",
        name: "Material Dark",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#212121"),
            foreground:          NSColor(hex: "#eeffff"),
            cursor:              NSColor(hex: "#ffcc00"),
            cursorAccent:        NSColor(hex: "#212121"),
            selectionBackground: NSColor(hex: "#82aaff").withAlphaComponent(0.2),
            ansi: [
                NSColor(hex: "#546e7a"),
                NSColor(hex: "#f07178"),
                NSColor(hex: "#c3e88d"),
                NSColor(hex: "#ffcb6b"),
                NSColor(hex: "#82aaff"),
                NSColor(hex: "#c792ea"),
                NSColor(hex: "#89ddff"),
                NSColor(hex: "#eeffff"),
                NSColor(hex: "#78909c"),
                NSColor(hex: "#f07178"),
                NSColor(hex: "#c3e88d"),
                NSColor(hex: "#ffcb6b"),
                NSColor(hex: "#82aaff"),
                NSColor(hex: "#c792ea"),
                NSColor(hex: "#89ddff"),
                NSColor(hex: "#ffffff"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#212121"),
            bgSecondary:  NSColor(hex: "#1a1a1a"),
            bgTertiary:   NSColor(hex: "#303030"),
            textPrimary:  NSColor(hex: "#eeffff"),
            textSecondary: NSColor(hex: "#b0bec5"),
            accent:       NSColor(hex: "#82aaff"),
            border:       NSColor(hex: "#303030")
        )
    )

    // MARK: Rose Pine

    static let rosePine = Theme(
        id: "rose-pine",
        name: "Rose Pine",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#191724"),
            foreground:          NSColor(hex: "#e0def4"),
            cursor:              NSColor(hex: "#524f67"),
            cursorAccent:        NSColor(hex: "#e0def4"),
            selectionBackground: NSColor(hex: "#c4a7e7").withAlphaComponent(0.2),
            ansi: [
                NSColor(hex: "#26233a"),
                NSColor(hex: "#eb6f92"),
                NSColor(hex: "#31748f"),
                NSColor(hex: "#f6c177"),
                NSColor(hex: "#9ccfd8"),
                NSColor(hex: "#c4a7e7"),
                NSColor(hex: "#ebbcba"),
                NSColor(hex: "#e0def4"),
                NSColor(hex: "#6e6a86"),
                NSColor(hex: "#eb6f92"),
                NSColor(hex: "#31748f"),
                NSColor(hex: "#f6c177"),
                NSColor(hex: "#9ccfd8"),
                NSColor(hex: "#c4a7e7"),
                NSColor(hex: "#ebbcba"),
                NSColor(hex: "#e0def4"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#191724"),
            bgSecondary:  NSColor(hex: "#1f1d2e"),
            bgTertiary:   NSColor(hex: "#26233a"),
            textPrimary:  NSColor(hex: "#e0def4"),
            textSecondary: NSColor(hex: "#908caa"),
            accent:       NSColor(hex: "#c4a7e7"),
            border:       NSColor(hex: "#26233a")
        )
    )

    // MARK: GitHub Dark

    static let githubDark = Theme(
        id: "github-dark",
        name: "GitHub Dark",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#0d1117"),
            foreground:          NSColor(hex: "#c9d1d9"),
            cursor:              NSColor(hex: "#c9d1d9"),
            cursorAccent:        NSColor(hex: "#0d1117"),
            selectionBackground: NSColor(hex: "#58a6ff").withAlphaComponent(0.2),
            ansi: [
                NSColor(hex: "#484f58"),
                NSColor(hex: "#ff7b72"),
                NSColor(hex: "#3fb950"),
                NSColor(hex: "#d29922"),
                NSColor(hex: "#58a6ff"),
                NSColor(hex: "#bc8cff"),
                NSColor(hex: "#39c5cf"),
                NSColor(hex: "#b1bac4"),
                NSColor(hex: "#6e7681"),
                NSColor(hex: "#ffa198"),
                NSColor(hex: "#56d364"),
                NSColor(hex: "#e3b341"),
                NSColor(hex: "#79c0ff"),
                NSColor(hex: "#d2a8ff"),
                NSColor(hex: "#56d4dd"),
                NSColor(hex: "#f0f6fc"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#0d1117"),
            bgSecondary:  NSColor(hex: "#161b22"),
            bgTertiary:   NSColor(hex: "#21262d"),
            textPrimary:  NSColor(hex: "#c9d1d9"),
            textSecondary: NSColor(hex: "#8b949e"),
            accent:       NSColor(hex: "#58a6ff"),
            border:       NSColor(hex: "#21262d")
        )
    )

    // MARK: One Dark

    static let oneDark = Theme(
        id: "one-dark",
        name: "One Dark",
        isDark: true,
        terminal: TerminalColors(
            background:          NSColor(hex: "#21252b"),
            foreground:          NSColor(hex: "#abb2bf"),
            cursor:              NSColor(hex: "#528bff"),
            cursorAccent:        NSColor(hex: "#21252b"),
            selectionBackground: NSColor(hex: "#61afef").withAlphaComponent(0.25),
            ansi: [
                NSColor(hex: "#21252b"),
                NSColor(hex: "#e06c75"),
                NSColor(hex: "#98c379"),
                NSColor(hex: "#e5c07b"),
                NSColor(hex: "#61afef"),
                NSColor(hex: "#c678dd"),
                NSColor(hex: "#56b6c2"),
                NSColor(hex: "#abb2bf"),
                NSColor(hex: "#5c6370"),
                NSColor(hex: "#e06c75"),
                NSColor(hex: "#98c379"),
                NSColor(hex: "#d19a66"),
                NSColor(hex: "#61afef"),
                NSColor(hex: "#c678dd"),
                NSColor(hex: "#56b6c2"),
                NSColor(hex: "#ffffff"),
            ]
        ),
        ui: UIColors(
            bgPrimary:    NSColor(hex: "#21252b"),
            bgSecondary:  NSColor(hex: "#282c34"),
            bgTertiary:   NSColor(hex: "#2c313a"),
            textPrimary:  NSColor(hex: "#abb2bf"),
            textSecondary: NSColor(hex: "#9da5b4"),
            accent:       NSColor(hex: "#61afef"),
            border:       NSColor(hex: "#3e4451")
        )
    )

    // MARK: - All presets

    static let all: [Theme] = [
        defaultDark,
        dracula,
        nord,
        solarizedDark,
        solarizedLight,
        tokyoNight,
        gruvboxDark,
        gruvboxLight,
        catppuccinMocha,
        catppuccinLatte,
        monokaiPro,
        materialDark,
        rosePine,
        githubDark,
        oneDark,
    ]
}
