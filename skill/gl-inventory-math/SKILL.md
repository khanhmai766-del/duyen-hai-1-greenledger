---
name: gl-inventory-math
description: "Dùng khi kiểm tra hoặc sửa công thức kiểm kê KNK GreenLedger, hệ số phát thải, GWP, CO₂ sinh học, quy đổi đơn vị hoặc độ không đảm bảo đo."
---

# Công thức kiểm kê GreenLedger

1. Đọc [quy tắc dự án](../../command/RULES.md). Xác định kỳ, phạm vi, mã nguồn phát thải, đơn vị nhập và bộ GWP đang dùng.
2. Truy từ dòng hoạt động qua hệ số đến `Engine.calculate()` và `Engine.summary()`. Kiểm tra cả hai engine khi sửa hành vi chung. Gắn tài liệu, bảng/trang và đơn vị cho mọi thay đổi hệ số.
3. Kiểm tra tổng năm với tổng 12 tháng tương đương, phần CO₂ sinh học báo cáo riêng và ĐKĐBĐ của dòng hoặc kỳ theo phạm vi thay đổi. Nếu công thức đi vào XLSX, đối chiếu với mô hình Excel bằng cùng đầu vào.
4. Chạy `node test.cjs` trong thư mục của từng bản chịu ảnh hưởng. Báo đầu vào, kết quả trước/sau và chênh lệch chưa giải quyết.
