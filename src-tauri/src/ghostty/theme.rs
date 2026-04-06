// @TASK P3B-THEME - Ghostty theme mapping: TerminalTheme -> Ghostty config colors
// @SPEC src/shared/themes/types.ts#TerminalTheme
//
// Maps frontend TerminalTheme color keys (background, foreground, cursor,
// ANSI 0-15) to Ghostty config file format. The generated config is written
// to a temporary file and loaded via ghostty_config_load_file, because the
// Ghostty embedding API does not expose a load-from-string function.

use std::collections::HashMap;
use std::fmt::Write as FmtWrite;
use std::io::Write;

use serde::{Deserialize, Serialize};

// ===================================================================
// GhosttyThemeColors — structured representation
// ===================================================================

/// Structured theme color data that can be serialized from / to JSON.
/// All color values are CSS hex strings (e.g. "#1e1e2e").
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GhosttyThemeColors {
    pub background: String,
    pub foreground: String,
    pub cursor_color: String,
    pub cursor_text: String,
    pub selection_background: String,
    pub selection_foreground: String,
    /// ANSI palette colors 0-15 as hex strings.
    pub palette: [String; 16],
}

// ===================================================================
// Frontend key -> Ghostty config key mapping
// ===================================================================

/// ANSI color names in the order the frontend sends them (palette index 0-15).
const ANSI_KEYS: &[(&str, u8)] = &[
    ("black", 0),
    ("red", 1),
    ("green", 2),
    ("yellow", 3),
    ("blue", 4),
    ("magenta", 5),
    ("cyan", 6),
    ("white", 7),
    ("brightBlack", 8),
    ("brightRed", 9),
    ("brightGreen", 10),
    ("brightYellow", 11),
    ("brightBlue", 12),
    ("brightMagenta", 13),
    ("brightCyan", 14),
    ("brightWhite", 15),
];

/// Convert a CSS color string to a plain hex color suitable for Ghostty config.
///
/// Ghostty config expects colors as bare hex like `#rrggbb` (or `rrggbb`).
/// This function handles:
/// - `#rrggbb` / `#rgb` — returned as-is (normalized to 6-digit)
/// - `rgba(r, g, b, a)` — alpha is dropped, converted to `#rrggbb`
/// - `rgb(r, g, b)` — converted to `#rrggbb`
///
/// Returns `None` if the format is unrecognized.
fn normalize_color(css_color: &str) -> Option<String> {
    let trimmed = css_color.trim();

    // Handle #hex formats
    if trimmed.starts_with('#') {
        let hex = &trimmed[1..];
        return match hex.len() {
            // #rgb -> #rrggbb
            3 => {
                let mut expanded = String::with_capacity(7);
                expanded.push('#');
                for ch in hex.chars() {
                    expanded.push(ch);
                    expanded.push(ch);
                }
                Some(expanded)
            }
            // #rrggbb or #rrggbbaa (drop alpha)
            6 => Some(trimmed.to_string()),
            8 => Some(format!("#{}", &hex[..6])),
            _ => Some(trimmed.to_string()),
        };
    }

    // Handle rgba(r, g, b, a) and rgb(r, g, b)
    if trimmed.starts_with("rgba(") || trimmed.starts_with("rgb(") {
        let inner = trimmed
            .trim_start_matches("rgba(")
            .trim_start_matches("rgb(")
            .trim_end_matches(')');
        let parts: Vec<&str> = inner.split(',').collect();
        if parts.len() >= 3 {
            let r: u8 = parts[0].trim().parse().ok()?;
            let g: u8 = parts[1].trim().parse().ok()?;
            let b: u8 = parts[2].trim().parse().ok()?;
            return Some(format!("#{:02x}{:02x}{:02x}", r, g, b));
        }
    }

    // Fallback: return as-is if it looks like a hex value without #
    if trimmed.len() == 6 && trimmed.chars().all(|c| c.is_ascii_hexdigit()) {
        return Some(format!("#{}", trimmed));
    }

    None
}

// ===================================================================
// Config generation
// ===================================================================

