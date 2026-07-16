# relax 🍅

類蕃茄鐘的休息提醒 + 鬧鐘小工具。三個平台版本，各自獨立於自己的資料夾。

## 功能（各版本一致）
1. **蕃茄鐘休息提醒** — 設定工作 / 休息間隔，時間到跳系統通知提醒。
2. **指定時間鬧鐘** — 設定絕對時間（如 14:30）觸發，可多組、可個別啟用。
3. **聲音提醒** — 通知同時播放內建提示音，可開關與試聽。
4. **常駐 / 開機啟動** — 桌面版常駐選單列 / 托盤，關視窗不結束程式，可設定開機啟動。

## 版本

| 資料夾 | 平台 | 技術 | 建置需求 |
|--------|------|------|----------|
| [`mac/`](mac/) | macOS | Swift / SwiftUI 選單列 App | Xcode 16+，macOS 13+ |
| [`windows/`](windows/) | Windows | C# / .NET 8 WPF 托盤 App | Windows 10/11、.NET 8 SDK |
| [`chrome-extension/`](chrome-extension/) | Chrome | Manifest V3 擴充功能 | Chrome（開發人員模式載入）|

各資料夾內有各自的 `README.md` 說明建置與驗證步驟。

## 設計說明
- 三個版本**完全獨立**，不共用程式碼；各自採該平台最原生的做法。
- 三者共用同一個內建提示音 `chime.wav` 與同一組蕃茄鐘圖示，皆由 [`scripts/`](scripts/) 內的純 Python 腳本產生（無第三方套件）：
  - `gen_assets.py` — 產生 PNG 圖示與 `chime.wav`。
  - `make_ico.py` — 將 PNG 打包成 Windows `.ico`。

## 開發狀態
- **chrome-extension**：可直接於 Chrome 載入測試（JS 語法與 manifest 已驗證）。
- **mac**：全部 Swift 原始碼已通過 `swiftc -typecheck`（macOS 13 target）。
- **windows**：完整專案（含 XAML）已通過 `dotnet build`（`EnableWindowsTargeting`）編譯。

實際的執行時行為請依各資料夾 README 的「驗證重點」在對應平台上操作確認。
