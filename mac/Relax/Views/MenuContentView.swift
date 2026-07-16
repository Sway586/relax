import SwiftUI
import AppKit

/// 選單列下拉面板（MenuBarExtra 的 .window 樣式）。
struct MenuContentView: View {
    @EnvironmentObject var model: AppModel
    @Environment(\.openWindow) private var openWindow

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "timer")
                if model.pomodoroRunning {
                    Text("\(model.phaseText)　\(model.remainingText)")
                        .monospacedDigit()
                } else {
                    Text("蕃茄鐘未開始").foregroundStyle(.secondary)
                }
            }
            .font(.headline)

            Divider()

            Button(model.pomodoroRunning ? "停止蕃茄鐘" : "開始蕃茄鐘") {
                model.togglePomodoro()
            }

            Button("設定…") {
                openWindow(id: "settings")
                NSApp.activate(ignoringOtherApps: true)
            }

            Divider()

            Button("結束 Relax") {
                NSApplication.shared.terminate(nil)
            }
        }
        .padding(12)
        .frame(width: 240)
    }
}
