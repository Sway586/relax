// 唯一用途：service worker 無法播音，改由 offscreen 文件播放。
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "PLAY_SOUND") return;
  const audio = new Audio(chrome.runtime.getURL(msg.file));
  audio.volume = 1.0;
  audio.play().catch((err) => console.warn("播放音效失敗：", err));
});
