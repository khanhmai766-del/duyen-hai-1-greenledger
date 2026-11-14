# GreenLedger · Kiểm kê khí nhà kính cấp cơ sở

GreenLedger là công cụ tiếng Việt để kiểm kê khí nhà kính (KNK) cấp cơ sở theo **IPCC 2006**, với bộ GWP-100 **AR4/AR5/AR6** và biểu mẫu tham chiếu **Thông tư 38/2023/TT-BCT**. Ca đối chiếu là **Nhà máy Nhiệt điện Duyên Hải 1**.

Dự án có hai bản dùng chung engine tính toán:

| Bản | Thư mục | Chạy trên | Lưu dữ liệu |
| --- | --- | --- | --- |
| **Web** | [`GreenLedger-Web/`](GreenLedger-Web/) | Trình duyệt, phục vụ qua Cloudflare Worker | Hồ sơ trong trình duyệt (`localStorage`); tài khoản trên D1 |
| **Desktop** | [`GreenLedger-Desktop/`](GreenLedger-Desktop/) | Windows x64 (WinForms + WebView2) | `%LOCALAPPDATA%\GreenLedger\du-lieu.json`, tài khoản trong `users.json` |

> Kho riêng tư. Mã có số liệu kỳ 2025 của Duyên Hải 1, video nhà máy và mật khẩu quản trị mặc định. Không chuyển sang công khai trước khi rà các nội dung này.

## Tính năng

- **Nhập số liệu hoạt động** theo tổng năm hoặc 12 tháng cho 8 nhóm nguồn: đốt cố định, đốt di động, nước thải sinh hoạt và công nghiệp, môi chất lạnh, chữa cháy, phân bón & đất, điện lưới.
- **Tính phát thải** Phạm vi 1 và 2 theo từng khí (CO₂, CH₄, N₂O, HFC), tách riêng CO₂ sinh học, kèm **độ không đảm bảo đo** (U 95%, tổng hợp căn tổng bình phương).
- **Chi tiết tính toán** từng nguồn: các bước trung gian, hệ số, nguồn trích dẫn IPCC; phân biệt màu Phạm vi 1 / Phạm vi 2.
- **Thư viện hệ số** (nhiên liệu, GWP & môi chất, nước thải, lưới điện Việt Nam), tra cứu tài liệu IPCC, tính nhiệt trị than.
- **Báo cáo** theo mẫu IPCC 2006, hồ sơ TT 38/2023, mẫu Word; xuất **PDF, Excel (XLSX có công thức tính lại), CSV**, sao lưu/khôi phục **JSON**.
- **Tổng quan** dạng landing: video mô phỏng luân phiên với mô hình 3D Duyên Hải 1 (Sketchfab) tự xoay 360°.
- **Đăng nhập, tài khoản và phân quyền**: 6 quyền, 4 vai trò mẫu, đổi mật khẩu, quản trị cấp/khóa/đặt lại mật khẩu người dùng.

## Bắt đầu nhanh

Cần **Node.js 24** trở lên (dùng `node:sqlite` cho máy chủ chạy thử).

### Bản Web

```powershell
cd GreenLedger-Web
node test.cjs             # kiểm thử engine tính toán
node test-accounts.mjs    # kiểm thử đăng nhập, tài khoản, phân quyền
node dev-server.mjs       # chạy Worker cục bộ: http://localhost:8787
```

Đăng nhập bằng **`pxvh1` / `pxvh1`** rồi đổi mật khẩu ở tab **Tài khoản & phân quyền**. Máy chủ chạy thử giả lập D1 bằng SQLite trong `GreenLedger-Web/.dev/` (không đưa lên Git).

Đóng gói Worker: `node build-worker.mjs` (tạo `dist/server/index.js`). Kế hoạch triển khai lên Cloudflare Workers + D1: [`command/DEPLOY-CLOUDFLARE.md`](command/DEPLOY-CLOUDFLARE.md).

### Bản Desktop

```powershell
cd GreenLedger-Desktop
node test.cjs
# PowerShell 7 (Windows PowerShell 5.1 đọc sai build.ps1 vì tệp là UTF-8 không BOM)
$out = Join-Path ([IO.Path]::GetTempPath()) ('GreenLedger-' + [guid]::NewGuid())
./desktop/build.ps1 -WebViewPackage ../Phu-thuoc/WebView2 `
  -BuildDirectory (Join-Path $out 'build') `
  -InstallerPath (Join-Path $out 'GreenLedger-Setup-x64.exe') `
  -IpccArchive ../Tai-lieu-nguon/IPCC.zip
