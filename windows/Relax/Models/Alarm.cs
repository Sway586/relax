using System;

namespace Relax.Models;

/// <summary>一組指定時間鬧鐘。</summary>
public class Alarm
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public int Hour { get; set; }
    public int Minute { get; set; }
    public string Label { get; set; } = "";
    public bool Enabled { get; set; } = true;

    public string TimeString => $"{Hour:D2}:{Minute:D2}";
}
