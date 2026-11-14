# Thiết kế · GreenLedger

Giao diện mang phong cách phần mềm nghiệp vụ môi trường. Dùng nền sáng, bề mặt trắng, đường viền nhẹ và nhãn tiếng Việt. Mỗi màn hình ưu tiên số liệu, đơn vị, nguồn tham chiếu và thao tác của kỳ đang mở.

## Bản Web

- Thanh điều hướng xanh đậm `#102A26` nhóm các màn hình theo công việc kiểm kê và tài liệu. Mục đang mở có vạch hổ phách. Trên màn hình hẹp, các mục điều hướng cuộn ngang.
- Dải chọn kỳ hiển thị năm, cơ sở và bộ GWP. Thao tác nhân bản, sửa thông tin cơ sở và xóa nằm trong menu **Quản lý kỳ**.
- Tổng quan mở đầu bằng hero tràn mép vùng nội dung, thanh trên trong suốt đè lên hero (`overview-hero.css`): nền xanh sage đậm, tiêu đề Bricolage nét mảnh xen chữ serif nghiêng màu `#F2D7A0`, thẻ kết quả kính mờ, dải 4 bước và mô hình 3D Duyên Hải 1 nhúng từ Sketchfab kèm dòng ghi nguồn. Chuyển động mở trang chỉ chạy khi vào Tổng quan và tắt khi người dùng chọn giảm chuyển động. Ảnh `duyen-hai.png` là ảnh nền chờ và ảnh thay thế khi tắt mô hình.
- Trước đây Tổng quan đặt ảnh Duyên Hải 1 cạnh tổng phát thải và ba chỉ số đối chiếu. Màu hổ phách `#EDBC69` đánh dấu thao tác xuất báo cáo ở đầu trang. Biểu đồ thanh ghi rõ khi dùng thang logarit.
- `GreenLedger-Web/dist/inventory-ui.css` áp dụng hệ màu và bố cục trên màn hình. CSS in của báo cáo tiếp tục được quản lý cùng phân hệ báo cáo.

## Màu sắc

| Màu | Vai trò |
| --- | --- |
| `#1B4D3E` | Xanh lục chủ đạo cho điều hướng, nút chính và thẻ tổng phát thải. |
| `#2C5E8A` | Xanh lam cho liên kết, nhãn thông tin và biểu đồ Phạm vi 2. |
| `#F4F7F6`, `#FFFFFF` | Nền ứng dụng và bề mặt thẻ, bảng, hộp thoại. |
| `#203D35`, `#71817A`, `#DCE5DF` | Chữ chính, chữ phụ và đường viền theo biến CSS nền. |
| `#D9ECB5`, `#9AC76C` | Mục điều hướng đang chọn và viền lấy nét bằng bàn phím. |
| `#FCF7EC`, `#943F30` | Nền cảnh báo và chữ báo lỗi. Kèm nội dung diễn giải bằng văn bản. |
| `#132438` đến `#254764`, viền `#CDA55F` | Thanh công cụ Web xanh đậm với đường nhấn vàng. Menu Desktop dùng tông tương tự. |

## Chữ và số

- Bản Web dùng Bricolage Grotesque cho tiêu đề và số nổi bật, Source Sans 3 cho nội dung và điều khiển. Cả hai font được đóng gói cùng Worker, có bộ ký tự tiếng Việt. Bản cài Desktop và trang đăng nhập dùng phông theo CSS của từng bản.
- Căn phải cột số, dùng chữ số có độ rộng đều. Hiển thị số theo `vi-VN` và đặt đơn vị ở tiêu đề cột hoặc cạnh giá trị. Định dạng khi hiển thị để giữ độ chính xác của phép tính.

## Thành phần

- **Hiệu ứng React Bits** (`react-bits.js`, `react-bits.css`, chỉ bản Web): SpotlightCard trên thẻ hero và panel Tổng quan, RotatingText ở tiêu đề hero, StatusMark trong thông báo lưu. Chỉ dùng hiệu ứng làm rõ nội dung hoặc phản hồi thao tác; không đặt lên bảng số liệu, biểu mẫu hay báo cáo in.
- **Nút** (`buttons.css`, `buttons.js`, dùng chung hai bản): bo góc 8px, cao 36px (`.small` 32px), chữ đậm vừa, bóng nhẹ; màu giữ theo `.primary`, `.danger`, `.report-action`. Thao tác chính có thao tác phụ liên quan dùng **nút tách đôi** `splitButton()`: nửa trái chạy thao tác chính, nửa phải là mũi tên mở menu (có `aria-label`, `aria-expanded`, điều khiển bằng phím mũi tên, Home/End, Esc). Đang dùng cho "+ Kỳ mới | ⌄" (Nhân bản kỳ, Thông tin cơ sở, Xóa kỳ) và "In / Lưu PDF | ⌄" (Excel, CSV) qua `exportSplitButton()`.
- **Điều hướng và chọn kỳ** gồm thanh bên, thanh công cụ và dải chọn năm/cơ sở. Mục đang chọn có trạng thái rõ ràng.
- **Tổng quan** dùng thẻ KPI cho tổng, Phạm vi 1, Phạm vi 2 và ĐKĐBĐ mở rộng. Biểu đồ thanh theo nguồn và biểu đồ vành khuyên theo khí đi cùng nhãn và giá trị.
- **Dữ liệu hoạt động** dùng bảng cuộn ngang khi cần. Hộp thoại có nhãn trường, đơn vị và lựa chọn nhập tổng năm hoặc 12 tháng.
- **Chi tiết tính toán** dùng dải chọn kỳ viền vàng nhạt, bộ lọc bên trái và danh sách kết quả bên phải. Thẻ kết quả phân cấp theo phạm vi, nguồn và số phát thải. Chế độ Xem ngang căn số phát thải về bên phải, chế độ Xem dọc đặt số và thao tác ở chân thẻ. Giữ vị trí cuộn và tiêu điểm khi cập nhật bộ lọc hoặc mở chi tiết.
- **Báo cáo và phản hồi** dùng bố cục in A4 ngang hiện có, ẩn điều hướng và nút thao tác khi in. Dùng thông báo trạng thái để xác nhận thao tác, và hiển thị lỗi ở gần nội dung cần sửa.

Khi sửa giao diện, kiểm tra màn hình rộng và hẹp, tiếng Việt có dấu trong ô tìm kiếm, bảng dài, điều hướng bằng bàn phím và chế độ xem trước khi in. Tái sử dụng biến trong `style.css` và CSS của từng phân hệ.