/// Build a Ghostty config string from the frontend theme HashMap.
///
/// The HashMap keys match the `TerminalTheme` interface from types.ts:
/// - `background`, `foreground`, `cursor`, `cursorAccent`, `selectionBackground`
/// - ANSI names: `black`, `red`, `green`, ... `brightWhite`
///
/// Returns a config string in Ghostty's `key = value` format.
pub fn build_ghostty_config_string(theme: &HashMap<String, String>) -> String {
    let mut config = String::with_capacity(512);

    // Direct color mappings
    let direct_keys: &[(&str, &str)] = &[
        ("background", "background"),
        ("foreground", "foreground"),
        ("cursor", "cursor-color"),
        ("cursorAccent", "cursor-text"),
        ("selectionBackground", "selection-background"),
        ("selectionForeground", "selection-foreground"),
    ];

    for &(frontend_key, ghostty_key) in direct_keys {
        if let Some(value) = theme.get(frontend_key) {
            if let Some(normalized) = normalize_color(value) {
                let _ = writeln!(config, "{} = {}", ghostty_key, normalized);
            }
        }
    }

    // ANSI palette (0-15)
    for &(frontend_key, index) in ANSI_KEYS {
        if let Some(value) = theme.get(frontend_key) {
            if let Some(normalized) = normalize_color(value) {
                let _ = writeln!(config, "palette = {}={}", index, normalized);
            }
        }
    }

    config
}

/// Build a `GhosttyThemeColors` struct from the frontend HashMap.
///
/// Missing values are filled with sensible defaults (dark theme).
pub fn parse_theme_colors(theme: &HashMap<String, String>) -> GhosttyThemeColors {
    let get = |key: &str, default: &str| -> String {
        theme
            .get(key)
            .and_then(|v| normalize_color(v))
            .unwrap_or_else(|| default.to_string())
    };

    let palette: [String; 16] = [
        get("black", "#000000"),
        get("red", "#cc0000"),
        get("green", "#4e9a06"),
        get("yellow", "#c4a000"),
        get("blue", "#3465a4"),
        get("magenta", "#75507b"),
        get("cyan", "#06989a"),
        get("white", "#d3d7cf"),
        get("brightBlack", "#555753"),
        get("brightRed", "#ef2929"),
        get("brightGreen", "#8ae234"),
        get("brightYellow", "#fce94f"),
        get("brightBlue", "#729fcf"),
        get("brightMagenta", "#ad7fa8"),
        get("brightCyan", "#34e2e2"),
        get("brightWhite", "#eeeeec"),
    ];

    GhosttyThemeColors {
        background: get("background", "#1e1e2e"),
        foreground: get("foreground", "#cdd6f4"),
        cursor_color: get("cursor", "#f5e0dc"),
        cursor_text: get("cursorAccent", "#1e1e2e"),
        selection_background: get("selectionBackground", "#44475a"),
        selection_foreground: get("selectionForeground", "#cdd6f4"),
        palette,
    }
}

/// Write the theme config to a temporary file and return its path.
///
/// The caller is responsible for loading this file via `ghostty_config_load_file`
/// and then cleaning up the temp file.
pub fn write_theme_config_file(
    theme: &HashMap<String, String>,
) -> Result<std::path::PathBuf, String> {
    let config_str = build_ghostty_config_string(theme);

    let mut tmp = tempfile::NamedTempFile::new()
        .map_err(|e| format!("failed to create temp file: {}", e))?;

    tmp.write_all(config_str.as_bytes())
        .map_err(|e| format!("failed to write theme config: {}", e))?;

    // Persist the temp file so it survives the NamedTempFile drop
    let path = tmp
        .into_temp_path()
        .keep()
        .map_err(|e| format!("failed to persist temp file: {}", e))?;

    Ok(path)
}

