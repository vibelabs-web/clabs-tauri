use regex::Regex;
use std::sync::LazyLock;

/// Compiled regex for ANSI escape sequences
static ANSI_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(concat!(
        r"\x1b\[[0-9;]*[a-zA-Z]",        // CSI sequences (colors, cursor, etc.)
        r"|\x1b\][^\x07]*\x07",           // OSC sequences (title, etc.)
        r"|\x1b\][^\x1b]*\x1b\\",         // OSC with ST terminator
        r"|\x1b[()][AB012]",              // Character set selection
        r"|\x1b[>=<]",                     // Keypad mode
        r"|\x1b\[[\?]?[0-9;]*[hlsr]",    // Private mode set/reset
        r"|\x1b\[\d*[ABCDHJ]",           // Cursor movement, erase
        r"|\x07",                          // BEL
        r"|\x08",                          // Backspace
    ))
    .unwrap()
});

/// Strip all ANSI escape sequences from text
pub fn strip_ansi(input: &str) -> String {
    ANSI_RE.replace_all(input, "").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_strip_colors() {
        assert_eq!(strip_ansi("\x1b[31mred\x1b[0m"), "red");
    }

    #[test]
    fn test_strip_osc() {
        assert_eq!(strip_ansi("\x1b]0;title\x07text"), "text");
    }

    #[test]
    fn test_plain_text_unchanged() {
        assert_eq!(strip_ansi("hello world"), "hello world");
    }

    #[test]
    fn test_korean_text() {
        assert_eq!(strip_ansi("\x1b[1m안녕하세요\x1b[0m"), "안녕하세요");
    }
}
