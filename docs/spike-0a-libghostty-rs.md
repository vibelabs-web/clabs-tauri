# Spike 0A: libghostty-rs Build & API Investigation

**Date**: 2026-04-06
**Status**: BUILD SUCCESS

## Environment

| Component | Version |
|-----------|---------|
| macOS | Darwin 25.3.0 (arm64) |
| Rust | 1.94.1 (stable) |
| Zig | 0.15.2 |
| Crate | `libghostty-vt` 0.1.1 |

## Build Result

`cargo check` passes on macOS arm64 after adding `libghostty-vt = "0.1.1"` to `src-tauri/Cargo.toml`.

**Prerequisites**:
- Rust >= 1.93 (MSRV set by the crate)
- Zig >= 0.15.x on PATH (build.rs fetches ghostty source at a pinned commit and compiles `libghostty-vt` via `zig build`)
- No manual ghostty checkout required (vendored by default via `build.rs`)

**Build time**: ~46 seconds (first build, includes ghostty git clone + zig compilation).

**Artifact**: Produces `libghostty-vt.0.1.0.dylib` (macOS) — a shared library that must be shipped alongside the app or linked statically.

## Repository

- **GitHub**: https://github.com/Uzaaft/libghostty-rs (244 stars, actively maintained, last updated 2026-04-04)
- **Crate**: https://crates.io/crates/libghostty-vt
- **License**: MIT OR Apache-2.0
- **Workspace**: `libghostty-vt-sys` (raw FFI) + `libghostty-vt` (safe Rust API)

## Available API Surface

### Core: `terminal` module

| API | Description |
|-----|-------------|
| `Terminal::new(opts)` | Create terminal with cols, rows, max_scrollback |
| `Terminal::new_with_alloc(alloc, opts)` | Create with custom allocator |
| `terminal.vt_write(data)` | Feed raw VT bytes (never fails) |
| `terminal.resize(cols, rows, cell_w_px, cell_h_px)` | Resize terminal |
| `terminal.reset()` | Full terminal reset (RIS) |
| `terminal.scroll_viewport(scroll)` | Scroll: Top, Bottom, Delta(n) |
| `terminal.grid_ref(point)` | Resolve grid point to cell/row |
| `terminal.mode(mode)` / `set_mode(mode, val)` | Get/set terminal modes (DEC/ANSI) |
| `terminal.cols()` / `rows()` | Get dimensions |
| `terminal.cursor_x()` / `cursor_y()` | Cursor position |
| `terminal.is_cursor_visible()` | Cursor visibility |
| `terminal.cursor_style()` | Current SGR style of cursor |
| `terminal.title()` | Window title (OSC 0/2) |
| `terminal.pwd()` | Current working directory (OSC 7) |
| `terminal.total_rows()` / `scrollback_rows()` | Scrollback info |
| `terminal.scrollbar()` | Scrollbar state |
| `terminal.active_screen()` | Primary vs alternate screen |
| `terminal.is_mouse_tracking()` | Mouse mode active? |
| `terminal.kitty_keyboard_flags()` | Kitty keyboard protocol state |

### Colors

| API | Description |
|-----|-------------|
| `terminal.fg_color()` / `bg_color()` / `cursor_color()` | Effective colors |
| `terminal.default_fg_color()` / `default_bg_color()` | Default colors |
| `terminal.set_default_fg_color(color)` | Set default foreground |
| `terminal.set_default_bg_color(color)` | Set default background |
| `terminal.set_default_cursor_color(color)` | Set cursor color |
| `terminal.color_palette()` | Full 256-color palette |
| `terminal.set_default_color_palette(palette)` | Set palette |

### Effects (Callbacks registered on Terminal)

| Effect | Trigger |
|--------|---------|
| `on_pty_write(cb)` | VT sequences that require PTY write-back (e.g., DA queries) |
| `on_bell(cb)` | Bell character (BEL) |
| `on_title_changed(cb)` | Title change (OSC 0/2) |
| `on_device_attributes(cb)` | Device attributes query |

### Rendering: `render` module

| API | Description |
|-----|-------------|
| `RenderState::new()` | Create render state |
| `render_state.update(&terminal)` | Capture snapshot from terminal |
| `snapshot.dirty()` | Check dirty state: Clean, Partial, Full |
| `snapshot.colors()` | Get bg/fg/palette colors for rendering |
| `RowIterator` / `CellIterator` | Iterate rows and cells for drawing |

### Input: `key` module

| API | Description |
|-----|-------------|
| `key::Encoder::new()` | Create key encoder |
| `encoder.set_options_from_terminal(&terminal)` | Sync encoder with terminal modes |
| `encoder.encode_to_vec(&event, &mut vec)` | Encode key event to escape sequence |
| `key::Event::new()` | Create key event (action, key, modifiers) |

### Input: `mouse` module

| API | Description |
|-----|-------------|
| `mouse::Encoder::new()` | Create mouse encoder |
| `encoder.set_options_from_terminal(&terminal)` | Sync with terminal mouse mode |
| `encoder.encode_to_vec(&event, &mut vec)` | Encode mouse event |

### Other modules