// ===================================================================
// Tests
// ===================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_theme() -> HashMap<String, String> {
        let mut m = HashMap::new();
        m.insert("background".into(), "#1e1e2e".into());
        m.insert("foreground".into(), "#cdd6f4".into());
        m.insert("cursor".into(), "#f5e0dc".into());
        m.insert("cursorAccent".into(), "#1e1e2e".into());
        m.insert(
            "selectionBackground".into(),
            "rgba(137, 180, 250, 0.25)".into(),
        );
        m.insert("black".into(), "#45475a".into());
        m.insert("red".into(), "#f38ba8".into());
        m.insert("green".into(), "#a6e3a1".into());
        m.insert("yellow".into(), "#f9e2af".into());
        m.insert("blue".into(), "#89b4fa".into());
        m.insert("magenta".into(), "#f5c2e7".into());
        m.insert("cyan".into(), "#94e2d5".into());
        m.insert("white".into(), "#bac2de".into());
        m.insert("brightBlack".into(), "#585b70".into());
        m.insert("brightRed".into(), "#f38ba8".into());
        m.insert("brightGreen".into(), "#a6e3a1".into());
        m.insert("brightYellow".into(), "#f9e2af".into());
        m.insert("brightBlue".into(), "#89b4fa".into());
        m.insert("brightMagenta".into(), "#f5c2e7".into());
        m.insert("brightCyan".into(), "#94e2d5".into());
        m.insert("brightWhite".into(), "#a6adc8".into());
        m
    }

    #[test]
    fn test_normalize_hex6() {
        assert_eq!(normalize_color("#1e1e2e"), Some("#1e1e2e".to_string()));
    }

    #[test]
    fn test_normalize_hex3() {
        assert_eq!(normalize_color("#abc"), Some("#aabbcc".to_string()));
    }

    #[test]
    fn test_normalize_hex8_drops_alpha() {
        assert_eq!(normalize_color("#1e1e2eff"), Some("#1e1e2e".to_string()));
    }

    #[test]
    fn test_normalize_rgba() {
        assert_eq!(
            normalize_color("rgba(137, 180, 250, 0.25)"),
            Some("#89b4fa".to_string())
        );
    }

    #[test]
    fn test_normalize_rgb() {
        assert_eq!(
            normalize_color("rgb(255, 0, 128)"),
            Some("#ff0080".to_string())
        );
    }

    #[test]
    fn test_build_config_string_contains_keys() {
        let theme = sample_theme();
        let config = build_ghostty_config_string(&theme);

        assert!(config.contains("background = #1e1e2e"));
        assert!(config.contains("foreground = #cdd6f4"));
        assert!(config.contains("cursor-color = #f5e0dc"));
        assert!(config.contains("cursor-text = #1e1e2e"));
        // rgba selection background -> normalized hex
        assert!(config.contains("selection-background = #89b4fa"));
        // Palette entries
        assert!(config.contains("palette = 0=#45475a"));
        assert!(config.contains("palette = 1=#f38ba8"));
        assert!(config.contains("palette = 15=#a6adc8"));
    }

    #[test]
    fn test_parse_theme_colors() {
        let theme = sample_theme();
        let colors = parse_theme_colors(&theme);

        assert_eq!(colors.background, "#1e1e2e");
        assert_eq!(colors.foreground, "#cdd6f4");
        assert_eq!(colors.cursor_color, "#f5e0dc");
        assert_eq!(colors.palette[0], "#45475a");
        assert_eq!(colors.palette[1], "#f38ba8");
        assert_eq!(colors.palette[15], "#a6adc8");
    }

    #[test]
    fn test_parse_theme_colors_defaults() {
        let empty = HashMap::new();
        let colors = parse_theme_colors(&empty);

        // Should use defaults
        assert_eq!(colors.background, "#1e1e2e");
        assert_eq!(colors.foreground, "#cdd6f4");
        assert_eq!(colors.palette[0], "#000000");
    }

    #[test]
    fn test_all_15_presets_ansi_keys_covered() {
        // Verify that our ANSI_KEYS covers exactly 16 entries (0-15)
        assert_eq!(ANSI_KEYS.len(), 16);
        for (i, &(_, index)) in ANSI_KEYS.iter().enumerate() {
            assert_eq!(index as usize, i, "ANSI key index mismatch at position {}", i);
        }
    }

    #[test]
    fn test_write_theme_config_file() {
        let theme = sample_theme();
        let path = write_theme_config_file(&theme).expect("should write temp file");

        let contents = std::fs::read_to_string(&path).expect("should read temp file");
        assert!(contents.contains("background = #1e1e2e"));
        assert!(contents.contains("palette = 0=#45475a"));

        // Cleanup
        let _ = std::fs::remove_file(&path);
    }
}
