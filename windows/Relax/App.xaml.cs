using System;
using System.IO;
using System.Windows;
using System.Drawing;
using Relax.Services;
using Relax.Views;
using WinForms = System.Windows.Forms;

namespace Relax;

/// <summary>
/// WPF App，啟動即隱藏視窗、只顯示系統托盤圖示（ShutdownMode=OnExplicitShutdown）。
/// </summary>
public partial class App : Application
{
    private WinForms.NotifyIcon _trayIcon = null!;
    private AppController _controller = null!;
    private SettingsWindow? _settingsWindow;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        _controller = new AppController();

        _trayIcon = new WinForms.NotifyIcon
        {
            Icon = LoadTrayIcon(),
            Visible = true,
            Text = "Relax"
        };
        _controller.AttachTray(_trayIcon);

        var toggleItem = new WinForms.ToolStripMenuItem("開始蕃茄鐘", null, (_, _) => _controller.TogglePomodoro());
        var settingsItem = new WinForms.ToolStripMenuItem("設定…", null, (_, _) => ShowSettings());
        var exitItem = new WinForms.ToolStripMenuItem("結束 Relax", null, (_, _) => Shutdown());

        var menu = new WinForms.ContextMenuStrip();
        menu.Items.Add(toggleItem);
        menu.Items.Add(new WinForms.ToolStripSeparator());
        menu.Items.Add(settingsItem);
        menu.Items.Add(exitItem);
        menu.Opening += (_, _) =>
            toggleItem.Text = _controller.PomodoroRunning ? "停止蕃茄鐘" : "開始蕃茄鐘";

        _trayIcon.ContextMenuStrip = menu;
        _trayIcon.DoubleClick += (_, _) => ShowSettings();
    }

    private void ShowSettings()
    {
        _settingsWindow ??= new SettingsWindow(_controller);
        _settingsWindow.Show();
        _settingsWindow.WindowState = WindowState.Normal;
        _settingsWindow.Activate();
    }

    private static Icon LoadTrayIcon()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Resources", "relax.ico");
        return File.Exists(path) ? new Icon(path) : SystemIcons.Application;
    }

    protected override void OnExit(ExitEventArgs e)
    {
        if (_trayIcon != null)
        {
            _trayIcon.Visible = false;
            _trayIcon.Dispose();
        }
        _controller?.Dispose();
        base.OnExit(e);
    }
}
