# Relax — Windows 版

.NET 8 WPF 系統托盤常駐 App：蕃茄鐘休息提醒 + 指定時間鬧鐘，跳通知並播放音效。

## 功能
- 🍅 **蕃茄鐘**：設定工作 / 休息分鐘數，自動循環提醒，托盤 tooltip 顯示倒數。
- ⏰ **指定時間鬧鐘**：多組 `HH:MM` 鬧鐘，每天到點觸發，可個別啟用 / 停用。
- 🔊 **聲音提醒**：通知同時播放內建 `chime.wav`，可開關與試聽。
- 📌 **常駐托盤 + 開機啟動**：程式常駐系統托盤，關設定視窗不結束程式（右鍵托盤 → 結束）；設定內可開啟「開機自動啟動」（寫入 `HKCU\...\Run`）。

> 提醒以托盤通知（balloon / Windows 通知）呈現，無需額外 NuGet 套件。

## 需求
- **Windows 10 / 11**（WPF + WinForms 托盤僅能在 Windows 建置與執行）。
- **.NET 8 SDK**。

## 建置與執行
```powershell
cd windows
dotnet run --project Relax/Relax.csproj
# 或用 Visual Studio 2022 開啟 Relax.sln 後 F5
```
啟動後不會有視窗，程式在右下角系統托盤（🍅 圖示）：
- **左鍵雙擊** 或 **右鍵 → 設定…**：開啟設定視窗。
- **右鍵 → 開始 / 停止蕃茄鐘**。
- **右鍵 → 結束 Relax**：真正離開程式。

## 程式結構（`Relax/`）
| 檔案 | 用途 |
|------|------|
| `App.xaml` / `App.xaml.cs` | 進入點；建立托盤圖示與右鍵選單（`ShutdownMode=OnExplicitShutdown`）|
| `Models/AppSettings.cs`, `Models/Alarm.cs` | 設定與鬧鐘資料模型 |
| `Services/AppController.cs` | 中央狀態；單一每秒 `DispatcherTimer` 驅動倒數與鬧鐘檢查 |
| `Services/SettingsStore.cs` | JSON 持久化（`%AppData%\relax\settings.json`）|
| `Services/SoundService.cs` | `SoundPlayer` 播放提示音 |
| `Services/StartupService.cs` | registry 開機啟動 |
| `Views/SettingsWindow.xaml(.cs)` | 設定視窗（關閉時隱藏而非結束）|
| `Resources/chime.wav`, `Resources/relax.ico` | 內建音效與圖示 |

## 驗證重點
- 蕃茄鐘工作分鐘設 1 分鐘 → 右鍵「開始蕃茄鐘」→ 應跳通知 + 音效並自動切到休息。
- 新增 1〜2 分鐘後的鬧鐘 → 到點跳通知 + 音效。
- 「試聽音效」立即出聲；關閉「啟用音效」後靜音。
- 勾「開機自動啟動」→ `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` 應出現 `Relax` 值。

> 註：本專案已在 macOS 以 `dotnet build -p:EnableWindowsTargeting=true` 完整編譯通過（含 XAML）；實際執行請在 Windows。
