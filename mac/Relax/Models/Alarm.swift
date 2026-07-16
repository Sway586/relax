import Foundation

/// 一組指定時間鬧鐘。
struct Alarm: Codable, Identifiable, Equatable {
    var id: UUID = UUID()
    var hour: Int
    var minute: Int
    var label: String = ""
    var enabled: Bool = true

    var timeString: String { String(format: "%02d:%02d", hour, minute) }
}
