import Foundation

/// 使用者設定，序列化後存於 UserDefaults。
struct AppSettings: Codable {
    var workMinutes: Int = 25
    var breakMinutes: Int = 5
    var soundEnabled: Bool = true
    var launchAtLogin: Bool = false
    var alarms: [Alarm] = []
}
