// popup UI：讀寫設定並透過訊息請 background 重排程。
import { loadSettings, saveSettings, newId } from "./settings.js";

const $ = (id) => document.getElementById(id);

const send = (msg) => chrome.runtime.sendMessage(msg);

let settings;
let countdownTimer = null;

async function init() {
  settings = await loadSettings();
  $("workMinutes").value = settings.pomodoro.workMinutes;
  $("breakMinutes").value = settings.pomodoro.breakMinutes;
  $("soundEnabled").checked = settings.sound.enabled;
  $("widgetEnabled").checked = settings.widget.enabled;
  renderAlarms();
  renderPomodoro();
  bind();
}

// ---- 蕃茄鐘 ----

function renderPomodoro() {
  const p = settings.pomodoro;
  const btn = $("pomodoroToggle");
  if (p.enabled) {
    btn.textContent = "停止";
    btn.classList.add("running");
  } else {
    btn.textContent = "開始";
    btn.classList.remove("running");
  }
  updateCountdown();
  if (countdownTimer) clearInterval(countdownTimer);
  if (p.enabled) countdownTimer = setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const p = settings.pomodoro;
  const el = $("pomodoroStatus");
  if (!p.enabled || !p.endsAt) {
    el.textContent = "尚未開始";
    return;
  }
  const remain = Math.max(0, p.endsAt - Date.now());
  const mm = String(Math.floor(remain / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, "0");
  const phase = p.phase === "work" ? "工作中 🍅" : "休息中 🍵";
  el.textContent = `${phase}　${mm}:${ss}`;
}

// ---- 鬧鐘清單 ----

function renderAlarms() {
  const list = $("alarmList");
  list.innerHTML = "";
  if (settings.alarms.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "尚無鬧鐘";
    list.appendChild(li);
    return;
  }
  // 依時間排序顯示
  const sorted = [...settings.alarms].sort((a, b) => a.time.localeCompare(b.time));
  for (const alarm of sorted) {
    const li = document.createElement("li");

    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = alarm.enabled;
    toggle.addEventListener("change", () => setAlarmEnabled(alarm.id, toggle.checked));

    const time = document.createElement("span");
    time.className = "alarm-time";
    time.textContent = alarm.time;

    const label = document.createElement("span");
    label.className = "alarm-label";
    label.textContent = alarm.label || "";

    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "✕";
    del.title = "刪除";
    del.addEventListener("click", () => removeAlarm(alarm.id));

    li.append(toggle, time, label, del);
    list.appendChild(li);
  }
}

async function persistAndReschedule() {
  await saveSettings(settings);
  await send({ type: "RESCHEDULE_ALARMS" });
}

async function addAlarm() {
  const time = $("alarmTime").value;
  if (!time) return;
  const label = $("alarmLabel").value.trim();
  settings.alarms.push({ id: newId(), time, label, enabled: true });
  $("alarmLabel").value = "";
  renderAlarms();
  await persistAndReschedule();
}

async function removeAlarm(id) {
  settings.alarms = settings.alarms.filter((a) => a.id !== id);
  renderAlarms();
  await persistAndReschedule();
}

async function setAlarmEnabled(id, enabled) {
  const alarm = settings.alarms.find((a) => a.id === id);
  if (alarm) alarm.enabled = enabled;
  await persistAndReschedule();
}

// ---- 綁定 ----

function bind() {
  $("pomodoroToggle").addEventListener("click", async () => {
    if (settings.pomodoro.enabled) {
      await send({ type: "STOP_POMODORO" });
    } else {
      // 先存目前的分鐘設定再開始
      settings.pomodoro.workMinutes = clampInt($("workMinutes").value, 1, 180, 25);
      settings.pomodoro.breakMinutes = clampInt($("breakMinutes").value, 1, 120, 5);
      await saveSettings(settings);
      await send({ type: "START_POMODORO" });
    }
    settings = await loadSettings();
    renderPomodoro();
  });

  for (const field of ["workMinutes", "breakMinutes"]) {
    $(field).addEventListener("change", async () => {
      settings.pomodoro.workMinutes = clampInt($("workMinutes").value, 1, 180, 25);
      settings.pomodoro.breakMinutes = clampInt($("breakMinutes").value, 1, 120, 5);
      await saveSettings(settings);
    });
  }

  $("addAlarm").addEventListener("click", addAlarm);

  $("soundEnabled").addEventListener("change", async () => {
    settings.sound.enabled = $("soundEnabled").checked;
    await saveSettings(settings);
  });

  $("testSound").addEventListener("click", () => send({ type: "TEST_SOUND" }));

  $("widgetEnabled").addEventListener("change", async () => {
    settings.widget.enabled = $("widgetEnabled").checked;
    await saveSettings(settings);
    // content script 監聽 storage.onChanged，會自動顯示/移除浮動視窗
  });
}

function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

init();
