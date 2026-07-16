// Service worker：排程蕃茄鐘與指定時間鬧鐘，觸發時發通知並播放音效。
import { loadSettings, saveSettings } from "./settings.js";

const POMODORO_ALARM = "pomodoro";
const CLOCK_PREFIX = "clock:"; // clock:<alarmId>

// ---- 通知 + 音效 ----------------------------------------------------------

async function notify(id, title, message) {
  await chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message,
    priority: 2,
    requireInteraction: true,
  });
}

async function playSound() {
  const settings = await loadSettings();
  if (!settings.sound.enabled) return;
  await ensureOffscreen();
  chrome.runtime.sendMessage({ type: "PLAY_SOUND", file: settings.sound.file });
}

let creatingOffscreen = null;
async function ensureOffscreen() {
  const has = await chrome.offscreen.hasDocument();
  if (has) return;
  if (creatingOffscreen) return creatingOffscreen;
  creatingOffscreen = chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["AUDIO_PLAYBACK"],
    justification: "播放蕃茄鐘與鬧鐘的提示音效。",
  });
  try {
    await creatingOffscreen;
  } finally {
    creatingOffscreen = null;
  }
}

// ---- 蕃茄鐘 ---------------------------------------------------------------

// 依目前 phase 排下一次蕃茄鐘 alarm 並寫回 endsAt。
async function schedulePomodoro(settings) {
  const p = settings.pomodoro;
  const minutes = p.phase === "work" ? p.workMinutes : p.breakMinutes;
  const endsAt = Date.now() + minutes * 60_000;
  p.endsAt = endsAt;
  await saveSettings(settings);
  await chrome.alarms.create(POMODORO_ALARM, { when: endsAt });
}

export async function startPomodoro() {
  const settings = await loadSettings();
  settings.pomodoro.enabled = true;
  settings.pomodoro.phase = "work";
  await schedulePomodoro(settings);
}

export async function stopPomodoro() {
  const settings = await loadSettings();
  settings.pomodoro.enabled = false;
  settings.pomodoro.endsAt = null;
  await saveSettings(settings);
  await chrome.alarms.clear(POMODORO_ALARM);
}

async function onPomodoroFired() {
  const settings = await loadSettings();
  if (!settings.pomodoro.enabled) return;
  const wasWork = settings.pomodoro.phase === "work";
  // 切換階段
  settings.pomodoro.phase = wasWork ? "break" : "work";
  if (wasWork) {
    await notify("pomodoro-fire", "休息一下 🍵", `工作時間到，休息 ${settings.pomodoro.breakMinutes} 分鐘。`);
  } else {
    await notify("pomodoro-fire", "開始工作 🍅", `休息結束，專注 ${settings.pomodoro.workMinutes} 分鐘。`);
  }
  await playSound();
  await schedulePomodoro(settings);
}

// ---- 指定時間鬧鐘 ---------------------------------------------------------

// 由 "HH:MM" 算出下一個觸發時間（今天已過則明天）。
function nextOccurrence(time) {
  const [h, m] = time.split(":").map(Number);
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

// 依目前 alarms 設定，清除舊 clock alarms 並重建啟用中的。
export async function rescheduleClockAlarms() {
  const settings = await loadSettings();
  const existing = await chrome.alarms.getAll();
  for (const a of existing) {
    if (a.name.startsWith(CLOCK_PREFIX)) await chrome.alarms.clear(a.name);
  }
  for (const alarm of settings.alarms) {
    if (!alarm.enabled) continue;
    await chrome.alarms.create(CLOCK_PREFIX + alarm.id, { when: nextOccurrence(alarm.time) });
  }
}

async function onClockFired(alarmId) {
  const settings = await loadSettings();
  const alarm = settings.alarms.find((a) => a.id === alarmId);
  if (!alarm || !alarm.enabled) return;
  const label = alarm.label ? `：${alarm.label}` : "";
  await notify(`clock-${alarmId}`, `⏰ 鬧鐘 ${alarm.time}${label}`, "時間到了！");
  await playSound();
  // 重排到明天同一時間。
  await chrome.alarms.create(CLOCK_PREFIX + alarmId, { when: nextOccurrence(alarm.time) });
}

// ---- 事件 -----------------------------------------------------------------

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POMODORO_ALARM) {
    onPomodoroFired();
  } else if (alarm.name.startsWith(CLOCK_PREFIX)) {
    onClockFired(alarm.name.slice(CLOCK_PREFIX.length));
  }
});

// 安裝或瀏覽器啟動時，依儲存的設定重建排程。
async function restore() {
  const settings = await loadSettings();
  if (settings.pomodoro.enabled) {
    // 若已過期則立即切換，否則沿用剩餘時間。
    if (!settings.pomodoro.endsAt || settings.pomodoro.endsAt <= Date.now()) {
      await schedulePomodoro(settings);
    } else {
      await chrome.alarms.create(POMODORO_ALARM, { when: settings.pomodoro.endsAt });
    }
  }
  await rescheduleClockAlarms();
}

chrome.runtime.onInstalled.addListener(restore);
chrome.runtime.onStartup.addListener(restore);

// popup 透過訊息操作排程。
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "START_POMODORO":
        await startPomodoro();
        break;
      case "STOP_POMODORO":
        await stopPomodoro();
        break;
      case "RESCHEDULE_ALARMS":
        await rescheduleClockAlarms();
        break;
      case "TEST_SOUND":
        await playSound();
        break;
    }
    sendResponse({ ok: true });
  })();
  return true; // async 回應
});

// 點通知即關閉。
chrome.notifications.onClicked.addListener((id) => chrome.notifications.clear(id));
