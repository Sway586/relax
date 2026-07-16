using System.Collections.Generic;

namespace Relax.Models;

/// <summary>使用者設定，序列化為 JSON 存於 %AppData%\relax\settings.json。</summary>
public class AppSettings
{
    public int WorkMinutes { get; set; } = 25;
    public int BreakMinutes { get; set; } = 5;
    public bool SoundEnabled { get; set; } = true;
    public bool LaunchAtLogin { get; set; } = false;
    public List<Alarm> Alarms { get; set; } = new();
}
