# Công việc · GreenLedger

Làm một mục mỗi lần theo thứ tự dưới đây. Đánh dấu sau khi đạt điều kiện của mục đó và ghi bằng chứng trong [PROGRESS.md](PROGRESS.md).

- [ ] **1. Kiểm tra Web với hồ sơ 2025.** Mở Web bằng origin thử nghiệm mới, vào kỳ Duyên Hải 1 và kiểm tra chín dòng hiện trên Tổng quan và Chi tiết tính toán. Xác nhận bộ lọc tiếng Việt và thao tác mở chi tiết.
- [ ] **2. Kiểm tra Web với dữ liệu cũ.** Nạp một bản sao lưu schema 1 vào origin thử nghiệm, tải lại và xác nhận hồ sơ đã lưu vẫn là hồ sơ được mở. Thử một tệp sai cấu trúc và xác nhận dữ liệu hiện tại được giữ.
- [ ] **3. Đối chiếu kỳ 2025 với hồ sơ gốc.** So từng dòng, đơn vị, hệ số, tổng theo phạm vi và ĐKĐBĐ. Ghi tài liệu và vị trí của từng chênh lệch để xử lý.
- [ ] **4. Đối chiếu đầu ra Web.** Với cùng kỳ đã kiểm tra, so báo cáo in, CSV và XLSX với màn hình Chi tiết tính toán. Đổi một ô đầu vào trong bản sao XLSX và xác nhận công thức tính lại.
- [ ] **5. Kiểm tra bộ cài Desktop trên Windows.** Từ bản dựng thử, mở ứng dụng, đăng nhập, lưu một kỳ thử, đóng và mở lại, sau đó kiểm tra tra cứu PDF IPCC. Dùng hồ sơ thử để tránh tác động tới dữ liệu đang sử dụng.
- [ ] **6. Đối chiếu XLSX Desktop.** Xuất ca dầu DO 50.000 lít, mở workbook, so kết quả với engine và kiểm tra tính lại khi đổi lượng hoạt động.
- [ ] **7. Xác nhận nội dung phát hành.** Rà các tệp nguồn mới, tài nguyên cần đóng gói và các thay đổi Web/Desktop đã kiểm thử. Ghi phiên bản và kết quả vào PROGRESS.md. Đóng gói bàn giao khi có yêu cầu phát hành.
