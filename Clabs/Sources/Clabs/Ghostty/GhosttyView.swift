import SwiftUI
import AppKit

/// SwiftUI wrapper for GhosttyNSView.
struct GhosttyView: NSViewRepresentable {
    let paneId: String
    @EnvironmentObject var manager: GhosttyManager

    func makeNSView(context: Context) -> GhosttyNSView {
        let view = GhosttyNSView(frame: .zero)
        view.manager = manager
        view.paneId = paneId
        return view
    }

    func updateNSView(_ nsView: GhosttyNSView, context: Context) {
        // manager/paneId may change on SwiftUI re-render
        nsView.manager = manager
        nsView.paneId = paneId
    }
}
