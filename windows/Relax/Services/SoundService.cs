using System;
using System.IO;
using System.Media;

namespace Relax.Services;

/// <summary>播放內建提示音；找不到音檔時退回系統音效。</summary>
public class SoundService
{
    private readonly string _path;
    private SoundPlayer? _player;

    public SoundService()
    {
        _path = Path.Combine(AppContext.BaseDirectory, "Resources", "chime.wav");
    }

    public void Play()
    {
        try
        {
            if (File.Exists(_path))
            {
                _player = new SoundPlayer(_path);
                _player.Play(); // 非同步播放
                return;
            }
        }
        catch { /* 退回系統音效 */ }
        SystemSounds.Beep.Play();
    }
}
