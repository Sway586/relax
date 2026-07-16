using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using Relax.Models;
using Relax.Services;

namespace Relax.Views;

public partial class SettingsWindow : Window
{
    private readonly AppController _controller;
    private readonly ObservableCollection<Alarm> _alarms;
    private bool _loading;

    public SettingsWindow(AppController controller)
    {
        InitializeComponent();
        _controller = controller;
        _loading = true;

        WorkBox.Text = controller.Settings.WorkMinutes.ToString();
        BreakBox.Text = controller.Settings.BreakMinutes.ToString();
        SoundBox.IsChecked = controller.Settings.SoundEnabled;
        StartupBox.IsChecked = controller.Settings.LaunchAtLogin;

        for (int h = 0; h < 24; h++) HourBox.Items.Add(h.ToString("D2"));
        for (int m = 0; m < 60; m++) MinuteBox.Items.Add(m.ToString("D2"));
        HourBox.SelectedIndex = 9;
        MinuteBox.SelectedIndex = 0;

        _alarms = new ObservableCollection<Alarm>(controller.Settings.Alarms);
        AlarmList.ItemsSource = _alarms;

        WorkBox.LostFocus += (_, _) => SaveMinutes();
        BreakBox.LostFocus += (_, _) => SaveMinutes();

        _loading = false;
    }

    private void SaveMinutes()
    {
        if (_loading) return;
        if (int.TryParse(WorkBox.Text, out var w))
            _controller.Settings.WorkMinutes = Math.Clamp(w, 1, 180);
        if (int.TryParse(BreakBox.Text, out var b))
            _controller.Settings.BreakMinutes = Math.Clamp(b, 1, 120);
        _controller.Save();
    }

    private void IntegerOnly(object sender, TextCompositionEventArgs e)
    {
        e.Handled = !int.TryParse(e.Text, out _);
    }

    private void AddAlarm(object sender, RoutedEventArgs e)
    {
        var alarm = new Alarm
        {
            Hour = HourBox.SelectedIndex,
            Minute = MinuteBox.SelectedIndex,
            Label = LabelBox.Text.Trim(),
            Enabled = true
        };
        _alarms.Add(alarm);
        _controller.Settings.Alarms.Add(alarm);
        _controller.Save();
        LabelBox.Text = "";
    }

    private void DeleteAlarm(object sender, RoutedEventArgs e)
    {
        if (sender is Button { Tag: string id })
        {
            var a = _alarms.FirstOrDefault(x => x.Id == id);
            if (a != null) _alarms.Remove(a);
            _controller.Settings.Alarms.RemoveAll(x => x.Id == id);
            _controller.Save();
        }
    }

    private void AlarmEnabledChanged(object sender, RoutedEventArgs e)
    {
        if (_loading) return;
        if (sender is CheckBox { Tag: string id } cb)
        {
            var a = _controller.Settings.Alarms.FirstOrDefault(x => x.Id == id);
            if (a != null)
            {
                a.Enabled = cb.IsChecked == true;
                _controller.Save();
            }
        }
    }

    private void SoundChanged(object sender, RoutedEventArgs e)
    {
        if (_loading) return;
        _controller.Settings.SoundEnabled = SoundBox.IsChecked == true;
        _controller.Save();
    }

    private void TestSound(object sender, RoutedEventArgs e) => _controller.TestSound();

    private void StartupChanged(object sender, RoutedEventArgs e)
    {
        if (_loading) return;
        _controller.SetLaunchAtLogin(StartupBox.IsChecked == true);
    }

    // 關閉視窗只隱藏，不結束程式（程式常駐托盤）。
    protected override void OnClosing(CancelEventArgs e)
    {
        e.Cancel = true;
        Hide();
        base.OnClosing(e);
    }
}
