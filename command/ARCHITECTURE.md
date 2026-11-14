# Kiến trúc · GreenLedger

## Công nghệ và thư mục

GreenLedger dùng HTML, CSS và JavaScript thuần. Cả hai bản giữ mã giao diện trong `dist/` và nằm chung một kho Git. Node.js chạy kiểm thử và đóng gói Worker. ExcelJS tạo tệp XLSX. Bản Desktop dùng C# WinForms trên .NET Framework và WebView2 x64, với PDF.js đóng gói cùng ứng dụng để đọc tài liệu IPCC.

| Vị trí | Trách nhiệm |
| --- | --- |
| `GreenLedger-Web/dist/` | Nguồn Web. `index.html` nạp các script theo thứ tự. `app.js` điều phối kỳ, lưu dữ liệu, xử lý sự kiện và dựng trang. `engine.js` chứa dữ liệu mẫu, xác thực, công thức và tổng hợp. |
| `dist/activities.js`, `calculations.js`, `facility-report.js` | Nhập hoạt động, trình bày bước tính và báo cáo. Các tệp này có bản riêng ở từng bản. |
| `GreenLedger-Web/dist/duyen-hai-2025.js` | Hồ sơ và hệ số đi kèm kỳ 2025 trong cây làm việc Web. `initialInventory()` dùng bộ này khi khởi tạo Web mới. Hồ sơ đã lưu được đọc qua nhánh riêng. |
| `GreenLedger-Web/dist/excel-*.js`, `GreenLedger-Desktop/desktop/excel-*.js` | Mô hình workbook và xuất Excel ở từng bản. Các công thức trong workbook cho phép tính lại khi đổi đầu vào. |
| `GreenLedger-Web/worker/index.mjs`, `build-worker.mjs` | Worker Web hiển thị trang đăng nhập và kiểm tra phiên trước khi phục vụ tài nguyên ứng dụng. Script đóng gói chèn tài nguyên `dist/` vào `dist/server/index.js`. |
| `GreenLedger-Desktop/dist/`, `desktop/` | Nguồn giao diện riêng và lớp đóng gói Windows. `build.ps1` bổ sung bridge lưu trữ, Excel, tra cứu IPCC và các tài nguyên vào `app/www/`, rồi biên dịch ứng dụng và trình cài đặt. |
| `GreenLedger-Desktop/desktop/GreenLedger.cs`, `storage.js`, `Setup.cs` | Host WebView2, xác thực cục bộ, bridge đọc/ghi, truy cập tài liệu và tải tệp; trình cài đặt nhúng gói ứng dụng. |
| `Tai-lieu-nguon/`, `Phu-thuoc/`, `Ban-giao/` | Tài liệu IPCC, gói WebView2 và các tệp bàn giao đã tạo. |

## Luồng dữ liệu

```text
Hồ sơ lưu trên thiết bị / bản sao lưu JSON / dữ liệu khởi tạo
  → Xác thực schema 1 và áp dụng cập nhật thư viện theo bản
  → Chọn kỳ, đọc dòng hoạt động và hệ số tham chiếu
  → Engine.calculate() tính từng nguồn, Engine.summary() tổng hợp kỳ
  → Tổng quan, chi tiết ĐKĐBĐ, báo cáo, CSV và mô hình xuất Excel
```

- JSON chứa `periods`, `fuels`, `gases`, `other` và `grid`. Kỳ chứa năm, cơ sở, tùy chọn GWP và các dòng nguồn. Mã hệ số nối dòng hoạt động với thư viện.
- **Web** lưu JSON ở khóa `greenledger.v1` trong `localStorage` theo origin của trình duyệt. Trước khi ghi, ứng dụng xác thực dữ liệu và so sánh với bản đã đọc để phát hiện thay đổi từ thẻ khác. Worker ký cookie phiên bằng `GL_SESSION_KEY`. Có binding D1 `DB`: tài khoản và quyền nằm trong bảng `users` (PBKDF2, dấu phiên theo người, API `/api/me`, `/api/me/password`, `/api/users`). Chưa có `DB`: một tài khoản vận hành với `GL_OPERATOR_PASSWORD`. Các giá trị bí mật cấp qua cấu hình của môi trường chạy Worker.
- **Tài khoản & phân quyền** (`accounts.js`, cả hai bản): tab 8 gọi API Worker ở Web hoặc bridge `accountBridge` ở Desktop. 6 quyền (`periods`, `data`, `factors`, `import`, `export`, `users`). Giao diện khóa thao tác theo quyền; Worker kiểm tra quyền quản lý tài khoản, host Desktop kiểm tra quyền ghi trước khi lưu `du-lieu.json`.
- **Mô hình 3D Tổng quan** (`overview-hero.js`, cả hai bản) nhúng iframe Sketchfab có `sandbox`. Host Desktop chỉ cho đúng khung nhúng mô hình này và tài nguyên `*.sketchfab.com` sau đăng nhập; trang ngoài không có bridge lưu trữ. `GreenLedger.exe --data-dir <đường dẫn tuyệt đối>` chạy với hồ sơ thử.
- **Desktop** ánh xạ thư mục `www` vào host ảo của WebView2. Đăng nhập kiểm tra `%LOCALAPPDATA%\GreenLedger\users.json` (`desktop/Accounts.cs`). Sau đó `desktopStorage` gọi bridge của host để lưu `%LOCALAPPDATA%\GreenLedger\du-lieu.json`. Host kiểm tra phiên bản dữ liệu đã đọc, ghi qua tệp tạm và tạo bản `.bak` khi thay thế.
- Khi đổi công thức, kiểm tra cả hai `engine.js`, chi tiết trình bày và mô hình Excel tương ứng. Đây là các đường triển khai riêng có thể lệch kết quả.

## Lệnh làm việc

- Trong thư mục của từng bản, chạy `node test.cjs` để kiểm tra engine. Với Web, chạy `node build-worker.mjs` từ `GreenLedger-Web/` khi cần tạo Worker; `node test-accounts.mjs` kiểm thử tài khoản.
- Từ `GreenLedger-Desktop/`, tạo bộ cài với `desktop/build.ps1`. Cần gói SDK WebView2 trong `Phu-thuoc/WebView2/`, kho `Tai-lieu-nguon/IPCC.zip` và thư mục đầu ra có thể ghi. Máy chạy bộ cài cần Microsoft Edge WebView2 Runtime.

```powershell
$out = Join-Path ([IO.Path]::GetTempPath()) ('GreenLedger-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $out | Out-Null
./desktop/build.ps1 -WebViewPackage ../Phu-thuoc/WebView2 `
  -BuildDirectory (Join-Path $out 'build') `
  -InstallerPath (Join-Path $out 'GreenLedger-Setup-x64.exe') `
  -IpccArchive ../Tai-lieu-nguon/IPCC.zip
```
