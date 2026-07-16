using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows.Forms;
using System.Windows.Threading;
using Relax.Models;

namespace Relax.Services;

/// <summary>中央狀態：單一每秒 DispatcherTimer 驅動蕃茄鐘倒數與鬧鐘檢查。</summary>
public class AppController : IDisposable
{
    private enum Phase { Work, Break }

    public AppSettings Settings { get; private set; }
    public bool PomodoroRunning { get; private set; }
    public int Remaining { get; private set; } // 剩餘秒數

    private Phase _phase = Phase.Work;
    private readonly SettingsStore _store = new();
    private readonly SoundService _sound = new();
    private readonly DispatcherTimer _timer;
    private readonly Dictionary<string, string> _lastFire = new();
    private NotifyIcon? _tray;

    /// <summary>狀態變更時通知 UI（例如設定視窗）更新。</summary>
    public event Action? Changed;

    public AppController()
    {
        Settings = _store.Load();
        _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
        _timer.Tick += (_, _) => Tick();
        _timer.Start();
    }

    public void AttachTray(NotifyIcon tray) => _tray = tray;

    public void Save() => _store.Save(Settings);

    public string PhaseText => _phase == Phase.Work ? "工作中 🍅" : "休息中 🍵";
    public string RemainingText => $"{Remaining / 60:D2}:{Remaining % 60:D2}";

    // MARK: 蕃茄鐘

    public void StartPomodoro()
    {
        _phase = Phase.Work;
        Remaining = Settings.WorkMinutes * 60;
        PomodoroRunning = true;
        UpdateTrayText();
        Changed?.Invoke();
    }

    public void StopPomodoro()
    {
        PomodoroRunning = false;
        Remaining = 0;
        UpdateTrayText();
        Changed?.Invoke();
    }

    public void TogglePomodoro()
    {
        if (PomodoroRunning) StopPomodoro();
        else StartPomodoro();
    }

    private void AdvancePhase()
    {
        if (_phase == Phase.Work)
        {
            _phase = Phase.Break;
            Remaining = Settings.BreakMinutes * 60;
            Fire("休息一下 🍵", $"工作時間到，休息 {Settings.BreakMinutes} 分鐘。");
        }
        else
        {
            _phase = Phase.Work;
            Remaining = Settings.WorkMinutes * 60;
            Fire("開始工作 🍅", $"休息結束，專注 {Settings.WorkMinutes} 分鐘。");
        }
    }

    // MARK: 鬧鐘

    private void CheckAlarms(DateTime now)
    {
        var stamp = now.ToString("yyyy-MM-dd HH:mm");
        foreach (var a in Settings.Alarms.Where(a => a.Enabled))
        {
            if (a.Hour == now.Hour && a.Minute == now.Minute &&
                (!_lastFire.TryGetValue(a.Id, out var last) || last != stamp))
            {
                _lastFire[a.Id] = stamp;
                var suffix = string.IsNullOrEmpty(a.Label) ? "" : $"：{a.Label}";
                Fire($"⏰ 鬧鐘 {a.TimeString}{suffix}", "時間到了！");
            }
        }
    }

    // MARK: 觸發提醒

    private void Fire(string title, string body)
    {
        _tray?.ShowBalloonTip(5000, title, body, ToolTipIcon.Info);
        if (Settings.SoundEnabled) _sound.Play();
    }

    public void TestSound() => _sound.Play();

    public void SetLaunchAtLogin(bool enabled)
    {
        Settings.LaunchAtLogin = enabled;
        StartupService.Set(enabled);
        Save();
    }

    private void UpdateTrayText()
    {
        if (_tray == null) return;
        _tray.Text = PomodoroRunning ? $"Relax — {PhaseText} {RemainingText}" : "Relax";
    }

    private void Tick()
    {
        CheckAlarms(DateTime.Now);
        if (!PomodoroRunning) return;
        if (Remaining > 0) Remaining--;
        if (Remaining <= 0) AdvancePhase();
        UpdateTrayText();
        Changed?.Invoke();
    }

    public void Dispose() => _timer.Stop();
}
