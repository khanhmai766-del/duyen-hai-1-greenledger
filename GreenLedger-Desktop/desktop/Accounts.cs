using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Script.Serialization;

// Tài khoản và phân quyền của GreenLedger Desktop (cùng quy tắc với Worker bản Web).
// Lưu ở <thư mục dữ liệu>\users.json; mật khẩu băm PBKDF2-SHA256, không lưu mật khẩu gốc.

public sealed class UserAccount
{
    public string Username { get; set; }
    public string DisplayName { get; set; }
    public string Role { get; set; }
    public List<string> Permissions { get; set; }
    public string Salt { get; set; }
    public string Hash { get; set; }
    public int Iterations { get; set; }
    public bool MustChange { get; set; }
    public bool Disabled { get; set; }
    public int FailedCount { get; set; }
    public long LockedUntil { get; set; }
    public long CreatedAt { get; set; }
    public long UpdatedAt { get; set; }
    public long LastLogin { get; set; }
}

internal sealed class AccountError : Exception
{
    internal AccountError(string message) : base(message) { }
}

internal sealed class AccountStore
{
    internal const string DefaultAdmin = "pxvh1";
    internal static readonly string[] PermissionIds = { "periods", "data", "factors", "import", "export", "users" };
    internal static readonly string[] WritePermissions = { "periods", "data", "factors", "import" };
    private static readonly string[] RoleIds = { "admin", "editor", "entry", "viewer", "custom" };
    private const int Iterations = 100000;
    private const int MaxFailed = 5;
    private const int LockSeconds = 300;
    private readonly string path;
    private readonly JavaScriptSerializer json = new JavaScriptSerializer();

    internal AccountStore(string folder) { path = Path.Combine(folder, "users.json"); }

    internal static long Now() { return DateTimeOffset.UtcNow.ToUnixTimeSeconds(); }

