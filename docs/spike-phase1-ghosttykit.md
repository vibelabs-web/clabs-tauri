# Spike Phase 1: GhosttyKit Library Acquisition + Rust FFI Bindings

## Date: 2026-04-06

## Summary

Successfully built full libghostty from source (ghostty 1.3.2-dev) and created Rust FFI bindings for the complete embedding API. `cargo check` passes.

## Acquisition Method

**Source build from official Ghostty repository** (Method 1b from spec).

### What worked

```bash
# Clone source
git clone --depth 1 https://github.com/ghostty-org/ghostty.git /tmp/ghostty

# Install Metal Toolchain (required, was missing)
xcodebuild -downloadComponent MetalToolchain

# Build xcframework for native (arm64 macOS)
cd /tmp/ghostty
zig build -Demit-xcframework=true -Dxcframework-target=native -Doptimize=ReleaseFast
```

### What didn't work

1. **SPM (nicktmro/GhosttyKit)**: Repository not found (404)
2. **SPM (ghostty-org/ghostty)**: No Package.swift in repo - not an SPM package
3. **First Zig build attempt**: Failed with "cannot execute tool 'metal'" - needed `xcodebuild -downloadComponent MetalToolchain`
4. **Universal xcframework**: Only tried `native` target (arm64 only) - `universal` would need x86_64 too

### Build artifacts

The build produces these key artifacts:
- `.zig-cache/.../libghostty.a` (9.6MB, arm64) - single-arch static lib
- `.zig-cache/.../libghostty-fat.a` (135MB, arm64) - with Metal renderer objects
- `.zig-cache/.../Ghostty.metallib` (52KB) - compiled Metal shaders
- `zig-out/lib/libghostty-vt.a` (7.8MB) - VT-only library (subset)

We use `libghostty-fat.a` renamed to `libghostty.a` because it includes the Metal renderer.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Zig | 0.15.2 | `brew install zig` |
| Xcode | 16+ | For Metal framework |
| Metal Toolchain | 17A324 | `xcodebuild -downloadComponent MetalToolchain` |

## Project Structure

```
src-tauri/
├── build.rs                    # Links libghostty + frameworks
├── vendor/
│   └── ghostty/
│       ├── include/
│       │   └── ghostty.h       # C header (1206 lines)
│       └── lib/
│           ├── libghostty.a    # Static lib (135MB, arm64) [gitignored]
│           ├── Ghostty.metallib # Metal shaders (52KB) [gitignored]
│           └── .gitkeep
└── src/
    └── ghostty/
        ├── mod.rs              # Module root + re-exports
        └── ffi.rs              # Rust FFI bindings (~500 lines)
```

## FFI Bindings Coverage

### Bound API functions

| Category | Functions | Status |
|----------|-----------|--------|
| Init | `ghostty_init`, `ghostty_info`, `ghostty_translate` | Bound |
| Config | `ghostty_config_new/free/clone/load_*/finalize/get` | Bound |
| App | `ghostty_app_new/free/tick/key/set_focus/update_config` | Bound |
| Surface | `ghostty_surface_new/free/draw/set_size/key/text/preedit` | Bound |
| Surface Mouse | `mouse_button/mouse_pos/mouse_scroll/mouse_pressure` | Bound |
| Surface IME | `ime_point`, `preedit`, `text` | Bound |
| Surface Selection | `has_selection`, `read_selection`, `free_text` | Bound |
| Surface Actions | `binding_action`, `split`, `split_focus`, `request_close` | Bound |
| Inspector | `inspector/free/set_focus/set_size` | Bound |
| macOS | `set_window_background_blur` | Bound |

### Types bound

- All opaque handles (`app_t`, `config_t`, `surface_t`, `inspector_t`)
- All input enums (keys, mods, mouse buttons, actions)
- Runtime callback types (wakeup, action, clipboard, close)
- `ghostty_runtime_config_s` (the runtime integration struct)
- `ghostty_surface_config_s` (surface creation config with NSView)
- `ghostty_surface_size_s`, `ghostty_input_key_s`, `ghostty_text_s`

## Linked Frameworks

```
Metal, MetalKit, AppKit, QuartzCore,
CoreText, CoreGraphics, CoreFoundation,
Foundation, IOKit, IOSurface, UniformTypeIdentifiers
libc, libc++
```

## Verification

```
$ cargo check
   Compiling clabs v1.9.3
warning: `clabs` (lib) generated 2 warnings (pre-existing)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 42.37s
```

All 2 warnings are pre-existing (unused import, unused variable) - not from ghostty module.

## Build Instructions (for fresh checkout)

```bash
# 1. Ensure prerequisites
zig version  # >= 0.15
xcodebuild -downloadComponent MetalToolchain

# 2. Build libghostty
git clone --depth 1 https://github.com/ghostty-org/ghostty.git /tmp/ghostty
cd /tmp/ghostty
zig build -Demit-xcframework=true -Dxcframework-target=native -Doptimize=ReleaseFast

# 3. Copy artifacts
cp .zig-cache/o/*/libghostty-fat.a /path/to/clabs-tauri/src-tauri/vendor/ghostty/lib/libghostty.a
cp .zig-cache/o/*/Ghostty.metallib /path/to/clabs-tauri/src-tauri/vendor/ghostty/lib/
cp include/ghostty.h /path/to/clabs-tauri/src-tauri/vendor/ghostty/include/

# 4. Verify
cd /path/to/clabs-tauri/src-tauri
cargo check
```

## Next Steps (Phase 2)

1. Create safe Rust wrapper around FFI (`ghostty/wrapper.rs`)
2. Implement `ghostty_runtime_config_s` callbacks for Tauri
3. Create NSView integration via `objc2` crate
4. Wire surface lifecycle to Tauri window events
5. Replace xterm.js with GhosttyKit Metal surface

## Known Issues

- Library is 135MB (fat archive with debug symbols) - consider `ReleaseFast` strip or using the 9.6MB single-object version
- Only arm64 built - x86_64 would need `-Dxcframework-target=universal`
- Metal Toolchain download is ~700MB - one-time setup
