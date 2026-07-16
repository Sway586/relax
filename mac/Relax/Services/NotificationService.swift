import UserNotifications

/// 包裝 UserNotifications，發出系統通知。
struct NotificationService {
    func requestAuthorization() {
        UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    func send(title: String, body: String) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = nil // 音效由 SoundService 自行播放
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil // 立即送出
        )
        UNUserNotificationCenter.current().add(request)
    }
}
