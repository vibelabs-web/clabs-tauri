// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "Clabs",
    platforms: [.macOS(.v13)],
    targets: [
        .systemLibrary(
            name: "CGhostty",
            path: "Sources/CGhostty",
            pkgConfig: nil,
            providers: nil
        ),
        .executableTarget(
            name: "Clabs",
            dependencies: ["CGhostty"],
            path: "Sources/Clabs",
            linkerSettings: [
                .unsafeFlags([
                    "-L", "vendor/ghostty/lib",
                    "-lghostty",
                ]),
                .linkedFramework("Metal"),
                .linkedFramework("MetalKit"),
                .linkedFramework("AppKit"),
                .linkedFramework("QuartzCore"),
                .linkedFramework("CoreText"),
                .linkedFramework("CoreGraphics"),
                .linkedFramework("CoreFoundation"),
                .linkedFramework("Foundation"),
                .linkedFramework("IOKit"),
                .linkedFramework("IOSurface"),
                .linkedFramework("UniformTypeIdentifiers"),
                .linkedFramework("Carbon"),
                .linkedLibrary("c++"),
            ]
        ),
    ]
)
