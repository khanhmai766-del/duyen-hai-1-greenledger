# PRD · GreenLedger

## Sản phẩm và người dùng

GreenLedger là công cụ tiếng Việt để kiểm kê khí nhà kính (KNK) cấp cơ sở. Bản Web chạy trên trình duyệt và bản Desktop chạy trên Windows x64. Cả hai phục vụ quy trình nhập số liệu hoạt động, tra cứu hệ số, tính phát thải và lập báo cáo theo kỳ kiểm kê.

- **Cán bộ môi trường, năng lượng hoặc ESG** nhập số liệu từ hóa đơn, đồng hồ đo và sổ vận hành, sau đó tổng hợp theo năm và cơ sở.
- **Người lập và rà soát báo cáo** cần truy từ tổng phát thải về từng nguồn, đơn vị, hệ số, tài liệu tham chiếu và bước tính.
- **Cơ sở dùng làm ca đối chiếu** là Nhà máy Nhiệt điện Duyên Hải 1. Nhánh Web đang tích hợp hồ sơ kỳ 2025.

## Luồng sử dụng chính

1. Chọn, tạo hoặc nhân bản kỳ theo năm và cơ sở. So sánh các kỳ trên trang Tổng quan.
2. Nhập tổng năm hoặc 12 tháng. Chọn nhóm nguồn, hệ số, đơn vị, chứng từ và thông tin sai số phù hợp.
3. Xem phát thải Phạm vi 1 và 2 theo nguồn và khí, cùng độ không đảm bảo đo (ĐKĐBĐ). Theo dõi riêng CO₂ sinh học.
4. Mở chi tiết công thức và nguồn tham chiếu. Cập nhật thư viện hệ số khi có tài liệu hoặc kết quả đo thích hợp.
5. Rà báo cáo, xuất Excel hoặc CSV, in báo cáo dưới dạng PDF và xuất JSON để sao lưu hoặc chuyển hồ sơ.

## Phạm vi và tiêu chí nghiệm thu

| Phạm vi | Tiêu chí nghiệm thu |
| --- | --- |
| Nguồn phát thải | Hỗ trợ đốt cố định, đốt di động, nước thải sinh hoạt, nước thải công nghiệp, môi chất lạnh, PCCC, phân bón/cải tạo đất và điện lưới. Tổng tháng khớp số liệu tổng năm tương đương. |
| Tính toán | Tổng quan, chi tiết, báo cáo và dữ liệu xuất đối chiếu được cùng một kỳ. Đơn vị, bộ GWP, cách tổng hợp ĐKĐBĐ và phần CO₂ sinh học thể hiện rõ. |
| Hệ số và báo cáo | Gắn nguồn tra cứu với hệ số và công thức. Dùng IPCC 2006, các bộ GWP AR4/AR5/AR6 và biểu mẫu nêu trong [yêu cầu gốc](../prompt_xay_dung_web_app_kiem_ke_knk_ipcc.md) làm căn cứ đối chiếu với hồ sơ cơ sở. |
| Dữ liệu | Mở lại vẫn thấy hồ sơ đã lưu. Nhập bản sao lưu hợp lệ khôi phục đúng kỳ và thư viện. Tệp sai cấu trúc được báo lỗi và dữ liệu hiện tại được giữ. |
| Đối chiếu | Ca chuẩn 50.000 lít dầu DO đốt cố định cho khoảng 134,2818792 tCO₂e trong bộ kiểm thử. Hồ sơ Duyên Hải 1 năm 2025 cần đối chiếu với hồ sơ gốc trước khi dùng làm số liệu báo cáo. |

Phạm vi phát hành hiện tại tập trung vào kiểm kê cấp cơ sở với dữ liệu lưu trên thiết bị. Phạm vi 3, đồng bộ hồ sơ giữa thiết bị và nộp báo cáo tự động cần yêu cầu sản phẩm riêng.
