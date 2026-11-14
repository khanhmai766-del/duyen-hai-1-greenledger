# GreenLedger

Đọc `command/RULES.md` trước khi sửa dự án. Toàn bộ dự án là một kho Git (GitHub `khanhmai766-del/greenledger`, riêng tư); mã bản Web nằm trong `GreenLedger-Web/`, bản Desktop trong `GreenLedger-Desktop/`. Xem `command/README.md` để biết lệnh và cách gọi agent.

Khi cần tìm hoặc hiểu mã trong hai thư mục này, gọi `codegraph_explore` với `projectPath` là đường dẫn tuyệt đối tới thư mục tương ứng (mỗi thư mục có chỉ mục `.codegraph/` riêng). Nếu MCP không có sẵn, chạy `codegraph explore "<tên tệp hoặc hàm>"` từ gốc kho có chỉ mục `.codegraph/`.

Khi thiết kế, rà soát hoặc sửa giao diện GreenLedger, dùng `ui-ux-pro-max` và đọc `command/DESIGN.md`. Áp dụng kết quả tra cứu vào HTML, CSS và JavaScript thuần hiện có, kể cả giao diện chạy trong WebView2.
