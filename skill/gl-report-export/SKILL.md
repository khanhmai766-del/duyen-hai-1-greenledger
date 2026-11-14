---
name: gl-report-export
description: "Dùng khi xuất hoặc đối chiếu báo cáo GreenLedger qua Excel XLSX, CSV hay bản in PDF, hoặc khi kiểm tra workbook tính lại."
---

# Đối chiếu báo cáo GreenLedger

1. Cố định bản Web hoặc Desktop, kỳ và bộ GWP. Dùng cùng một hồ sơ thử trên màn hình và tệp xuất.
2. Truy số liệu từ `Engine.summary()` qua báo cáo hoặc mô hình `excel-*.js` của bản tương ứng. So tổng từng phạm vi, đơn vị, ĐKĐBĐ và CO₂ sinh học.
3. Với XLSX, mở một bản sao, sửa một đầu vào và kiểm tra ô tổng tính lại. Với CSV, kiểm tra tiêu đề, đơn vị và dữ liệu có dấu. Với PDF, kiểm tra chế độ xem trước khi in và các cột dài.
4. Ghi kỳ, tệp đã kiểm tra, ô hoặc dòng chênh lệch và phần còn thiếu bằng chứng.
