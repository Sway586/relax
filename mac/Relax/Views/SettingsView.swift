import SwiftUI

/// 設定視窗：蕃茄鐘間隔、鬧鐘清單、音效與開機啟動。
struct SettingsView: View {
    @EnvironmentObject var model: AppModel
    @State private var newHour = 9
    @State private var newMinute = 0
    @State private var newLabel = ""

    var body: some View {
        Form {
            Section("蕃茄鐘") {
                Stepper("工作：\(model.settings.workMinutes) 分鐘",
                        value: $model.settings.workMinutes, in: 1...180)
                Stepper("休息：\(model.settings.breakMinutes) 分鐘",
                        value: $model.settings.breakMinutes, in: 1...120)
            }

            Section("指定時間鬧鐘") {
                if model.settings.alarms.isEmpty {
                    Text("尚無鬧鐘").foregroundStyle(.secondary)
                }
                ForEach(model.settings.alarms) { alarm in
                    HStack {
                        Toggle("", isOn: enabledBinding(alarm)).labelsHidden()
                        Text(alarm.timeString).monospacedDigit().bold()
                        Text(alarm.label).foregroundStyle(.secondary)
                        Spacer()
                        Button(role: .destructive) {
                            model.settings.alarms.removeAll { $0.id == alarm.id }
                        } label: {
                            Image(systemName: "trash")
                        }
                        .buttonStyle(.borderless)
                    }
                }
                HStack {
                    Picker("", selection: $newHour) {
                        ForEach(0..<24, id: \.self) { Text(String(format: "%02d", $0)).tag($0) }
                    }
                    .labelsHidden().frame(width: 64)
                    Text(":")
                    Picker("", selection: $newMinute) {
                        ForEach(0..<60, id: \.self) { Text(String(format: "%02d", $0)).tag($0) }
                    }
                    .labelsHidden().frame(width: 64)
                    TextField("標籤（選填）", text: $newLabel)
                    Button("新增") { addAlarm() }
                }
            }

            Section("其他") {
                Toggle("啟用音效", isOn: $model.settings.soundEnabled)
                Button("試聽音效") { model.testSound() }
                Toggle("開機自動啟動", isOn: Binding(
                    get: { model.settings.launchAtLogin },
                    set: { model.setLaunchAtLogin($0) }
                ))
            }
        }
        .formStyle(.grouped)
        .frame(width: 400, height: 480)
    }

    private func addAlarm() {
        model.settings.alarms.append(
            Alarm(hour: newHour, minute: newMinute, label: newLabel)
        )
        newLabel = ""
    }

    private func enabledBinding(_ alarm: Alarm) -> Binding<Bool> {
        Binding(
            get: { model.settings.alarms.first(where: { $0.id == alarm.id })?.enabled ?? false },
            set: { newValue in
                if let idx = model.settings.alarms.firstIndex(where: { $0.id == alarm.id }) {
                    model.settings.alarms[idx].enabled = newValue
                }
            }
        )
    }
}