| Module | Description |
|--------|-------------|
| `focus` | Focus gained/lost encoding (CSI I/O) |
| `paste` | Paste safety check + bracketed paste encoding |
| `screen` | Cell/Row/GridRef types (graphemes, styles, colors) |
| `style` | SGR styles, RgbColor, PaletteIndex |
| `sgr` | SGR attribute flags |
| `osc` | OSC sequence handling |
| `fmt` | Format sequences |

## Thread Safety

All `libghostty-vt` objects are `!Send + !Sync`. They must be managed by a single thread. Communication with other threads should use channels.

## What This Crate IS

`libghostty-vt` is a **VT terminal emulation library** — it handles:
- VT stream parsing (escape sequences, control codes)
- Terminal state management (screen buffer, scrollback, cursor, modes)
- Render state snapshots (dirty tracking, row/cell iteration)
- Key/mouse event encoding (legacy + Kitty keyboard protocol)
- Color management (256-color palette, true color, themes)

## What This Crate IS NOT

`libghostty-vt` is **not** a full terminal embedding (unlike the ghostty.h C API used by the macOS app). It does NOT provide:
- GPU rendering / font rasterization
- Surface/window management
- PTY management (process spawning, I/O)
- Clipboard integration
- Configuration file parsing
- Shell integration / semantic zones
- Selection / text search

These must be implemented by the embedding application (us).

## Architecture Implications for clabs-tauri

```
Current architecture:
  [Frontend: xterm.js] <--WebSocket--> [Backend: portable-pty]

Proposed architecture with libghostty-vt:
  [Frontend: Canvas/WebGL renderer] <--Tauri IPC-->
     [Backend: libghostty-vt (VT state)] <--> [portable-pty (PTY I/O)]
```

### What we keep
- `portable-pty` for PTY process spawning and I/O (already in Cargo.toml)

### What we add
- `libghostty-vt` for VT state management + render state
- Custom renderer on the frontend (Canvas 2D or WebGL)

### Data flow
1. PTY output bytes -> `terminal.vt_write(bytes)` -> updates terminal state
2. `render_state.update(&terminal)` -> snapshot with dirty tracking
3. Snapshot rows/cells -> serialize to frontend via Tauri IPC
4. Frontend renders cells on Canvas/WebGL
5. User key/mouse events -> `key::Encoder` / `mouse::Encoder` -> escape sequences
6. Escape sequences -> write to PTY

## Missing Capabilities (We Must Build)

| Capability | Status | Notes |
|------------|--------|-------|
| GPU/Canvas rendering | MISSING | Must build WebGL/Canvas renderer in frontend |
| Font metrics/rasterization | MISSING | Need to measure cell size, render glyphs |
| Text selection | MISSING | Must implement on top of grid_ref/screen API |
| Text search | MISSING | Must implement on top of screen iteration |
| PTY integration glue | MISSING | Wire portable-pty I/O to vt_write/on_pty_write |
| IPC serialization | MISSING | Serialize render snapshots for Tauri commands |
| Clipboard | MISSING | Handle OSC 52 + system clipboard via Tauri |
| Config/theming | PARTIAL | Can set colors via API; need config file layer |
| Sixel/Kitty images | UNKNOWN | VT parser may handle; rendering is on us |
| Ligatures | MISSING | Font-level feature, not in VT library |

## Recommended Approach

**Use `libghostty-vt` (the safe Rust crate).** Reasons:

1. **BUILD SUCCESS** -- compiles on macOS arm64 with Zig 0.15 + Rust 1.93+
2. **Complete VT emulation** -- battle-tested ghostty VT parser with full mode support
3. **Clean Rust API** -- safe wrappers, no raw pointers in user code
4. **Dirty tracking** -- efficient render updates (only redraw changed rows)
5. **Key/mouse encoding** -- handles Kitty keyboard protocol, SGR mouse, etc.
6. **Active maintenance** -- 244 stars, last updated 2 days ago

### Alternative: Direct C FFI via ghostty.h

Not recommended because:
- `ghostty.h` is the full embedding API (macOS app), much more complex
- Requires building the full ghostty binary, not just VT library
- The `libghostty-vt` crate already does the FFI work for us
- `ghostty.h` API is not documented beyond Zig source

## Blockers

| Blocker | Severity | Mitigation |
|---------|----------|------------|
| Zig 0.15.x required at build time | LOW | `brew install zig` or CI setup |
| Rust >= 1.93 MSRV | LOW | Already resolved (updated to 1.94.1) |
| Shared library (.dylib) must be bundled | MEDIUM | Tauri bundler config needed |
| `!Send + !Sync` -- single-threaded only | MEDIUM | Use dedicated thread + channels |
| No built-in renderer | HIGH | Must build Canvas/WebGL renderer |
| No selection/search | MEDIUM | Must implement on top of screen API |

## Next Steps

1. **Spike 0B**: Prototype minimal terminal -- wire `portable-pty` + `libghostty-vt` + simple Tauri IPC to render a grid in the frontend
2. **Spike 0C**: Evaluate Canvas 2D vs WebGL for cell rendering performance
3. **Phase 1**: Implement full terminal with input handling, colors, scrollback
4. **Phase 2**: Selection, search, clipboard, theming
