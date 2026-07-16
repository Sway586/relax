import SwiftUI

@main
struct RelaxApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        MenuBarExtra("Relax", systemImage: "timer") {
            MenuContentView().environmentObject(model)
        }
        .menuBarExtraStyle(.window)

        Window("Relax 設定", id: "settings") {
            SettingsView().environmentObject(model)
        }
        .windowResizability(.contentSize)
    }
}
