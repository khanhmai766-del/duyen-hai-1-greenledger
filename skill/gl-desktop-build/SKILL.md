---
name: gl-desktop-build
description: "Dùng khi đóng gói hoặc chẩn đoán GreenLedger Desktop trên Windows, gồm WebView2, bộ cài x64, bridge lưu JSON và thư viện IPCC."
---

# Kiểm tra bản Desktop

1. Đọc hướng dẫn đóng gói trong [ARCHITECTURE.md](../../command/ARCHITECTURE.md). Kiểm tra SDK WebView2 và `Tai-lieu-nguon/IPCC.zip`, rồi dựng thử trong thư mục tạm.
2. Nếu lỗi đóng gói, truy script hoặc tài sản nguồn mà `desktop/build.ps1` đọc. Kiểm tra cú pháp `app/www/app.js` sinh ra sau khi sửa.
3. Khi cần kiểm tra lúc chạy, dùng hồ sơ thử để xác nhận mở, lưu, mở lại và tra cứu IPCC. Ghi riêng kết quả biên dịch, cài đặt và chạy thực tế.
