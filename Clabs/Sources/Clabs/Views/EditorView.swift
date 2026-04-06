import AppKit

// @TASK Phase5C - Code editor view (NSTextView + line numbers + dark theme)
// @SPEC Sources/Clabs/Views/EditorTabBar.swift

// MARK: - EditorViewDelegate

protocol EditorViewDelegate: AnyObject {
    func editorView(_ view: EditorView, didChangeModified isModified: Bool)
}

// MARK: - EditorView

final class EditorView: NSView {

    // MARK: - Constants

    private static let editorFont: NSFont = {
        let candidates = ["JetBrains Mono", "Menlo", "SF Mono", "Monaco", "Courier New"]
        for name in candidates {
            if let f = NSFont(name: name, size: 13) { return f }
        }
        return NSFont.monospacedSystemFont(ofSize: 13, weight: .regular)
    }()

    private static let bgColor         = NSColor(srgbRed: 0.05, green: 0.07, blue: 0.09, alpha: 1) // #0d1117
    private static let textColor       = NSColor(srgbRed: 0.90, green: 0.93, blue: 0.95, alpha: 1) // #e6edf3
    private static let gutterBg        = NSColor(srgbRed: 0.07, green: 0.09, blue: 0.11, alpha: 1)
    private static let gutterText      = NSColor(white: 0.40, alpha: 1)
    private static let gutterWidth: CGFloat = 52

    // MARK: - State

    weak var delegate: EditorViewDelegate?

    private(set) var filePath: String = ""
    private(set) var isModified: Bool = false {
        didSet {
            if oldValue != isModified { delegate?.editorView(self, didChangeModified: isModified) }
        }
    }

    private var scrollView: NSScrollView!
    private var textView: EditorTextView!
    private var gutterView: LineNumberRulerView!
    private var ignoreNextChange = false

    // MARK: - Init

    override init(frame: NSRect) {
        super.init(frame: frame)
        setupViews()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupViews()
    }

    // MARK: - Setup

    private func setupViews() {
        wantsLayer = true
        layer?.backgroundColor = Self.bgColor.cgColor

        // Text container / storage
        let textStorage = NSTextStorage()
        let layoutManager = NSLayoutManager()
        textStorage.addLayoutManager(layoutManager)

        let textContainer = NSTextContainer(size: NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude))
        textContainer.widthTracksTextView = true
        layoutManager.addTextContainer(textContainer)

        textView = EditorTextView(frame: .zero, textContainer: textContainer)
        textView.autoresizingMask = [.width]
        textView.font = Self.editorFont
        textView.textColor = Self.textColor
        textView.backgroundColor = Self.bgColor
        textView.insertionPointColor = NSColor(white: 0.85, alpha: 1)
        textView.isRichText = false
        textView.isAutomaticQuoteSubstitutionEnabled = false
        textView.isAutomaticDashSubstitutionEnabled = false
        textView.isAutomaticLinkDetectionEnabled = false
        textView.isAutomaticSpellingCorrectionEnabled = false
        textView.isAutomaticTextCompletionEnabled = false
        textView.isAutomaticTextReplacementEnabled = false
        textView.isEditable = true
        textView.isSelectable = true
        textView.allowsUndo = true
        textView.smartInsertDeleteEnabled = false
        textView.usesFindPanel = true
        textView.delegate = self

        // Default paragraph style (no tab stops weirdness)
        let para = NSMutableParagraphStyle()
        para.defaultTabInterval = 28
        para.tabStops = []
        textView.defaultParagraphStyle = para

        scrollView = NSScrollView(frame: bounds)
        scrollView.autoresizingMask = [.width, .height]
        scrollView.hasVerticalScroller = true
        scrollView.hasHorizontalScroller = false
        scrollView.scrollerStyle = .overlay
        scrollView.drawsBackground = true
        scrollView.backgroundColor = Self.bgColor
        scrollView.documentView = textView
        addSubview(scrollView)

        // Gutter (line numbers)
        gutterView = LineNumberRulerView(
            scrollView: scrollView,
            font: Self.editorFont,
            bg: Self.gutterBg,
            text: Self.gutterText,
            width: Self.gutterWidth
        )
        scrollView.verticalRulerView = gutterView
        scrollView.rulersVisible = true
        scrollView.hasVerticalRuler = true

