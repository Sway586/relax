// 在網頁上注入一個浮動的蕃茄鐘 widget（Shadow DOM 隔離樣式）。
// 不 import 模組（content script 不支援）；直接讀寫 chrome.storage.local，
// 靠 storage.onChanged 跨分頁同步；開始/停止沿用 background 既有訊息。
(function () {
  "use strict";

  if (window.top !== window) return;            // 只在最上層文件
  const HOST_ID = "relax-floating-widget-host";
  if (document.getElementById(HOST_ID)) return; // 避免重複注入

  const WIDGET_DEFAULT = { enabled: true, collapsed: true, x: null, y: null };

  let settings = {};
  let host = null, shadow = null, ball = null, ballTime = null;
  let phaseEl = null, timeEl = null, toggleBtn = null, root = null;
  let tick = null, drag = null, closedThisPage = false;

  const pomo = () => settings.pomodoro || {};
  const widget = () => Object.assign({}, WIDGET_DEFAULT, settings.widget);

  function fmt(ms) {
    const r = Math.max(0, ms);
    const mm = String(Math.floor(r / 60000)).padStart(2, "0");
    const ss = String(Math.floor((r % 60000) / 1000)).padStart(2, "0");
    return mm + ":" + ss;
  }

  async function loadSettings() {
    const r = await chrome.storage.local.get("settings");
    return r.settings || {};
  }

  // 讀最新設定、只改 widget 欄位再寫回，降低覆蓋 background 寫入的機會。
  async function patchWidget(patch) {
    const fresh = await loadSettings();
    fresh.widget = Object.assign({}, WIDGET_DEFAULT, fresh.widget, patch);
    settings = fresh;
    await chrome.storage.local.set({ settings: fresh });
  }

  const TEMPLATE = `
    <style>
      :host { all: initial; }
      #root {
        position: absolute;
        font-family: -apple-system, "Segoe UI", "Microsoft JhengHei", sans-serif;
        user-select: none;
      }
      #ball {
        width: 56px; height: 56px; border-radius: 50%;
        background: #e2554e; color: #fff;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        box-shadow: 0 4px 14px rgba(0,0,0,.28);
        cursor: grab; touch-action: none;
      }
      #ball:active { cursor: grabbing; }
      #ball.running { background: #c8443d; }
      #ball .tomato { font-size: 20px; line-height: 1; }
      #ballTime {
        font-size: 11px; font-variant-numeric: tabular-nums; margin-top: 1px;
        font-weight: 600;
      }
      #panel {
        position: absolute; bottom: 64px; right: 0; width: 180px;
        background: #fff; color: #2b2b2b;
        border-radius: 10px; padding: 12px;
        box-shadow: 0 6px 20px rgba(0,0,0,.25);
      }
      #panel .phase { font-weight: 600; margin-bottom: 4px; }
      #panel .time {
        font-size: 26px; font-variant-numeric: tabular-nums;
        text-align: center; margin: 4px 0 10px;
      }
      #panel .row { display: flex; gap: 8px; }
      #panel button {
        flex: 1; border: none; border-radius: 6px; padding: 7px 8px;
        font-size: 13px; cursor: pointer;
      }
      #toggle { background: #e2554e; color: #fff; font-weight: 600; }
      #toggle:hover { background: #c8443d; }
      #close { flex: 0 0 auto; width: 34px; background: #eee; color: #666; }
      #title { font-size: 11px; color: #999; margin-bottom: 8px; }
    </style>
    <div id="root">
      <div id="ball" title="Relax 蕃茄鐘（拖曳可移動，點一下展開）">
        <span class="tomato">🍅</span>
        <span id="ballTime"></span>
      </div>
      <div id="panel">
        <div id="title">🍅 Relax</div>
        <div class="phase" id="phase">未開始</div>
        <div class="time" id="time">--:--</div>
        <div class="row">
          <button id="toggle">開始</button>
          <button id="close" title="在此頁隱藏">✕</button>
        </div>
      </div>
    </div>`;

  function build() {
    host = document.createElement("div");
    host.id = HOST_ID;
    host.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;z-index:2147483647;";
    shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = TEMPLATE;
    document.documentElement.appendChild(host);

    root = shadow.getElementById("root");
    ball = shadow.getElementById("ball");
    ballTime = shadow.getElementById("ballTime");
    phaseEl = shadow.getElementById("phase");
    timeEl = shadow.getElementById("time");
    toggleBtn = shadow.getElementById("toggle");

    ball.addEventListener("pointerdown", onPointerDown);
    toggleBtn.addEventListener("click", onToggleTimer);
    shadow.getElementById("close").addEventListener("click", onClose);

    applyPosition();
    applyCollapsed();
    render();
    startTick();
  }

  function teardown() {
    stopTick();
    if (host) { host.remove(); host = null; shadow = null; }
  }

  function applyPosition() {
    const w = widget();
    let x = w.x, y = w.y;
    if (x == null || y == null) { x = window.innerWidth - 84; y = window.innerHeight - 84; }
    x = Math.max(4, Math.min(x, window.innerWidth - 60));
    y = Math.max(4, Math.min(y, window.innerHeight - 60));
    root.style.left = x + "px";
    root.style.top = y + "px";
  }

  function applyCollapsed() {
    shadow.getElementById("panel").style.display = widget().collapsed ? "none" : "block";
  }

  function render() {
    if (!ball) return;
    const p = pomo();
    const running = !!p.enabled;
    const remain = running && p.endsAt ? p.endsAt - Date.now() : 0;
    if (running) {
      ball.classList.add("running");
      ballTime.textContent = fmt(remain);
      phaseEl.textContent = p.phase === "break" ? "休息中 🍵" : "工作中 🍅";
      timeEl.textContent = fmt(remain);
      toggleBtn.textContent = "停止";
    } else {
      ball.classList.remove("running");
      ballTime.textContent = "";
      phaseEl.textContent = "未開始";
      timeEl.textContent = "--:--";
      toggleBtn.textContent = "開始";
    }
  }

  function startTick() { stopTick(); tick = setInterval(render, 1000); }
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }

  // ---- 事件 ----

  function onToggleTimer() {
    const running = !!pomo().enabled;
    chrome.runtime.sendMessage({ type: running ? "STOP_POMODORO" : "START_POMODORO" });
    // 新狀態由 storage.onChanged 帶回並 render
  }

  function onClose() {
    // 只隱藏本頁（不動全域設定）；重整或開新頁仍會出現。
    closedThisPage = true;
    teardown();
  }

  function onPointerDown(e) {
    drag = {
      startX: e.clientX, startY: e.clientY, moved: false,
      originLeft: parseInt(root.style.left) || 0,
      originTop: parseInt(root.style.top) || 0,
    };
    ball.setPointerCapture(e.pointerId);
    ball.addEventListener("pointermove", onPointerMove);
    ball.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
    if (drag.moved) {
      let nx = Math.max(4, Math.min(drag.originLeft + dx, window.innerWidth - 60));
      let ny = Math.max(4, Math.min(drag.originTop + dy, window.innerHeight - 60));
      root.style.left = nx + "px";
      root.style.top = ny + "px";
    }
  }

  async function onPointerUp() {
    ball.removeEventListener("pointermove", onPointerMove);
    ball.removeEventListener("pointerup", onPointerUp);
    const wasDrag = drag && drag.moved;
    if (wasDrag) {
      await patchWidget({ x: parseInt(root.style.left), y: parseInt(root.style.top) });
    } else {
      await patchWidget({ collapsed: !widget().collapsed }); // 點擊 = 展開/收合
    }
    drag = null;
  }

  // ---- 跨分頁同步 ----

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.settings) return;
    settings = changes.settings.newValue || {};
    if (closedThisPage) return;
    if (!widget().enabled) { teardown(); return; }
    if (!host) { build(); return; }
    applyPosition();
    applyCollapsed();
    render();
  });

  window.addEventListener("resize", () => { if (host) applyPosition(); });

  // ---- 啟動 ----

  (async function init() {
    settings = await loadSettings();
    if (widget().enabled) build();
  })();
})();
