import Foundation
import Combine

/// 中央狀態：驅動蕃茄鐘倒數與鬧鐘檢查（單一每秒 timer）。
@MainActor
final class AppModel: ObservableObject {
    enum Phase { case work, breakTime }

    @Published var settings: AppSettings = AppSettings() {
        didSet { store.save(settings) }
    }
    @Published var pomodoroRunning = false
    @Published var phase: Phase = .work
    @Published var remaining = 0 // 剩餘秒數

    private let store = SettingsStore()
    private let notifier = NotificationService()
    private let sound = SoundService()
    private var ticker: Timer?
    // 每個鬧鐘上次觸發的分鐘戳記，避免同一分鐘重複觸發。
    private var lastAlarmFire: [UUID: String] = [:]

    init() {
        settings = store.load() // 初始化時的賦值不會觸發 didSet
        notifier.requestAuthorization()
        startTicker()
    }

    // MARK: - 顯示用

    var phaseText: String { phase == .work ? "工作中 🍅" : "休息中 🍵" }
    var remainingText: String { String(format: "%02d:%02d", remaining / 60, remaining % 60) }

    // MARK: - 蕃茄鐘

    func startPomodoro() {
        phase = .work
        remaining = settings.workMinutes * 60
        pomodoroRunning = true
    }

    func stopPomodoro() {
        pomodoroRunning = false
        remaining = 0
    }

    func togglePomodoro() {
        pomodoroRunning ? stopPomodoro() : startPomodoro()
    }

    private func advancePhase() {
        if phase == .work {
            phase = .breakTime
            remaining = settings.breakMinutes * 60
            fire(title: "休息一下 🍵", body: "工作時間到，休息 \(settings.breakMinutes) 分鐘。")
        } else {
            phase = .work
            remaining = settings.workMinutes * 60
            fire(title: "開始工作 🍅", body: "休息結束，專注 \(settings.workMinutes) 分鐘。")
        }
    }

    // MARK: - 鬧鐘

    private func checkAlarms(_ now: Date) {
        let cal = Calendar.current
        let c = cal.dateComponents([.year, .month, .day, .hour, .minute], from: now)
        guard let year = c.year, let month = c.month, let day = c.day,
              let hour = c.hour, let minute = c.minute else { return }
        let stamp = String(format: "%04d-%02d-%02d %02d:%02d", year, month, day, hour, minute)

        for alarm in settings.alarms where alarm.enabled {
            if alarm.hour == hour, alarm.minute == minute, lastAlarmFire[alarm.id] != stamp {
                lastAlarmFire[alarm.id] = stamp
                let suffix = alarm.label.isEmpty ? "" : "：\(alarm.label)"
                fire(title: "⏰ 鬧鐘 \(alarm.timeString)\(suffix)", body: "時間到了！")
            }
        }
    }

    // MARK: - 觸發提醒

    private func fire(title: String, body: String) {
        notifier.send(title: title, body: body)
        if settings.soundEnabled { sound.play() }
    }

    func testSound() { sound.play() }

    func setLaunchAtLogin(_ enabled: Bool) {
        settings.launchAtLogin = enabled
        LaunchAtLogin.set(enabled: enabled)
    }

    // MARK: - Timer

    private func startTicker() {
        ticker = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick() }
        }
    }

    private func tick() {
        checkAlarms(Date())
        guard pomodoroRunning else { return }
        if remaining > 0 { remaining -= 1 }
        if remaining <= 0 { advancePhase() }
    }
}
