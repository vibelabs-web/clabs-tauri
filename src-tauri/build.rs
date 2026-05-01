fn main() {
    tauri_build::build();

    // Link libghostty (full embedding API) on macOS
    #[cfg(target_os = "macos")]
    {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let vendor_lib = format!("{}/vendor/ghostty/lib", manifest_dir);

        // Static library
        println!("cargo:rustc-link-search=native={}", vendor_lib);
        println!("cargo:rustc-link-lib=static=ghostty");

        // System frameworks required by libghostty
        println!("cargo:rustc-link-lib=framework=Metal");
        println!("cargo:rustc-link-lib=framework=MetalKit");
        println!("cargo:rustc-link-lib=framework=AppKit");
        println!("cargo:rustc-link-lib=framework=QuartzCore");
        println!("cargo:rustc-link-lib=framework=CoreText");
        println!("cargo:rustc-link-lib=framework=CoreGraphics");
        println!("cargo:rustc-link-lib=framework=CoreFoundation");
        println!("cargo:rustc-link-lib=framework=Foundation");
        println!("cargo:rustc-link-lib=framework=IOKit");
        println!("cargo:rustc-link-lib=framework=IOSurface");
        println!("cargo:rustc-link-lib=framework=UniformTypeIdentifiers");

        // C/C++ standard libraries + GCD
        println!("cargo:rustc-link-lib=c");
        println!("cargo:rustc-link-lib=c++");
        println!("cargo:rustc-link-lib=framework=System"); // libdispatch (GCD)

        // Rerun if vendor library changes
        println!("cargo:rerun-if-changed=vendor/ghostty/lib/libghostty.a");
        println!("cargo:rerun-if-changed=vendor/ghostty/include/ghostty.h");
    }
}
