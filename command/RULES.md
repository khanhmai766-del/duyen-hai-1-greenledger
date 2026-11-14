# Quy tắc phát triển · GreenLedger

## Cách viết và kiểm tra mã

- Xác định bản cần sửa (`GreenLedger-Web/` hay `GreenLedger-Desktop/`). Kiểm tra hiện trạng Git của kho dự án và giữ các thay đổi đang làm của người dùng. Khi sửa hành vi chung, xem đường triển khai ở cả Web và Desktop.
- Dùng JavaScript thuần và CSS theo cấu trúc hiện có. Đặt tên dễ đọc, ưu tiên hàm hiện hữu và giữ đúng thứ tự script trong `index.html`. Viết văn bản giao diện bằng tiếng Việt, có dấu và đúng thuật ngữ kiểm kê.
- Đặt công thức và xác thực dữ liệu tại engine. Khi mô hình Excel biểu diễn cùng công thức, dùng cùng đầu vào để đối chiếu. Giữ đơn vị rõ trong tên hoặc chú thích và chỉ làm tròn lúc hiển thị.
- Giữ khả năng đọc dữ liệu schema 1. Nếu cần đổi schema, có chuyển đổi cho dữ liệu cũ và xác thực trước khi lưu. Dùng kiểm tra phiên bản hiện có để xử lý trường hợp nhiều thẻ hoặc tệp đã đổi.
- Dùng `esc()` hoặc API DOM an toàn với nội dung nhập vào HTML. Giữ cơ chế bảo vệ ô CSV trước chuỗi có thể bị phần mềm bảng tính hiểu là công thức.
- Chạy `node test.cjs` trong thư mục của mỗi bản chịu ảnh hưởng. Khi đổi UI, kiểm tra luồng qua điểm vào thật. Khi đổi công thức hoặc xuất tệp, kiểm tra thêm kết quả trong báo cáo và tệp tương ứng.
- Làm từng mục trong [TASKS.md](TASKS.md). Ghi lệnh đã chạy, lỗi tái hiện được và bước tiếp theo trong [PROGRESS.md](PROGRESS.md).

## AI tuyệt đối không được làm

- Bịa hệ số, trích dẫn, bảng/trang tài liệu, chứng từ, số liệu cơ sở hoặc tình trạng nghiệm thu. Mọi chỉnh sửa phương pháp phải truy được nguồn và nêu rõ đơn vị, bộ GWP và tác động lên kết quả.
- Tự thay công thức, đổi bộ GWP mặc định, đổi cách tổng hợp ĐKĐBĐ hoặc gộp CO₂ sinh học vào tổng Phạm vi 1 mà thiếu yêu cầu và căn cứ tương ứng.
- Ghi đè hoặc xóa hồ sơ, bản sao lưu, tệp bàn giao hay công việc đang sửa của người dùng. Không thay dữ liệu đã lưu bằng dữ liệu mẫu khi đọc hoặc nhập tệp lỗi.
- Nhúng mật khẩu, token hoặc hồ sơ nội bộ chưa được phép phát hành vào tài sản Web, Git hoặc gói cài. Không cấp quyền cho trang ngoài gọi bridge lưu trữ Desktop.
- Sửa trực tiếp Worker sinh ra, thư mục đóng gói `app/www/` hay trình cài đặt để thay cho việc sửa mã nguồn. Không phát hành, triển khai hoặc thay bộ bàn giao khi nhiệm vụ chưa yêu cầu.
- Đánh dấu hoàn tất dựa vào kết quả chưa chạy hoặc dùng kiểm thử engine để suy ra giao diện, tệp xuất và trình cài đã đạt.
