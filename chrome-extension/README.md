# Relax — Chrome Extension 版

Manifest V3 擴充功能：蕃茄鐘休息提醒 + 指定時間鬧鐘，時間到跳系統通知並播放音效。

## 功能
- 🍅 **蕃茄鐘**：設定工作 / 休息分鐘數，自動在工作↔休息之間循環提醒。
- ⏰ **指定時間鬧鐘**：新增多組 `HH:MM` 鬧鐘，每天到點觸發，可個別啟用 / 停用。
- 🔊 **聲音提醒**：通知同時播放內建提示音，可開關與試聽。
- 🎈 **浮動視窗（floating widget）**：在網頁右下角顯示可拖曳的浮動球，即時看蕃茄鐘倒數；點一下展開精簡面板（階段、剩餘時間、開始 / 停止）。可在 popup 開關；狀態透過 `chrome.storage` 跨分頁同步。
- 排程用 `chrome.alarms`，即使 service worker 休眠也能可靠喚醒。

> 浮動視窗限制：只顯示在一般網頁上，`chrome://*`、Chrome 線上應用程式商店、PDF、其他擴充功能頁面不會出現。

> 註：擴充功能沒有「常駐托盤 / 開機自動啟動」設定 — 由瀏覽器負責常駐，只要 Chrome 開著、擴充功能啟用，排程就有效。

## 檔案結構
| 檔案 | 用途 |
|------|------|
| `manifest.json` | MV3 設定與權限（alarms / notifications / storage / offscreen）|
| `settings.js` | 共用的設定結構、預設值與 storage 存取 |
| `background.js` | service worker：排程、觸發通知、喚起音效 |
| `content.js` | 注入網頁的浮動 widget（Shadow DOM 隔離樣式）|
| `offscreen.html` / `offscreen.js` | 播放音效（service worker 無法直接播音）|
| `popup.html` / `popup.css` / `popup.js` | 設定介面 |
| `icons/` | 圖示（由 `gen_assets.py` 產生）|
| `sounds/chime.wav` | 內建提示音 |

## 安裝與測試
1. 打開 Chrome → 網址列輸入 `chrome://extensions`。
2. 右上角開啟「開發人員模式」。
3. 點「載入未封裝項目」，選擇此 `chrome-extension/` 資料夾。
4. 點工具列的 🍅 圖示開啟設定。

### 驗證重點
- **蕃茄鐘**：把工作分鐘設短（例如 1 分鐘）→ 按「開始」→ 等候通知與音效，並確認自動切換到休息階段。
- **鬧鐘**：新增一個 1〜2 分鐘後的時間 → 到點應跳通知並播音。
- **音效**：按「試聽」立即聽到提示音；關閉「啟用音效」後應靜音。
- **存活**：在 `chrome://extensions` 對此擴充功能點「服務工作人員」再關閉，或重新載入 Chrome，排程仍應保留（由 storage 還原）。

## 重新產生圖示 / 音效
```bash
python3 ../scripts/gen_assets.py .   # 需純 Python3，無第三方套件
```
（`gen_assets.py` 亦附在專案 scratchpad；如需保留可移入 repo。）