        // Key monitor for Cmd+S inside this view
        // (handled by AppDelegate menu item; no extra monitor needed)
    }

    // MARK: - Layout

    override func layout() {
        super.layout()
        scrollView.frame = bounds
    }

    // MARK: - Public API

    func load(path: String) {
        filePath = path
        do {
            let content = try String(contentsOfFile: path, encoding: .utf8)
            ignoreNextChange = true
            textView.string = content
            ignoreNextChange = false
            isModified = false
            gutterView.invalidateLineNumbers()
        } catch {
            ignoreNextChange = true
            textView.string = "// 파일을 열 수 없습니다: \(error.localizedDescription)"
            ignoreNextChange = false
            isModified = false
        }
        // Scroll to top
        scrollView.documentView?.scroll(.zero)
    }

    @discardableResult
    func save() -> Bool {
        guard !filePath.isEmpty, isModified else { return true }
        do {
            try textView.string.write(toFile: filePath, atomically: true, encoding: .utf8)
            isModified = false
            return true
        } catch {
            NSLog("[EditorView] save failed: %@", error.localizedDescription)
            let alert = NSAlert()
            alert.messageText = "저장 실패"
            alert.informativeText = error.localizedDescription
            alert.alertStyle = .warning
            alert.runModal()
            return false
        }
    }

    // MARK: - First Responder

    override var acceptsFirstResponder: Bool { true }

    override func becomeFirstResponder() -> Bool {
        return window?.makeFirstResponder(textView) ?? false
    }
}

// MARK: - NSTextViewDelegate

extension EditorView: NSTextViewDelegate {

    func textDidChange(_ notification: Notification) {
        guard !ignoreNextChange else { return }
        isModified = true
        gutterView.invalidateLineNumbers()
    }
}

// MARK: - EditorTextView (subclass for tab key handling)

private final class EditorTextView: NSTextView {

    override func keyDown(with event: NSEvent) {
        // Tab → insert 4 spaces
        if event.keyCode == 48 && !event.modifierFlags.contains(.shift) {
            insertText("    ", replacementRange: selectedRange())
            return
        }
        super.keyDown(with: event)
    }
}

// MARK: - LineNumberRulerView

private final class LineNumberRulerView: NSRulerView {

    private let editorFont: NSFont
    private let bgColor: NSColor
    private let textColor: NSColor

    init(scrollView: NSScrollView, font: NSFont, bg: NSColor, text: NSColor, width: CGFloat) {
        self.editorFont = font
        self.bgColor = bg
        self.textColor = text
        super.init(scrollView: scrollView, orientation: .verticalRuler)
        ruleThickness = width
    }

    required init(coder: NSCoder) { fatalError() }

    func invalidateLineNumbers() {
        needsDisplay = true
    }

    override func drawHashMarksAndLabels(in rect: NSRect) {
        bgColor.setFill()
        rect.fill()

        // Thin separator on right
        NSColor(white: 0.18, alpha: 1).setFill()
        NSRect(x: rect.maxX - 1, y: rect.minY, width: 1, height: rect.height).fill()

        guard let textView = clientView as? NSTextView,
              let layoutManager = textView.layoutManager,
              let textContainer = textView.textContainer else { return }

        let visibleRect = scrollView?.contentView.bounds ?? .zero
        let attrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.monospacedDigitSystemFont(ofSize: editorFont.pointSize - 1, weight: .regular),
            .foregroundColor: textColor,
        ]

        let text = textView.string
        let nsText = text as NSString
        let glyphCount = layoutManager.numberOfGlyphs
        guard glyphCount > 0 else {
            // Empty file — draw line 1
            drawLineNumber(1, y: -visibleRect.origin.y, height: textView.font?.ascender ?? 14, attrs: attrs)
            return
        }

        var lineNumber = 1
        var charIndex = 0

        while charIndex < text.count {
            let charRange = NSRange(location: charIndex, length: 0)
            let glyphRange = layoutManager.glyphRange(forCharacterRange: charRange, actualCharacterRange: nil)
            guard glyphRange.location < glyphCount else { break }
            let lineRect = layoutManager.lineFragmentRect(forGlyphAt: glyphRange.location, effectiveRange: nil)
            let y = lineRect.origin.y - visibleRect.origin.y
            drawLineNumber(lineNumber, y: y, height: lineRect.height, attrs: attrs)

            // Advance to next line
            var lineEnd = charIndex
            var contentsEnd = charIndex
            nsText.getLineStart(nil, end: &lineEnd, contentsEnd: &contentsEnd, for: NSRange(location: charIndex, length: 0))
            if lineEnd <= charIndex { break }
            charIndex = lineEnd
            lineNumber += 1
        }
    }

    private func drawLineNumber(_ n: Int, y: CGFloat, height: CGFloat, attrs: [NSAttributedString.Key: Any]) {
        let label = "\(n)" as NSString
        let sz = label.size(withAttributes: attrs)
        let drawRect = NSRect(
            x: ruleThickness - sz.width - 8,
            y: y + (height - sz.height) / 2,
            width: sz.width,
            height: sz.height
        )
        label.draw(in: drawRect, withAttributes: attrs)
    }
}
