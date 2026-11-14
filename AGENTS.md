# GreenLedger

Đọc `command/RULES.md` trước khi sửa dự án. Dùng `command/TASKS.md` và `command/PROGRESS.md` cho công việc theo danh sách. Toàn bộ dự án là một kho Git (GitHub `khanhmai766-del/duyen-hai-1-greenledger`, công khai); mã bản Web nằm trong `GreenLedger-Web/`, bản Desktop trong `GreenLedger-Desktop/`.

Khi người dùng nhập `@gl-emissions`, `@gl-web` hoặc `@gl-desktop`, đó là yêu cầu gọi subagent Codex theo tên đứng sau dấu @. Chuyển nội dung yêu cầu đi kèm cho agent tương ứng.

Nếu kho đang làm có `.codegraph/` ở gốc, dùng `codegraph_explore` hoặc `codegraph explore` trước khi tìm hoặc đọc mã. Bỏ qua CodeGraph ở kho chưa được lập chỉ mục.

Khi thiết kế, rà soát hoặc sửa giao diện GreenLedger, dùng `ui-ux-pro-max` và đọc `command/DESIGN.md`. Áp dụng kết quả tra cứu vào HTML, CSS và JavaScript thuần hiện có, kể cả giao diện chạy trong WebView2.