    private static string RandomSalt()
    {
        var bytes = new byte[16];
        using (var random = new RNGCryptoServiceProvider()) random.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private static string Derive(string password, string salt, int iterations)
    {
        using (var pbkdf2 = new Rfc2898DeriveBytes(password ?? "", Encoding.UTF8.GetBytes(salt), iterations, HashAlgorithmName.SHA256))
            return Convert.ToBase64String(pbkdf2.GetBytes(32));
    }

    private static bool SameText(string a, string b)
    {
        byte[] x = Encoding.UTF8.GetBytes(a ?? ""), y = Encoding.UTF8.GetBytes(b ?? "");
        if (x.Length != y.Length) return false;
        int diff = 0;
        for (int i = 0; i < x.Length; i++) diff |= x[i] ^ y[i];
        return diff == 0;
    }

    private static void SetPassword(UserAccount user, string password)
    {
        user.Salt = RandomSalt();
        user.Iterations = Iterations;
        user.Hash = Derive(password, user.Salt, Iterations);
    }

    internal List<UserAccount> Load()
    {
        if (!File.Exists(path))
        {
            // Tài khoản quản trị đầu tiên: pxvh1 / pxvh1, ứng dụng nhắc đổi mật khẩu ngay khi đăng nhập.
            long time = Now();
            var admin = new UserAccount { Username = DefaultAdmin, DisplayName = "Quản trị hệ thống", Role = "admin",
                Permissions = PermissionIds.ToList(), MustChange = true, CreatedAt = time, UpdatedAt = time };
            SetPassword(admin, DefaultAdmin);
            var users = new List<UserAccount> { admin };
            Save(users);
            return users;
        }
        var loaded = json.Deserialize<List<UserAccount>>(File.ReadAllText(path, Encoding.UTF8));
        if (loaded == null || loaded.Count == 0) throw new AccountError("Tệp tài khoản users.json trống hoặc hỏng.");
        return loaded;
    }

    private void Save(List<UserAccount> users)
    {
        string temporary = path + "." + Guid.NewGuid().ToString("N") + ".tmp";
        try
        {
            File.WriteAllText(temporary, json.Serialize(users), new UTF8Encoding(false));
            if (File.Exists(path)) File.Replace(temporary, path, path + ".bak");
            else File.Move(temporary, path);
        }
        finally { if (File.Exists(temporary)) File.Delete(temporary); }
    }

    private static UserAccount Find(List<UserAccount> users, string username)
    {
        return users.FirstOrDefault(user => String.Equals(user.Username, (username ?? "").Trim().ToLowerInvariant(), StringComparison.Ordinal));
    }

    internal UserAccount Get(string username)
    {
        var user = Find(Load(), username);
        return user == null || user.Disabled ? null : user;
    }

    internal static bool Can(UserAccount user, string permission)
    {
        return user != null && user.Permissions != null && user.Permissions.Contains(permission);
    }

    // Trả về tài khoản khi đăng nhập đúng; ném AccountError kèm lời nhắn khi sai hoặc đang khóa tạm.
    internal UserAccount Login(string username, string password)
    {
        var users = Load();
        var user = Find(users, username);
        long time = Now();
        if (user == null || user.Disabled)
        {
            Derive(password, "greenledger-timing", Iterations);
            throw new AccountError("Tài khoản hoặc mật khẩu chưa đúng.");
        }
        if (user.LockedUntil > time)
            throw new AccountError("Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau " + (int)Math.Ceiling((user.LockedUntil - time) / 60.0) + " phút.");
        if (!SameText(Derive(password, user.Salt, user.Iterations), user.Hash))
        {
            user.FailedCount++;
            bool locked = user.FailedCount >= MaxFailed;
            if (locked) { user.FailedCount = 0; user.LockedUntil = time + LockSeconds; }
            Save(users);
            throw new AccountError(locked
                ? "Nhập sai " + MaxFailed + " lần. Tài khoản tạm khóa " + (LockSeconds / 60) + " phút."
                : "Tài khoản hoặc mật khẩu chưa đúng. Còn " + (MaxFailed - user.FailedCount) + " lần thử.");
        }
        user.FailedCount = 0;
        user.LockedUntil = 0;
        user.LastLogin = time;
        Save(users);
        return user;
    }

    private static void CheckPassword(string password, string username)
    {
        if (password == null || password.Length < 8 || password.Length > 128) throw new AccountError("Mật khẩu cần từ 8 đến 128 ký tự.");
        if (String.Equals(password, username, StringComparison.OrdinalIgnoreCase)) throw new AccountError("Mật khẩu không được trùng tên tài khoản.");
    }

    private static List<string> CheckPermissions(object value)
    {
        var list = value as IEnumerable;
        if (list == null || value is string) throw new AccountError("Danh sách quyền không hợp lệ.");
        var chosen = new List<string>();
        foreach (var item in list)
        {
            string id = item as string;
            if (id == null || !PermissionIds.Contains(id)) throw new AccountError("Danh sách quyền không hợp lệ.");
            chosen.Add(id);
        }
        return PermissionIds.Where(chosen.Contains).ToList();
    }

    private static string Text(IDictionary<string, object> body, string key)
    {
        object value;
        return body.TryGetValue(key, out value) && value != null ? Convert.ToString(value) : null;
    }

    private static int ActiveManagers(List<UserAccount> users, string except)
    {
        return users.Count(user => !user.Disabled && user.Username != except && Can(user, "users"));
    }

    internal UserAccount ChangePassword(string username, string current, string next)
    {
        var users = Load();
        var user = Find(users, username);
        if (user == null || user.Disabled) throw new AccountError("Phiên đăng nhập không còn hiệu lực.");
        if (!SameText(Derive(current, user.Salt, user.Iterations), user.Hash)) throw new AccountError("Mật khẩu hiện tại chưa đúng.");
        CheckPassword(next, user.Username);
        if (next == current) throw new AccountError("Mật khẩu mới cần khác mật khẩu hiện tại.");
        SetPassword(user, next);
        user.MustChange = false;
        user.UpdatedAt = Now();
        Save(users);
        return user;
    }

    internal List<UserAccount> List() { return Load().OrderBy(user => user.CreatedAt).ThenBy(user => user.Username).ToList(); }

    internal UserAccount Create(IDictionary<string, object> body)
    {
        var users = Load();
        string username = (Text(body, "username") ?? "").Trim().ToLowerInvariant();
        if (!Regex.IsMatch(username, "^[a-z0-9][a-z0-9._-]{2,31}$"))
            throw new AccountError("Tên tài khoản 3–32 ký tự, gồm chữ thường không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.");
        string displayName = (Text(body, "displayName") ?? "").Trim();
        if (displayName.Length == 0 || displayName.Length > 80) throw new AccountError("Tên hiển thị cần từ 1 đến 80 ký tự.");
        string role = Text(body, "role");
        if (!RoleIds.Contains(role)) throw new AccountError("Vai trò không hợp lệ.");
        object permissions;
        body.TryGetValue("permissions", out permissions);
        string password = Text(body, "password");
        CheckPassword(password, username);
        if (Find(users, username) != null) throw new AccountError("Tên tài khoản đã tồn tại.");
        long time = Now();
        var user = new UserAccount { Username = username, DisplayName = displayName, Role = role,
            Permissions = CheckPermissions(permissions), MustChange = true, CreatedAt = time, UpdatedAt = time };
        SetPassword(user, password);
        users.Add(user);
        Save(users);
        return user;
    }

    internal UserAccount Update(string actor, string username, IDictionary<string, object> body)
    {
        var users = Load();
        var user = Find(users, username);
        if (user == null) throw new AccountError("Không tìm thấy tài khoản.");
        bool self = user.Username == actor;
        bool wasManager = Can(user, "users") && !user.Disabled;
        if (body.ContainsKey("displayName") || body.ContainsKey("role") || body.ContainsKey("permissions"))
        {
            string displayName = (Text(body, "displayName") ?? user.DisplayName).Trim();
            if (displayName.Length == 0 || displayName.Length > 80) throw new AccountError("Tên hiển thị cần từ 1 đến 80 ký tự.");
            string role = Text(body, "role") ?? user.Role;
            if (!RoleIds.Contains(role)) throw new AccountError("Vai trò không hợp lệ.");
            List<string> permissions = body.ContainsKey("permissions") ? CheckPermissions(body["permissions"]) : user.Permissions;
            if (self && !permissions.Contains("users")) throw new AccountError("Không thể tự bỏ quyền quản lý người dùng của chính mình.");
            user.DisplayName = displayName;
            user.Role = role;
            user.Permissions = permissions;
        }
        if (body.ContainsKey("disabled"))
        {
            bool disabled = Convert.ToBoolean(body["disabled"]);
            if (self && disabled) throw new AccountError("Không thể khóa tài khoản đang đăng nhập.");
            user.Disabled = disabled;
        }
        if (body.ContainsKey("password"))
        {
            string password = Text(body, "password");
            CheckPassword(password, user.Username);
            SetPassword(user, password);
            user.MustChange = !self;
            user.FailedCount = 0;
            user.LockedUntil = 0;
        }
        if (body.ContainsKey("unlock") && Convert.ToBoolean(body["unlock"])) { user.FailedCount = 0; user.LockedUntil = 0; }
        if (wasManager && (!Can(user, "users") || user.Disabled) && ActiveManagers(users, user.Username) == 0)
            throw new AccountError("Cần giữ ít nhất một tài khoản có quyền quản lý người dùng.");
        user.UpdatedAt = Now();
        Save(users);
        return user;
    }

    internal void Delete(string actor, string username)
    {
        var users = Load();
        var user = Find(users, username);
        if (user == null) throw new AccountError("Không tìm thấy tài khoản.");
        if (user.Username == actor) throw new AccountError("Không thể xóa tài khoản đang đăng nhập.");
        if (Can(user, "users") && !user.Disabled && ActiveManagers(users, user.Username) == 0)
            throw new AccountError("Cần giữ ít nhất một tài khoản có quyền quản lý người dùng.");
        users.Remove(user);
        Save(users);
    }

    internal static Dictionary<string, object> Public(UserAccount user)
    {
        return new Dictionary<string, object> {
            { "username", user.Username }, { "displayName", user.DisplayName }, { "role", user.Role },
            { "permissions", user.Permissions ?? new List<string>() }, { "mustChange", user.MustChange },
            { "disabled", user.Disabled }, { "locked", user.LockedUntil > Now() },
            { "lastLogin", user.LastLogin > 0 ? (object)user.LastLogin : null }, { "createdAt", user.CreatedAt } };
    }
}

// Cầu nối cho tab "Tài khoản & phân quyền". Mỗi lệnh đọc lại users.json để quyền vừa đổi có hiệu lực ngay.
// Chỉ gắn vào trang GreenLedger sau khi đăng nhập; trả JSON {ok, ...} thay vì ném lỗi qua COM.
[ComVisible(true)]
[ClassInterface(ClassInterfaceType.AutoDual)]
public sealed class AccountBridge
{
    private readonly AccountStore store;
    private readonly Func<string> currentUser;
    private readonly Action signOut;
    private readonly JavaScriptSerializer json = new JavaScriptSerializer();

