import SwiftUI

struct ContentView: View {
    @EnvironmentObject var manager: GhosttyManager

    var body: some View {
        VStack(spacing: 0) {
            // Terminal fills entire window
            GhosttyView(paneId: "pane-main")
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Color.black)
    }
}
