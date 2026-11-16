using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Windows.Forms;
using Microsoft.Win32;

internal static class Setup
{
    private const string RegistryPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\GreenLedger.Desktop";
    private static readonly string InstallFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "GreenLedger");
    private static readonly string AppPath = Path.Combine(InstallFolder, "GreenLedger.exe");
    private static readonly string ShortcutPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "GreenLedger.lnk");

    [STAThread]
    private static void Main(string[] args)
    {
        Application.EnableVisualStyles();
        try
        {
            if (args.Length == 2 && args[0] == "--cleanup")
            {
                WaitForProcess(Int32.Parse(args[1]));
                Uninstall();
                return;
            }
            if (args.Length == 1 && args[0] == "--uninstall")
            {
                if (MessageBox.Show("Gỡ GreenLedger? Tệp số liệu sẽ được giữ trên máy.", "GreenLedger", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
                string helper = Path.Combine(Path.GetTempPath(), "GreenLedger-Uninstall-" + Guid.NewGuid().ToString("N") + ".exe");
                File.Copy(Application.ExecutablePath, helper);
                Process.Start(new ProcessStartInfo(helper, "--cleanup " + Process.GetCurrentProcess().Id) { UseShellExecute = false });
                return;
            }
            if (MessageBox.Show("Cài GreenLedger · Duyên Hải 1 cho tài khoản Windows hiện tại?", "Cài đặt GreenLedger", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
            Install();
            Process.Start(new ProcessStartInfo(AppPath) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "Cài đặt GreenLedger", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Environment.ExitCode = 1;
        }
    }

    private static void Install()
    {
        EnsureAppClosed();
        if (Directory.Exists(InstallFolder) && !File.Exists(Path.Combine(InstallFolder, "Uninstall.exe")))
            throw new InvalidOperationException("Thư mục cài đặt đã tồn tại và không phải bản cài GreenLedger.");
        string staged = InstallFolder + ".new-" + Guid.NewGuid().ToString("N");
        string previous = InstallFolder + ".old-" + Guid.NewGuid().ToString("N");
        Directory.CreateDirectory(staged);
        try
        {
            using (var payload = Assembly.GetExecutingAssembly().GetManifestResourceStream("GreenLedger.Payload"))
            using (var archive = new ZipArchive(payload, ZipArchiveMode.Read))
                archive.ExtractToDirectory(staged);
            File.Copy(Application.ExecutablePath, Path.Combine(staged, "Uninstall.exe"));
            if (Directory.Exists(InstallFolder)) Directory.Move(InstallFolder, previous);
            try { Directory.Move(staged, InstallFolder); }
            catch
            {
                if (Directory.Exists(previous)) Directory.Move(previous, InstallFolder);
                throw;
            }
        }
        finally { RemoveProgramFolder(staged); }

        Directory.CreateDirectory(Path.GetDirectoryName(ShortcutPath));
        Type shellType = Type.GetTypeFromProgID("WScript.Shell", true);
        dynamic shell = Activator.CreateInstance(shellType);
        dynamic shortcut = shell.CreateShortcut(ShortcutPath);
        shortcut.TargetPath = AppPath;
        shortcut.WorkingDirectory = InstallFolder;
        shortcut.Description = "GreenLedger · Kiểm kê khí nhà kính Duyên Hải 1";
        shortcut.Save();

        using (var key = Registry.CurrentUser.CreateSubKey(RegistryPath))
        {
            key.SetValue("DisplayName", "GreenLedger · Duyên Hải 1");
            key.SetValue("DisplayVersion", "1.24.0");
            key.SetValue("Publisher", "GreenLedger");
            key.SetValue("Language", 1066, RegistryValueKind.DWord);
            key.SetValue("DisplayIcon", AppPath);
            key.SetValue("InstallLocation", InstallFolder);
            key.SetValue("UninstallString", "\"" + Path.Combine(InstallFolder, "Uninstall.exe") + "\" --uninstall");
            key.SetValue("NoModify", 1, RegistryValueKind.DWord);
            key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
        }
        RemoveProgramFolder(previous);
    }

    private static void Uninstall()
    {
        EnsureAppClosed();
        RemoveProgramFolder(InstallFolder);
        File.Delete(ShortcutPath);
        Registry.CurrentUser.DeleteSubKeyTree(RegistryPath, false);
        MessageBox.Show("Đã gỡ GreenLedger. Tệp số liệu vẫn còn trên máy.", "GreenLedger", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }

    private static void EnsureAppClosed()
    {
        string lockPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "GreenLedger", "desktop.lock");
        if (!File.Exists(lockPath)) return;
        try { using (File.Open(lockPath, FileMode.Open, FileAccess.ReadWrite, FileShare.None)) { } }
        catch (IOException) { throw new InvalidOperationException("Hãy đóng GreenLedger rồi chạy lại bộ cài."); }
    }

    private static void RemoveProgramFolder(string path)
    {
        string resolved = Path.GetFullPath(path);
        if (!(resolved == InstallFolder || resolved.StartsWith(InstallFolder + ".new-", StringComparison.OrdinalIgnoreCase)
              || resolved.StartsWith(InstallFolder + ".old-", StringComparison.OrdinalIgnoreCase)))
            throw new InvalidOperationException("Đường dẫn cài đặt không hợp lệ.");
        if (Directory.Exists(resolved)) Directory.Delete(resolved, true);
    }

    private static void WaitForProcess(int id)
    {
        try
        {
            using (var process = Process.GetProcessById(id))
                if (!process.WaitForExit(15000)) throw new InvalidOperationException("Không thể đóng trình gỡ cài đặt.");
        }
        catch (ArgumentException) { }
    }
}