```

Cần thêm hai thư mục **không có trong kho** (xem bên dưới) và máy có Microsoft Edge WebView2 Runtime. Chạy thử không đụng dữ liệu thật: `GreenLedger.exe --data-dir <thư mục thử>`.

## Tài khoản và phân quyền

Tài khoản quản trị mặc định là `pxvh1` / `pxvh1`; ứng dụng nhắc đổi ngay. Bản Web chính thức nên đặt bí mật `GL_INITIAL_ADMIN_PASSWORD`.

| Quyền | Quản trị hệ thống | Kiểm kê viên | Nhập liệu | Xem & xuất báo cáo |
| --- | :---: | :---: | :---: | :---: |
| Quản lý kỳ kiểm kê | ✓ | ✓ | | |
| Nhập số liệu hoạt động | ✓ | ✓ | ✓ | |
| Thư viện hệ số & phương pháp | ✓ | ✓ | | |
| Nhập & khôi phục dữ liệu | ✓ | ✓ | | |
| Xuất báo cáo & dữ liệu | ✓ | ✓ | ✓ | ✓ |
| Quản lý tài khoản | ✓ | | | |

Quản trị có thể bật/tắt từng quyền cho mỗi người (vai trò "Tùy chỉnh"). Mật khẩu băm PBKDF2-SHA256; nhập sai 5 lần khóa tạm 5 phút; đổi mật khẩu, đổi quyền hoặc khóa tài khoản làm các phiên cũ hết hiệu lực.

## Cấu trúc thư mục

| Đường dẫn | Nội dung |
| --- | --- |
| `GreenLedger-Web/dist/` | Mã giao diện Web: `engine.js` (công thức), `app.js` (điều phối), các phân hệ, tài nguyên |
| `GreenLedger-Web/worker/` | Cloudflare Worker: đăng nhập, phiên, API tài khoản, phục vụ tài nguyên |
| `GreenLedger-Web/migrations/` | Migration D1 |
| `GreenLedger-Web/dev/`, `dev-server.mjs` | Máy chủ chạy thử và D1 giả lập |
| `GreenLedger-Desktop/dist/` | Mã giao diện bản Desktop |
| `GreenLedger-Desktop/desktop/` | Host C# (`GreenLedger.cs`, `Accounts.cs`), bộ cài (`Setup.cs`), `build.ps1`, thư viện đi kèm |
| `command/` | PRD, kiến trúc, thiết kế, quy tắc, công việc, tiến độ, kế hoạch triển khai |
| `agent/`, `skill/`, `.claude/`, `.codex/`, `.agents/skills/gl-*` | Vai trò và kỹ năng cho Claude Code / Codex |
| `prompt_xay_dung_web_app_kiem_ke_knk_ipcc.md` | Yêu cầu gốc: bảng hệ số, công thức, ĐKĐBĐ |

Tài liệu chính: [PRD](command/PRD.md) · [Kiến trúc](command/ARCHITECTURE.md) · [Thiết kế](command/DESIGN.md) · [Quy tắc](command/RULES.md) · [Công việc](command/TASKS.md) · [Tiến độ](command/PROGRESS.md).

## Không có trong kho

| Thư mục cục bộ | Nội dung | Cách lấy |
| --- | --- | --- |
| `Phu-thuoc/WebView2/` | Gói NuGet `Microsoft.Web.WebView2` 1.0.4314.35 (dựng bản Desktop) | Tải từ nuget.org và giải nén vào thư mục này |
| `Tai-lieu-nguon/IPCC.zip` | Bộ tài liệu IPCC 2006 / 2019 dùng cho tra cứu trong bản Desktop | Tải từ IPCC TFI (ipcc-nggip.iges.or.jp) |
| `Ban-giao/` | Bộ cài Windows, bản Web phát hành, Excel, báo cáo Word | Chia sẻ qua GitHub Releases khi phát hành |
| `Phu-thuoc/react-bits/` | Bản tham khảo React Bits (MIT + Commons Clause, không phát tán lại) | [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits) |
| `motion-prompt/`, `codegraph/` | Kho tham khảo của skill motion-prompt và công cụ CodeGraph | [showheyohtaki/motion-prompt](https://github.com/showheyohtaki/motion-prompt), [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph) |
| Skill ngoài trong `.agents/skills/` | ui-ux-pro-max, design-taste-frontend, ponytail, gsap-*, motion-prompt… | Cài lại từ nguồn gốc; xem `skills-lock.json` và `command/README.md` |

## Ghi nhận và giấy phép bên thứ ba

- [ExcelJS](https://github.com/exceljs/exceljs) (MIT) — xuất XLSX; [PDF.js](https://github.com/mozilla/pdf.js) 3.51 (Apache-2.0) — đọc tài liệu IPCC trong bản Desktop.
- Font Bricolage Grotesque và Source Sans 3 (SIL Open Font License, tệp OFL đi kèm).
- Mô hình 3D "Nhà máy Nhiệt điện Duyên Hải" của 3DPLUS.vn, nhúng qua Sketchfab.
- Hiệu ứng SpotlightCard, RotatingText, StatusMark, AnimatedContent chuyển từ [React Bits](https://github.com/DavidHDev/react-bits) (MIT + Commons Clause), chỉ dùng trong GreenLedger.
- Hệ số phát thải và phương pháp theo IPCC 2006 Guidelines và IPCC AR6 WGI; mọi hệ số ghi nguồn trong thư viện hệ số.
