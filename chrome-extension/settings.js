// 共用的設定結構、預設值與 chrome.storage 存取工具。
// 供 background service worker 與 popup 共用。

export const DEFAULT_SETTINGS = {
  pomodoro: {
    enabled: false,       // 蕃茄鐘是否運作中
    phase: "work",        // "work" | "break"
    workMinutes: 25,
    breakMinutes: 5,
    endsAt: null,         // 目前階段結束的 epoch ms（null = 未運作）
  },
  alarms: [],             // [{ id, time: "HH:MM", label, enabled }]
  sound: {
    enabled: true,
    file: "sounds/chime.wav",
  },
  widget: {
    enabled: true,     // 是否在網頁上顯示浮動 widget
    collapsed: true,   // true = 只顯示浮動球；false = 展開面板
    x: null,           // 浮動球位置（左上角座標），null = 用預設右下角
    y: null,
  },
};

// 深層合併：讓舊版設定缺欄位時仍能補上預設值。
function merge(base, override) {
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (base && typeof base === "object") {
    const out = { ...base };
    for (const key of Object.keys(base)) {
      if (override && key in override) out[key] = merge(base[key], override[key]);
    }
    return out;
  }
  return override === undefined ? base : override;
}

export async function loadSettings() {
  const stored = await chrome.storage.local.get("settings");
  return merge(DEFAULT_SETTINGS, stored.settings || {});
}

export async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}

export function newId() {
  // service worker 無 crypto.randomUUID 保證，退回時間戳 + 亂數。
  if (crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}
