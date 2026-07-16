# Relax — macOS 版

SwiftUI 選單列（menu bar）常駐 App：蕃茄鐘休息提醒 + 指定時間鬧鐘，跳系統通知並播放音效。

## 功能
- 🍅 **蕃茄鐘**：設定工作 / 休息分鐘數，自動循環提醒，選單列即時顯示倒數。
- ⏰ **指定時間鬧鐘**：多組 `HH:MM` 鬧鐘，每天到點觸發，可個別啟用 / 停用。
- 🔊 **聲音提醒**：通知同時播放內建 `chime.wav`，可開關與試聽。
- 📌 **常駐 + 開機啟動**：`LSUIElement` 讓 App 只在選單列（不佔 Dock），關視窗不結束程式；設定內可開啟「開機自動啟動」（`SMAppService`，macOS 13+）。

## 需求
- **Xcode 16 以上**（專案採用 file-system synchronized group，`objectVersion 77`）。
- 部署目標 **macOS 13.0+**。

## 建置與執行
1. 用 Xcode 開啟 `mac/Relax.xcodeproj`。
2. 選 `Relax` scheme → ⌘R 執行。
3. 首次啟動會請求通知權限，請允許。
4. App 出現在選單列（`timer` 圖示）；點開可開始蕃茄鐘或進「設定…」。

> 若無開發者帳號，Xcode 會以「Sign to Run Locally」在本機執行，功能不受影響。

## 程式結構（`Relax/`）
| 檔案 | 用途 |
|------|------|
| `RelaxApp.swift` | `@main`，`MenuBarExtra`（選單列）+ 設定 `Window` |
| `Models/AppSettings.swift`, `Models/Alarm.swift` | 設定與鬧鐘資料模型（Codable）|
| `Services/AppModel.swift` | 中央狀態；單一每秒 timer 驅動蕃茄鐘倒數與鬧鐘檢查 |
| `Services/SettingsStore.swift` | UserDefaults 持久化 |
| `Services/NotificationService.swift` | UserNotifications 系統通知 |
| `Services/SoundService.swift` | AVAudioPlayer 播放提示音 |
| `Services/LaunchAtLogin.swift` | SMAppService 開機啟動 |
| `Views/MenuContentView.swift` | 選單列下拉面板 |
| `Views/SettingsView.swift` | 設定視窗 |
| `Resources/chime.wav` | 內建提示音 |
| `Info.plist` | `LSUIElement=true` 等設定 |

## 驗證重點
- 蕃茄鐘工作分鐘設 1 分鐘 → 開始 → 應跳通知 + 音效，並自動切到休息階段。
- 新增 1〜2 分鐘後的鬧鐘 → 到點跳通知 + 音效。
- 「試聽音效」立即出聲；關閉「啟用音效」後靜音。
- 開啟「開機自動啟動」→ 於「系統設定 › 一般 › 登入項目」應看到 Relax。

> 註：原始碼已通過 `swiftc -typecheck`（macOS 13 target）驗證；完整打包需在有 Xcode 的機器執行。