    internal AccountBridge(AccountStore store, Func<string> currentUser, Action signOut)
    {
        this.store = store;
        this.currentUser = currentUser;
        this.signOut = signOut;
    }

    private string Run(Func<Dictionary<string, object>> work)
    {
        try
        {
            var result = work();
            result["ok"] = true;
            return json.Serialize(result);
        }
        catch (AccountError error) { return json.Serialize(new Dictionary<string, object> { { "ok", false }, { "error", error.Message } }); }
        catch (IOException) { return json.Serialize(new Dictionary<string, object> { { "ok", false }, { "error", "Không ghi được tệp tài khoản. Hãy thử lại." } }); }
    }

    private UserAccount Actor(string permission)
    {
        var user = store.Get(currentUser());
        if (user == null) throw new AccountError("Phiên đăng nhập không còn hiệu lực. Hãy đăng nhập lại.");
        if (permission != null && !AccountStore.Can(user, permission)) throw new AccountError("Tài khoản của bạn không có quyền quản lý người dùng.");
        return user;
    }

    private IDictionary<string, object> Body(string text)
    {
        var body = json.DeserializeObject(text ?? "") as IDictionary<string, object>;
        if (body == null) throw new AccountError("Dữ liệu gửi lên không hợp lệ.");
        return body;
    }

    public string Me()
    {
        return Run(() => new Dictionary<string, object> { { "mode", "desktop" }, { "user", AccountStore.Public(Actor(null)) } });
    }

    public string ChangePassword(string current, string next)
    {
        return Run(() => new Dictionary<string, object> { { "user", AccountStore.Public(store.ChangePassword(Actor(null).Username, current, next)) } });
    }

    public string ListUsers()
    {
        return Run(() => { Actor("users"); return new Dictionary<string, object> { { "users", store.List().Select(AccountStore.Public).ToList() } }; });
    }

    public string CreateUser(string body)
    {
        return Run(() => { Actor("users"); return new Dictionary<string, object> { { "user", AccountStore.Public(store.Create(Body(body))) } }; });
    }

    public string UpdateUser(string username, string body)
    {
        return Run(() => new Dictionary<string, object> { { "user", AccountStore.Public(store.Update(Actor("users").Username, username, Body(body))) } });
    }

    public string DeleteUser(string username)
    {
        return Run(() => { store.Delete(Actor("users").Username, username); return new Dictionary<string, object> { { "deleted", username } }; });
    }

    public void Logout() { signOut(); }
}
