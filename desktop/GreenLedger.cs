using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.IO.Compression;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

internal static class Program
{
    [STAThread]
    private static void Main(string[] args)
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        string folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "GreenLedger");
        // Hồ sơ thử: GreenLedger.exe --data-dir <thư mục> để kiểm tra mà không chạm dữ liệu đang dùng.
        if (args.Length == 2 && args[0] == "--data-dir" && Path.IsPathRooted(args[1])) folder = Path.GetFullPath(args[1]);
        try
        {
            Directory.CreateDirectory(folder);
            using (File.Open(Path.Combine(folder, "desktop.lock"), FileMode.OpenOrCreate, FileAccess.ReadWrite, FileShare.None))
            using (var app = new MainWindow(folder)) Application.Run(app);
        }
        catch (IOException)
        {
            MessageBox.Show("Không mở được thư mục dữ liệu. Nếu GreenLedger đang chạy, hãy quay lại cửa sổ đang mở.", "GreenLedger", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
        catch (Exception ex)
        {
            MessageBox.Show(ex.Message, "GreenLedger", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}

// Only the bundled GreenLedger page is allowed to use these two file operations.
[ComVisible(true)]
[ClassInterface(ClassInterfaceType.AutoDual)]
public sealed class InventoryStorage
{
    private readonly string path;
    internal InventoryStorage(string folder) { path = Path.Combine(folder, "du-lieu.json"); }

    public string Read()
    {
        try { return File.ReadAllText(path, Encoding.UTF8); }
        catch (FileNotFoundException) { return null; }
    }

    public void Save(string expected, string json)
    {
        string current = Read();
        if (!String.Equals(current ?? "", expected, StringComparison.Ordinal))
            throw new InvalidOperationException("Tệp dữ liệu đã thay đổi. Hãy mở lại ứng dụng trước khi lưu.");

        string temporary = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            byte[] bytes = new UTF8Encoding(false).GetBytes(json);
            using (var stream = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                stream.Write(bytes, 0, bytes.Length);
                stream.Flush(true);
            }
            if (current == null) File.Move(temporary, path);
            else File.Replace(temporary, path, path + ".bak");
        }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }
}

internal sealed class DesktopMenuRenderer : ToolStripProfessionalRenderer
{
    private static readonly Color Navy = Color.FromArgb(20, 40, 62);
    private static readonly Color Ink = Color.FromArgb(225, 237, 249);
    private static readonly Color Accent = Color.FromArgb(206, 165, 85);

    internal DesktopMenuRenderer() { RoundedEdges = false; }

    protected override void OnRenderToolStripBackground(ToolStripRenderEventArgs e)
    {
        if (!(e.ToolStrip is MenuStrip)) { base.OnRenderToolStripBackground(e); return; }
        var bounds = new Rectangle(Point.Empty, e.ToolStrip.Size);
        if (bounds.Width == 0 || bounds.Height == 0) return;
        using (var fill = new LinearGradientBrush(bounds, Navy, Color.FromArgb(39, 73, 105), LinearGradientMode.Horizontal))
            e.Graphics.FillRectangle(fill, bounds);
        using (var line = new Pen(Accent, 2)) e.Graphics.DrawLine(line, 0, bounds.Height - 1, bounds.Width, bounds.Height - 1);
    }

    protected override void OnRenderToolStripBorder(ToolStripRenderEventArgs e)
    {
        if (!(e.ToolStrip is MenuStrip)) base.OnRenderToolStripBorder(e);
    }

    protected override void OnRenderMenuItemBackground(ToolStripItemRenderEventArgs e)
    {
        if (!(e.ToolStrip is MenuStrip)) { base.OnRenderMenuItemBackground(e); return; }
        if (!e.Item.Selected && !e.Item.Pressed) return;
        var bounds = new Rectangle(0, 1, e.Item.Width, e.Item.Height - 2);
        using (var fill = new SolidBrush(Color.FromArgb(55, 86, 116))) e.Graphics.FillRectangle(fill, bounds);
    }

    protected override void OnRenderItemText(ToolStripItemTextRenderEventArgs e)
    {
        if (e.ToolStrip is MenuStrip) e.TextColor = e.Item.Enabled ? Ink : Color.FromArgb(164, 181, 202);
        base.OnRenderItemText(e);
    }
}

internal sealed class MainWindow : Form
{
    private const string AppHost = "greenledger.local";
    private const string LoginPage = "/login.html";
    private const string InventoryPage = "/index.html";
    private const string DefaultAccount = "pxvh1";
    private readonly string dataFolder;
    private readonly WebView2 view = new WebView2();
    private readonly ToolStripItem[] sessionItems;
    private bool signedIn;

    internal MainWindow(string dataFolder)
    {
        this.dataFolder = dataFolder;
        Text = "GreenLedger · Duyên Hải 1";
        Icon = Icon.ExtractAssociatedIcon(typeof(MainWindow).Assembly.Location);
        StartPosition = FormStartPosition.CenterScreen;
        ClientSize = new Size(1210, 840);
        MinimumSize = new Size(640, 560);
        WindowState = FormWindowState.Maximized;
        var menu = new MenuStrip();
        menu.Renderer = new DesktopMenuRenderer();
        menu.Font = new Font("Segoe UI", 9.5f, FontStyle.Bold);
        menu.Padding = new Padding(12, 4, 12, 5);
        var file = new ToolStripMenuItem("&Tệp");
        var openData = file.DropDownItems.Add("Mở thư mục dữ liệu", null, (sender, args) => OpenExternal(dataFolder));
        var logout = file.DropDownItems.Add("Đăng xuất", null, (sender, args) => SetSession(false));
        file.DropDownItems.Add("Thoát", null, (sender, args) => Close());
        menu.Items.Add(file);
        var ipccLookup = menu.Items.Add("Tra cứu &IPCC", null, (sender, args) =>
            view.ExecuteScriptAsync("document.querySelector('[data-tab=\"6\"]')?.click()"));
        var ipccDownload = new ToolStripMenuItem("Tải tài liệu IPCC");
        ipccDownload.Click += async (sender, args) => await SaveIpccArchive(ipccDownload);
        menu.Items.Add(ipccDownload);
        foreach (ToolStripItem item in menu.Items) item.Padding = new Padding(12, 5, 12, 5);
        file.DropDown.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);
        sessionItems = new[] { openData, logout, ipccLookup, ipccDownload };
        foreach (var item in sessionItems) item.Enabled = false;
        MainMenuStrip = menu;
        view.Dock = DockStyle.Fill;
        Controls.Add(view);
        Controls.Add(menu);
        Shown += Initialize;
    }

    private async Task SaveIpccArchive(ToolStripMenuItem button)
    {
        string source = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "references", "IPCC.zip");
        if (!File.Exists(source))
        {
            MessageBox.Show(this, "Không tìm thấy IPCC.zip đi kèm. Hãy cài lại bản GreenLedger có tài liệu IPCC.", "Tài liệu IPCC", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            return;
        }
        using (var dialog = new SaveFileDialog())
        {
            dialog.Title = "Lưu bộ tài liệu IPCC";
            dialog.FileName = "IPCC.zip";
            dialog.Filter = "Bộ tài liệu IPCC (*.zip)|*.zip";
            dialog.DefaultExt = "zip";
            dialog.AddExtension = true;
            if (dialog.ShowDialog(this) != DialogResult.OK) return;
            if (String.Equals(Path.GetFullPath(source), Path.GetFullPath(dialog.FileName), StringComparison.OrdinalIgnoreCase))
            {
                MessageBox.Show(this, "Hãy chọn thư mục khác với thư mục tài liệu đi kèm ứng dụng.", "Tài liệu IPCC");
                return;
            }
            button.Enabled = false;
            button.Text = "Đang lưu tài liệu IPCC…";
            try
            {
                await Task.Run(() => CopyReferenceArchive(source, dialog.FileName));
                MessageBox.Show(this, "Đã lưu bộ tài liệu IPCC vào:\n" + dialog.FileName, "Tài liệu IPCC", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show(this, "Không lưu được tài liệu IPCC. " + ex.Message, "Tài liệu IPCC", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                button.Enabled = true;
                button.Text = "Tải tài liệu IPCC";
            }
        }
    }

    internal static void CopyReferenceArchive(string source, string destination)
    {
        string temporary = destination + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            using (var input = new FileStream(source, FileMode.Open, FileAccess.Read, FileShare.Read))
            using (var output = new FileStream(temporary, FileMode.CreateNew, FileAccess.Write, FileShare.None))
            {
                input.CopyTo(output);
                output.Flush(true);
            }
            if (File.Exists(destination)) File.Replace(temporary, destination, null);
            else File.Move(temporary, destination);
        }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }

    private static bool IsLocal(string uri)
    {
        Uri address;
        return Uri.TryCreate(uri, UriKind.Absolute, out address) && address.Scheme == "https"
            && address.Host == AppHost && address.IsDefaultPort;
    }

    private const string OverviewModelPath = "/models/bdc122add7754c989a976fdd5b01012d/embed";

    private static bool IsOverviewModel(string uri)
    {
        Uri address;
        return Uri.TryCreate(uri, UriKind.Absolute, out address) && address.Scheme == "https"
            && address.Host == "sketchfab.com" && address.IsDefaultPort && address.AbsolutePath == OverviewModelPath;
    }

    // Tài nguyên mà khung Sketchfab cần (trang nhúng, script, mô hình, ảnh).
    private static bool IsSketchfab(string uri)
    {
        Uri address;
        return Uri.TryCreate(uri, UriKind.Absolute, out address) && address.Scheme == "https" && address.IsDefaultPort
            && (address.Host == "sketchfab.com" || address.Host.EndsWith(".sketchfab.com", StringComparison.Ordinal));
    }

    private static bool IsPage(string uri, string path)
    {
        return IsLocal(uri) && new Uri(uri).AbsolutePath == path;
    }

    private void SetSession(bool authenticated)
    {
        var core = view.CoreWebView2;
        if (core == null || authenticated == signedIn) return;
        if (authenticated) core.AddHostObjectToScript("inventoryStorage", new InventoryStorage(dataFolder));
        else core.RemoveHostObjectFromScript("inventoryStorage");
        signedIn = authenticated;
        foreach (var item in sessionItems) item.Enabled = authenticated;
        core.Navigate("https://" + AppHost + (authenticated ? InventoryPage : LoginPage));
    }

    private void CheckLogin(object sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        if (signedIn || !IsPage(args.Source, LoginPage)) return;
        string message;
        try { message = args.TryGetWebMessageAsString(); }
        catch (ArgumentException) { return; }
        catch (COMException) { return; }
        catch (InvalidOperationException) { return; }
        if (String.IsNullOrEmpty(message) || message.Length > 200) return;
        string[] fields = message.Split(new[] { '|' }, 3);
        if (fields.Length != 3 || fields[0] != "login") return;
        if (fields[1].Trim() == DefaultAccount && fields[2] == DefaultAccount)
            SetSession(true);
        else view.CoreWebView2.PostWebMessageAsString("login-invalid");
    }

    private async void Initialize(object sender, EventArgs args)
    {
        try
        {
            var environment = await CoreWebView2Environment.CreateAsync(null, Path.Combine(dataFolder, "WebView"));
            await view.EnsureCoreWebView2Async(environment);
            var core = view.CoreWebView2;
            core.SetVirtualHostNameToFolderMapping(AppHost, Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "www"), CoreWebView2HostResourceAccessKind.Deny);
            core.Settings.AreDevToolsEnabled = false;
            core.Settings.AreDefaultContextMenusEnabled = false;
            core.Settings.IsPasswordAutosaveEnabled = false;
            core.Settings.IsGeneralAutofillEnabled = false;
            core.NavigationStarting += (s, e) => { if (!IsPage(e.Uri, signedIn ? InventoryPage : LoginPage)) e.Cancel = true; };
            // Chỉ cho khung con duy nhất: mô hình 3D Duyên Hải 1 trên Sketchfab ở trang Tổng quan.
            core.FrameNavigationStarting += (s, e) => { if (!signedIn || !IsOverviewModel(e.Uri)) e.Cancel = true; };
            core.NewWindowRequested += (s, e) => {
                e.Handled = true;
                Uri address;
                if (signedIn && Uri.TryCreate(e.Uri, UriKind.Absolute, out address) && address.Scheme == "https")
                    BeginInvoke(new Action(() => OpenExternal(address.AbsoluteUri)));
            };
            core.AddWebResourceRequestedFilter("*", CoreWebView2WebResourceContext.All, CoreWebView2WebResourceRequestSourceKinds.All);
            core.WebResourceRequested += async (s, e) => {
                Uri address;
                if (Uri.TryCreate(e.Request.Uri, UriKind.Absolute, out address)
                    && address.Scheme == "https" && address.Host == "ipcc.greenledger.local"
                    && address.IsDefaultPort && address.AbsolutePath == "/document")
                {
                    if (signedIn) await ServeIpccDocument(environment, e, address);
                    else e.Response = environment.CreateWebResourceResponse(null, 403, "Forbidden", "");
                    return;
                }
                if (!IsLocal(e.Request.Uri) && !(signedIn && IsSketchfab(e.Request.Uri))
                    && !e.Request.Uri.StartsWith("blob:", StringComparison.Ordinal)
                    && !e.Request.Uri.StartsWith("data:", StringComparison.Ordinal))
                    e.Response = environment.CreateWebResourceResponse(null, 403, "Forbidden", "");
            };
            core.WebMessageReceived += CheckLogin;
            core.DownloadStarting += SaveDownload;
            core.Navigate("https://" + AppHost + LoginPage);
        }
        catch (WebView2RuntimeNotFoundException)
        {
            MessageBox.Show(this, "Máy cần Microsoft Edge WebView2 Runtime để mở GreenLedger.", "GreenLedger", MessageBoxButtons.OK, MessageBoxIcon.Warning);
            Close();
        }
        catch (Exception ex)
        {
            MessageBox.Show(this, "Không mở được GreenLedger. " + ex.Message, "GreenLedger", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }

    private async Task ServeIpccDocument(CoreWebView2Environment environment, CoreWebView2WebResourceRequestedEventArgs args, Uri address)
    {
        var deferral = args.GetDeferral();
        try
        {
            const string prefix = "?entry=";
            if (args.Request.Method != "GET" || !address.Query.StartsWith(prefix, StringComparison.Ordinal))
            {
                args.Response = environment.CreateWebResourceResponse(null, 400, "Bad Request", "");
                return;
            }
            string name = Uri.UnescapeDataString(address.Query.Substring(prefix.Length));
            var stream = await Task.Run(() => ReadIpccDocument(name));
            args.Response = stream == null
                ? environment.CreateWebResourceResponse(null, 404, "Not Found", "")
                : environment.CreateWebResourceResponse(stream, 200, "OK",
                    "Content-Type: application/pdf\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nAccess-Control-Allow-Origin: https://" + AppHost);
        }
        catch (Exception)
        {
            if (!IsDisposed) args.Response = environment.CreateWebResourceResponse(null, 500, "Unable to read reference", "");
        }
        finally { deferral.Complete(); }
    }

    private static MemoryStream ReadIpccDocument(string name)
    {
        if (!name.StartsWith("IPCC/", StringComparison.Ordinal) || !name.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
            return null;
        string archivePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "references", "IPCC.zip");
        using (var archive = ZipFile.OpenRead(archivePath))
        {
            var entry = archive.GetEntry(name);
            if (entry == null || entry.Length <= 0 || entry.Length > 64 * 1024 * 1024) return null;
            var result = new MemoryStream((int)entry.Length);
            try
            {
                using (var input = entry.Open()) input.CopyTo(result);
                result.Position = 0;
                return result;
            }
            catch
            {
                result.Dispose();
                throw;
            }
        }
    }


    private void SaveDownload(object sender, CoreWebView2DownloadStartingEventArgs args)
    {
        if (!signedIn)
        {
            args.Cancel = true;
            return;
        }
        var deferral = args.GetDeferral();
        args.Handled = true;
        BeginInvoke(new Action(() => {
            try
            {
                string name = Path.GetFileName(args.ResultFilePath);
                using (var dialog = new SaveFileDialog())
                {
                    dialog.FileName = name;
                    dialog.DefaultExt = Path.GetExtension(name).TrimStart('.');
                    dialog.Filter = "Tệp xuất (*" + Path.GetExtension(name) + ")|*" + Path.GetExtension(name) + "|Tất cả tệp (*.*)|*.*";
                    if (dialog.ShowDialog(this) == DialogResult.OK) args.ResultFilePath = dialog.FileName;
                    else args.Cancel = true;
                }
            }
            catch (Exception ex) { args.Cancel = true; MessageBox.Show(this, ex.Message, "GreenLedger"); }
            finally { deferral.Complete(); }
        }));
    }

    private static void OpenExternal(string target)
    {
        try { Process.Start(new ProcessStartInfo(target) { UseShellExecute = true }); }
        catch (Exception ex) { MessageBox.Show(ex.Message, "GreenLedger"); }
    }
}
