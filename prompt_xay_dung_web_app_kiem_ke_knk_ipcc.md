# Bộ Prompt Hoàn Chỉnh Xây Dựng Web App Kiểm Kê Khí Nhà Kính (Chuẩn IPCC 2006, IPCC AR6 & Thông Tư 38/2023/TT-BCT)

Bạn có thể sao chép toàn bộ nội dung trong phần **Nội dung Prompt Gốc** bên dưới và dán trực tiếp vào bất kỳ công cụ lập trình AI nào (hoặc yêu cầu tạo trực tiếp trên **Canvas**, **Cursor**, **Bolt.new**, **Lovable**, **v0**, **Claude**...) để tạo ra một phần mềm Web App tính toán kiểm kê khí nhà kính hoàn chỉnh, chạy độc lập trên trình duyệt mà không cần dùng Excel.

## Nội dung Prompt Gốc (Copy toàn bộ phần dưới đây để tạo App)

### 1. Vai trò và Mục tiêu Dự án
Hãy đóng vai một Kiến trúc sư Phần mềm Cao cấp (Senior Full-Stack Engineer) và Chuyên gia Kiểm kê Khí nhà kính (IPCC 2006 & IPCC AR6). Hãy xây dựng cho tôi một **Ứng dụng Web (Web App) Kiểm kê Khí nhà kính Cấp cơ sở** hoàn chỉnh, hiện đại, hoạt động độc lập trên trình duyệt (không phụ thuộc vào Excel), cho phép **Thêm mới, Chỉnh sửa, Xóa, Lưu trữ và So sánh dữ liệu qua nhiều năm/kỳ kiểm kê (Full CRUD)**, tự động tra cứu hệ số, tính toán phát thải Phạm vi 1 & Phạm vi 2, tính Độ không đảm bảo đo (Uncertainty Analysis) và xuất báo cáo chuẩn **IPCC 2006** cũng như **Thông tư 38/2023/TT-BCT**.

### 2. Yêu cầu Công nghệ và Trải nghiệm Người dùng (Tech Stack & UX)
* **Kiến trúc ứng dụng:** Ứng dụng Web tương tác (React + Tailwind CSS + Lucide Icons + Recharts/Chart.js, hoặc Single-File HTML/CSS/JS hoàn chỉnh).
* **Lưu trữ dữ liệu bền vững (Persistence & CRUD):**
  * Tự động lưu toàn bộ dữ liệu vào `localStorage` của trình duyệt theo từng **Hồ sơ / Kỳ kiểm kê** (ví dụ: *Kỳ kiểm kê năm 2024*, *Kỳ kiểm kê năm 2025*, *Kỳ kiểm kê năm 2026*...).
  * Có chức năng **Tạo kỳ kiểm kê mới**, **Nhân bản (Clone) kỳ kiểm kê cũ sang năm mới**, **Chỉnh sửa thông tin cơ sở**, **Xóa kỳ kiểm kê**, **Khôi phục dữ liệu mẫu (Reset to Default)**, và **Xuất / Nhập dữ liệu dự phòng ra file `.json`, `.csv` hoặc in báo cáo `.pdf`**.
* **Giao diện & Bảng màu:** Thiết kế chuyên nghiệp theo phong cách phần mềm quản trị ESG hiện đại (tông màu chủ đạo Xanh lục bảo đậm `#1B4D3E`, Xanh lam đá `#2C5E8A`, nền sáng `#F4F7F6`), có **Tooltip / Badge chú thích nguồn tra cứu tài liệu gốc (Tên file PDF, Số bảng, Số trang)** ngay bên cạnh từng hệ số và kết quả tính toán.

### 3. Cơ sở dữ liệu Tra cứu Mặc định (Seed Database - Cho phép Thêm / Sửa / Xóa trên Giao diện)
Ứng dụng phải nạp sẵn (pre-load) 4 bảng cơ sở dữ liệu tra cứu chuẩn dưới đây và cho phép người dùng **Thêm mới / Chỉnh sửa / Xóa** bất kỳ dòng nào trong tab **"Thư viện Hệ số Tra cứu"**:

#### 3.1. Bảng Tra cứu Nhiên liệu Đốt cố định (`stationaryFuels` – IPCC 2006 Vol 2 Ch.1 & Ch.2)

| Mã nhiên liệu | Tên nhiên liệu (Việt - Anh chuẩn Table 1.1) | ĐVT gốc | KLR (kg/ĐVT) | NCV (TJ/Gg) [Lower – Upper] | EF CO2 (kg/TJ) [Lower – Upper] | EF CH4 (kg/TJ) [Lower – Upper] | EF N2O (kg/TJ) [Lower – Upper] | Sinh khối (Tách riêng CO2) | Nguồn trích dẫn (File PDF, Bảng, Trang) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DO_STAT` | Dầu DO (`Gas/Diesel Oil`) | Lít | 0,84 | **43,0** [41,4 – 43,3] | **74.100** [72.600 – 74.800] | **3,0** [1,0 – 10,0] | **0,6** [0,2 – 2,0] | Không | `V2_1_Ch1` Table 1.2 (tr.18 PDF) & `V2_2_Ch2` Table 2.3 (tr.18 PDF); KLR: TCCS 01/2023/PLX |
| `LPG_STAT` | Khí hóa lỏng LPG (`Liquefied Petroleum Gases`) | Kg | 1,00 | **47,3** [44,8 – 52,2] | **63.100** [61.600 – 65.600] | **1,0** [0,3 – 3,0] | **0,1** [0,03 – 0,3] | Không | `V2_1_Ch1` Table 1.2 (tr.18 PDF) & `V2_2_Ch2` Table 2.3 (tr.18 PDF) |
| `GAS_STAT` | Xăng động cơ (`Motor Gasoline`) | Lít | 0,745 | **44,3** [42,5 – 44,8] | **69.300** [67.500 – 73.000] | **3,0** [1,0 – 10,0] | **0,6** [0,2 – 2,0] | Không | `V2_1_Ch1` Table 1.2 (tr.18 PDF) & `V2_2_Ch2` Table 2.3 (tr.18 PDF) |
| `COAL_SUB` | Than đá 4800Nar (`Sub-Bituminous Coal`) | Kg | 1,00 | **18,9** [11,5 – 26,0] | **96.100** [92.800 – 100.000] | **10,0** [3,0 – 30,0] | **1,5** [0,5 – 5,0] | Không | `V2_1_Ch1` Table 1.2 (tr.18 PDF) & `V2_2_Ch2` Table 2.3 (tr.18 PDF) |
| `ACETYLEN` | Khí Acetylen hàn cắt (`Acetylene C2H2`) | Kg | 1,00 | **48,2** [46,5 – 50,0] | **69.900** [67.000 – 73.000] | **1,0** [0,3 – 3,0] | **0,1** [0,03 – 0,3] | Không | Engineering Toolbox (LHV = 48,2 TJ/Gg) & BC Gov PSO Methodology |
| `NAT_GAS` | Khí tự nhiên (`Natural Gas - CH4`) | Kg | 1,00 | **48,0** [46,5 – 50,4] | **56.100** [54.300 – 58.300] | **1,0** [0,3 – 3,0] | **0,1** [0,03 – 0,3] | Không | `V2_1_Ch1` Table 1.2 (tr.19 PDF) & `V2_2_Ch2` Table 2.3 (tr.18 PDF) |
| `BIOMASS` | Sinh khối rắn: Củi, trấu, vỏ điều (`Wood/Wood Waste`) | Kg | 1,00 | **15,6** [7,9 – 31,0] | **112.000** [95.000 – 132.000] | **30,0** [10,0 – 100,0] | **4,0** [1,5 – 15,0] | **Có** | `V2_1_Ch1` Table 1.2 (tr.19 PDF) & `V2_2_Ch2` Table 2.3 (tr.19 PDF), Mục 2.3.3.4 |
| `SLUDGE_DRY` | Bùn khô đốt thu hồi nhiệt (`Dried Sludge`) | Kg | 1,00 | **11,6** [5,9 – 23,0] | **100.000** [84.700 – 117.000] | **30,0** [10,0 – 100,0] | **4,0** [1,5 – 15,0] | **Có** | `V2_1_Ch1` Table 1.2 (tr.19 PDF) & `V5_5_Ch5_IOB` Table 5.2, 5.5, 5.6 (tr.18–22 PDF) |

#### 3.2. Bảng Tra cứu Nhiên liệu Đốt di động (`mobileFuels` – IPCC 2006 Vol 2 Ch.3)

| Mã nhiên liệu | Phương tiện / Nhiên liệu di động | ĐVT gốc | KLR (kg/ĐVT) | NCV (TJ/Gg) [Lower – Upper] | EF CO2 (kg/TJ) [Lower – Upper] | EF CH4 (kg/TJ) [Lower – Upper] | EF N2O (kg/TJ) [Lower – Upper] | Nguồn trích dẫn (File PDF, Bảng, Trang) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `DO_ROAD` | Dầu DO giao thông đường bộ (`Road Diesel`) | Lít | 0,84 | **43,0** [41,4 – 43,3] | **74.100** [72.600 – 74.800] | **3,9** [1,6 – 9,5] | **3,9** [1,3 – 12,0] | `V2_3_Ch3_Mobile_Combustion.pdf` Table 3.2.1 (tr.16) & Table 3.2.2 (tr.21) |
| `GAS_UNCTRL` | Xăng đường bộ – Không kiểm soát (`Uncontrolled`) | Lít | 0,745 | **44,3** [42,5 – 44,8] | **69.300** [67.500 – 73.000] | **33,0** [9,6 – 110,0] | **3,2** [0,96 – 11,0] | `V2_3_Ch3_Mobile_Combustion.pdf` Table 3.2.1 (tr.16) & Table 3.2.2 (tr.21) |
| `GAS_CAT` | Xăng đường bộ – Có bầu xúc tác (`Oxidation Catalyst`) | Lít | 0,745 | **44,3** [42,5 – 44,8] | **69.300** [67.500 – 73.000] | **25,0** [7,5 – 86,0] | **8,0** [2,6 – 24,0] | `V2_3_Ch3_Mobile_Combustion.pdf` Table 3.2.1 (tr.16) & Table 3.2.2 (tr.21) |
| `GAS_LDV95` | Xăng đường bộ – Xe con đời mới (`LDV >= 1995`) | Lít | 0,745 | **44,3** [42,5 – 44,8] | **69.300** [67.500 – 73.000] | **3,8** [1,1 – 13,0] | **5,7** [1,9 – 17,0] | `V2_3_Ch3_Mobile_Combustion.pdf` Table 3.2.1 (tr.16) & Table 3.2.2 (tr.21) |
| `DO_OFFROAD` | Dầu DO xe nâng / máy công nghiệp (`Off-road Industry`) | Lít | 0,84 | **43,0** [41,4 – 43,3] | **74.100** [72.600 – 74.800] | **4,15** [1,66 – 10,4] | **28,6** [14,3 – 85,8] | `V2_3_Ch3_Mobile_Combustion.pdf` Table 3.3.1 (tr.36 PDF) |
| `GAS_4S_OFF` | Xăng máy cắt cỏ / bơm PCCC 4 kỳ (`Off-road 4-Stroke`) | Lít | 0,745 | **44,3** [42,5 – 44,8] | **69.300** [67.500 – 73.000] | **50,0** [20,0 – 125,0] | **2,0** [1,0 – 6,0] | `V2_3_Ch3_Mobile_Combustion.pdf` Table 3.3.1 (tr.36 PDF) |

#### 3.3. Bảng Tra cứu GWP-100 & Môi chất lạnh / PCCC (`gwpAndRefrigerants` – IPCC AR6 Ch.7 & Vol 3 Ch.7)

| Mã chất | Tên khí / Môi chất lạnh | Thành phần & Tỷ lệ khối lượng (Table 7.8 Vol 3) | GWP AR4 | GWP AR5 | GWP AR6 | ĐKĐBĐ chuẩn u(GWP) | %u(GWP) | Nguồn trích dẫn (File PDF, Bảng, Trang) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `CO2` | Carbon dioxide ($\text{CO}_2$) | 100% $\text{CO}_2$ | 1 | 1 | **1** | **0** | 0,00% | `3.7 IPCC_AR6_WGI_Chapter07.pdf` Table 7.15 (tr.95 PDF) |
| `CH4_FOSSIL` | Methane hóa thạch ($\text{CH}_4$-fossil) | 100% $\text{CH}_4$ | 25 | 30 | **29,8** | **5,50** ($=11/2$) | 18,46% | `3.7 IPCC_AR6_WGI_Chapter07.pdf` Table 7.15 (tr.95 PDF - Nguồn hóa thạch) |
| `CH4_BIO` | Methane sinh học ($\text{CH}_4$-non fossil) | 100% $\text{CH}_4$ | 25 | 28 | **27,0** | **5,50** ($=11/2$) | 20,37% | `3.7 IPCC_AR6_WGI_Chapter07.pdf` Table 7.15 (tr.95 PDF - Không hóa thạch) |
| `N2O` | Nitrous oxide ($\text{N}_2\text{O}$) | 100% $\text{N}_2\text{O}$ | 298 | 265 | **273** | **65,00** ($=130/2$) | 23,81% | `3.7 IPCC_AR6_WGI_Chapter07.pdf` Table 7.15 (tr.95 PDF) |
| `HFC_32` | R-32 (`HFC-32`) | 100% $\text{HFC-32}$ | 675 | 677 | **771** | **146,00** ($=292/2$) | 18,94% | `3.7 IPCC_AR6_WGI_Chapter07.pdf` Table 7.15 (tr.95) & `SM` Table 7.SM.13 (tr.29) |
| `HFC_125` | R-125 (`HFC-125`) | 100% $\text{HFC-125}$ | 3500 | 3170 | **3740** | **286,18** (`STDEV`) | 7,65% | `IPCC_AR6_WGI_Chapter07_SM.pdf` Table 7.SM.7 (tr.17) & `GHG Protocol` (tr.2) |
| `HCFC_22` | R-22 (`HCFC-22`) | 100% $\text{HCFC-22}$ | 1810 | 1760 | **1960** | **104,08** (`STDEV`) | 5,31% | `IPCC_AR6_WGI_Chapter07_SM.pdf` Table 7.SM.7 (tr.16) & `GHG Protocol` (tr.2) |
| `HFC_134A` | R-134a (`HFC-134a`) | 100% $\text{HFC-134a}$ | 1430 | 1300 | **1530** | **290,50** ($=581/2$) | 18,99% | `3.7 IPCC_AR6_WGI_Chapter07.pdf` Table 7.15 (tr.95) & `SM` Table 7.SM.12 (tr.29) |
| `HFC_143A` | R-143a (`HFC-143a`) | 100% $\text{HFC-143a}$ | 4470 | 4800 | **5810** | **700,95** (`STDEV`) | 12,06% | `IPCC_AR6_WGI_Chapter07_SM.pdf` Table 7.SM.7 (tr.17) & `GHG Protocol` (tr.2) |
| `HFC_227EA` | FM-200 (`HFC-227ea` - Chữa cháy) | 100% $\text{HFC-227ea}$ | 3220 | 3350 | **3600** | **193,13** (`STDEV`) | 5,36% | `IPCC_AR6_WGI_Chapter07_SM.pdf` Table 7.SM.7 (tr.17) & `V3_7_Ch7` Mục 7.6 (tr.61) |
| `R410A` | Hỗn hợp R-410A | 50% HFC-32 + 50% HFC-125 | 2087,5 | 1923,5 | **2255,5** | **321,27** *(hoặc 160,64 có trọng số)* | 14,24% | `V3_7_Ch7_ODS_Substitutes.pdf` Table 7.8 (tr.44 PDF) |
| `R404A` | Hỗn hợp R-404A | 44% HFC-125 + 52% HFC-143a + 4% HFC-134a | 3921,6 | 3942,8 | **4728,0** | **386,40** (có trọng số) | 8,17% | `V3_7_Ch7_ODS_Substitutes.pdf` Table 7.8 (tr.44 PDF) |
| `R407C` | Hỗn hợp R-407C | 23% HFC-32 + 25% HFC-125 + 52% HFC-134a | 1773,85 | 1624,21 | **1907,93** | **170,12** (có trọng số) | 8,92% | `V3_7_Ch7_ODS_Substitutes.pdf` Table 7.8 (tr.44 PDF) |

#### 3.4. Bảng Tra cứu Nước thải (Vol 5 Ch.6), Phân bón Urê (Vol 4 Ch.11) & Lưới điện VN (`otherFactors`)

* **Nước thải sinh hoạt (`V5_6_Ch6_Wastewater.pdf`):**
  * $\text{BOD}_{24\text{h}} = 40\text{ g BOD/người/ngày}$ (Table 6.4 tr.14 PDF; ĐKĐBĐ $\pm 30\% \Rightarrow \%u = 15\%$ tại Table 6.7 tr.17 PDF).
  * Khả năng sinh mêtan tối đa $B_o = 0,60\text{ kg CH}_4/\text{kg BOD}$ (Table 6.2 tr.12 PDF; ĐKĐBĐ $\pm 30\% \Rightarrow \%u = 15\%$).
  * Hệ số hiệu chỉnh mêtan $\text{MCF}$ (Table 6.3 tr.13 PDF): Bể tự hoại (`Septic system`) $= 0,50$ ($\pm 10\% \Rightarrow \%u = 5\%$); Hệ thống xử lý hiếu khí tập trung vận hành tốt $= 0,00$; Hiếu khí quá tải $= 0,30$ ($\pm 30\%$); Bể kỵ khí `Anaerobic reactor` $= 0,80$ ($\pm 10\%$).
  * ĐKĐBĐ số liệu nhân sự $P = \pm 5\% \Rightarrow \%u_P = 2,5\%$ (Table 6.7 tr.17 PDF).
* **Nước thải công nghiệp (`V5_6_Ch6_Wastewater.pdf`):**
  * Phát thải $\text{N}_2\text{O}$ từ xả thải: $EF_{\text{EFFLUENT}} = 0,005\text{ kg N}_2\text{O-N/kg N}$ (Table 6.11 tr.27 PDF), hệ số chuyển đổi phân tử khối $\text{N}_2\text{O}/\text{N}_2 = 44/28$.
  * Phát thải $\text{CH}_4$ từ xử lý nước thải công nghiệp (tùy chọn): $B_o = 0,25\text{ kg CH}_4/\text{kg COD}$ (Mục 6.2.3.2 tr.20 PDF, Table 6.10 tr.23 PDF).
* **Phân bón Urê & Cải tạo đất (`V4_11_Ch11_N2O&CO2.pdf`):**
  * Hệ số phát thải $\text{CO}_2\text{–C}$ khi sử dụng phân Urê $\text{CO(NH}_2)_2$: $EF_{\text{Urê}} = 0,20\text{ tấn C/tấn Urê}$ (Mục 11.4.1 Equation 11.13 tr.32 PDF, ĐKĐBĐ $-50\%$), nhân hệ số quy đổi $\text{CO}_2/\text{C} = 44/12 \Rightarrow 0,7333\text{ tấn CO}_2/\text{tấn Urê}$.
  * Bón vôi cải tạo đất (tùy chọn): $EF_{\text{CaCO}_3} = 0,12\text{ tấn C/tấn đá vôi} \times 44/12$ (Equation 11.12 tr.27 PDF).
* **Hệ số phát thải Lưới điện Việt Nam (Cục Biến đổi khí hậu – Cho phép thêm năm mới):**
  * Năm 2021: `0,7221 tCO2/MWh`; Năm 2022: `0,6766 tCO2/MWh`; Năm 2023: `0,6592 tCO2/MWh`; Năm 2024: `0,6187 tCO2/MWh`.
  * Tự động tính độ lệch chuẩn mẫu $\text{SD} = \text{STDEV}(\text{chuỗi các năm}) = 0,042831$ và $\%u_{\text{EF điện}} = \text{SD} / EF_{\text{năm hiện tại}} = 6,9227\%$.

### 4. Quy chuẩn Công thức Tính toán & Độ không đảm bảo đo (Calculation Engine)

1. **Đốt nhiên liệu cố định & di động (Scope 1.1 & 1.2):**
   * $\text{Khối lượng (kg)} = \text{Lượng dùng} \times \text{KLR}$; $\text{Khối lượng (Gg)} = \text{Khối lượng (kg)} \times 10^{-6}$.
   * $\text{Nhiệt lượng (TJ)} = \text{Khối lượng (Gg)} \times \text{NCV (TJ/Gg)}$.
   * $\text{Phát thải CO}_2\text{ (kg)} = \text{TJ} \times EF_{\text{CO}_2}$; $\text{Phát thải CH}_4\text{ (kg CO}_2\text{e)} = \text{TJ} \times EF_{\text{CH}_4} \times \text{GWP}_{\text{CH}_4}$; $\text{Phát thải N}_2\text{O (kg CO}_2\text{e)} = \text{TJ} \times EF_{\text{N}_2\text{O}} \times \text{GWP}_{\text{N}_2\text{O}}$.
   * **Quy tắc Sinh khối (`Biomass` & `Bùn khô`):** Không cộng $\text{CO}_2$ vào tổng phát thải Phạm vi 1 ($\text{Tổng CO}_2\text{e} = (\text{CH}_4 + \text{N}_2\text{O})/1000$), mà tách riêng phần $\text{CO}_2$ vào chỉ tiêu **"Tổng lượng $\text{CO}_2$ sinh học báo cáo riêng"**.
   * **Độ không đảm bảo đo chuẩn từng thông số:**
     * $u(\text{NCV}) = \max(\text{NCV} - \text{Lower}, \text{Upper} - \text{NCV}) / 2 \Rightarrow \%u_{\text{NCV}} = u(\text{NCV}) / \text{NCV}$.
     * $u(\text{EF}_i) = \max(\text{EF}_i - \text{Lower}_i, \text{Upper}_i - \text{EF}_i) / 2 \Rightarrow \%u_{\text{EF}_i} = u(\text{EF}_i) / \text{EF}_i$.
     * $\%u_{\text{AD}}$: Trụ bơm xăng dầu $= 0,5\% / \sqrt{3} = 0,2887\%$; Cân 5 tấn ($e=5\text{kg}$) $= (5/\sqrt{3})/5000 = 0,0577\%$; Cân 50 tấn ($e=15\text{kg}$) $= (15/\sqrt{3})/50000 = 0,0173\%$ *(cho phép người dùng tùy chỉnh thông số hiệu chuẩn cân/đồng hồ đo trên từng dòng)*.
     * $\%u_{\text{khí } i} = \sqrt{\%u_{\text{AD}}^2 + \%u_{\text{NCV}}^2 + \%u_{\text{EF}_i}^2 + \%u_{\text{GWP}_i}^2}$.
     * $u_{\text{dòng nhiên liệu}}\text{ (tấn CO}_2\text{e)} = \frac{1}{1000}\sqrt{(\%u_{\text{CO}_2} \cdot E_{\text{CO}_2})^2 + (\%u_{\text{CH}_4} \cdot E_{\text{CH}_4})^2 + (\%u_{\text{N}_2\text{O}} \cdot E_{\text{N}_2\text{O}})^2}$.

2. **Nước thải sinh hoạt (Scope 1.3 – Nhập theo 12 tháng hoặc cả năm):**
   * $\text{TOW (kg BOD)} = \frac{\text{Tổng giờ làm việc}}{24} \times \text{BOD}_{24\text{h}} \times 10^{-3}$; $EF = B_o \times \text{MCF}$; $\text{CH}_4\text{ (kg)} = \text{TOW} \times EF$; $\text{Phát thải (tấn CO}_2\text{e)} = \text{CH}_4 \times 27,0 / 1000$.
   * $\%u_{\text{tổng hợp}} = \sqrt{2,5\%^2 + 15\%^2 + 15\%^2 + 5\%^2 + 20,37\%^2} = 29,94\%$.

3. **Nước thải công nghiệp (Scope 1.4 – Nhập theo 12 tháng hoặc cả năm):**
   * $N_{\text{EFFLUENT}}\text{ (kg N)} = Q\text{ (m}^3\text{)} \times C_{\text{N xả ra}}\text{ (kg/m}^3\text{)}$.
   * $E_{\text{N}_2\text{O}}\text{ (tấn CO}_2\text{e)} = \frac{1}{1000} \times N_{\text{EFFLUENT}} \times 0,005 \times \frac{44}{28} \times 273$.

4. **Rò rỉ Môi chất lạnh & PCCC (Scope 1.5 & 1.6):**
   * $\text{GWP}_{\text{hỗn hợp}} = \sum (\text{Tỷ lệ}_i \times \text{GWP}_i)$; $E\text{ (tấn CO}_2\text{e)} = \text{Lượng nạp bù (kg)} \times \text{GWP} / 1000$.
   * Cho phép chuyển đổi linh hoạt giữa 2 chế độ tính $u(\text{GWP}_{\text{hỗn hợp}})$: *Không trọng số* ($\sqrt{\sum u_i^2}$ - khớp với file Excel gốc) và *Có trọng số chuẩn* ($\sqrt{\sum (w_i \cdot u_i)^2}$).

5. **Phân bón Urê (Scope 1.7) & Mua điện lưới (Scope 2.1):**
   * Phân Urê: $E_{\text{CO}_2}\text{ (tấn CO}_2\text{e)} = M_{\text{Urê (tấn)}} \times 0,20 \times \frac{44}{12}$.
   * Điện lưới: $E_{\text{Điện}}\text{ (tấn CO}_2\text{e)} = \frac{\text{Điện tiêu thụ (kWh)}}{1000} \times EF_{\text{Lưới điện}}$; $\%u_{\text{Điện}} = \sqrt{0,1\%^2 + \%u_{\text{EF điện}}^2}$.

6. **Tổng hợp Độ không đảm bảo đo Toàn cơ sở:**
   * $u_{\text{Toàn cơ sở}}\text{ (tấn CO}_2\text{e)} = \sqrt{\sum u_k^2}$ (căn bậc hai tổng bình phương độ không đảm bảo đo chuẩn của tất cả các nguồn).
   * Độ không đảm bảo đo mở rộng ở mức tin cậy 95% ($k = 1,96$): $U\text{ (tấn CO}_2\text{e)} = 1,96 \times u_{\text{Toàn cơ sở}}$ và $\%U = (U / \text{Tổng phát thải}) \times 100\%$.

### 5. Các Phân hệ Giao diện Chức năng Cần Xây dựng (6 Tabs Chính)
1. **Tab 1 – Dashboard Tổng quan:**
   * Thanh chọn **Kỳ kiểm kê (Năm / Cơ sở)** kèm nút **Thêm kỳ mới**, **Nhân bản kỳ hiện tại**, **Xóa kỳ**.
   * 4 Thẻ KPI lớn: Tổng phát thải KNK (Scope 1+2), Phát thải Phạm vi 1, Phát thải Phạm vi 2, Độ không đảm bảo đo mở rộng ($\pm \%U$).
   * 2 Biểu đồ tương tác: Biểu đồ cột theo 8 nhóm nguồn phát thải và Biểu đồ tròn/thanh ngang theo 4 nhóm khí nhà kính ($\text{CO}_2, \text{CH}_4, \text{N}_2\text{O}, \text{HFCs}$).
2. **Tab 2 – Quản lý & Nhập Số liệu Hoạt động (CRUD):**
   * Hỗ trợ 2 chế độ nhập liệu tiện lợi: **Nhập nhanh Tổng năm** hoặc **Mở bảng chi tiết 12 tháng (Tháng 1 $\rightarrow$ Tháng 12)** tự động cộng tổng.
   * Có nút **"+ Thêm dòng nguồn phát thải mới"**, **Chỉnh sửa thiết bị / nguồn dữ liệu / sai số thiết bị đo**, và **Xóa dòng nguồn** (nút thùng rác có xác nhận).
   * Nạp sẵn bộ dữ liệu mặc định (`50.000 lít Dầu DO cố định` $\rightarrow$ kết quả chuẩn `134,2819 tấn CO2e`, $\pm 4,22\%$) để kiểm chứng ngay khi mở App.
3. **Tab 3 – Chi tiết Tính toán & Độ không đảm bảo đo (Phạm vi 1 & 2):**
   * Hiển thị tường minh từng bước trung gian (`Khối lượng kg`, `Gg`, `Nhiệt lượng TJ`, `Phát thải từng khí`, `u% thành phần`, `u tấn CO2e`, `U mở rộng`) và nhãn trích dẫn tài liệu IPCC.
4. **Tab 4 – Báo cáo Tổng hợp (Chuẩn IPCC 2006, Thông tư 38/2023/TT-BCT & Phụ lục II):**
   * Chuyển đổi xem giữa 3 biểu mẫu báo cáo chuẩn quy định, tự động tách dòng **Tổng lượng $\text{CO}_2$ sinh học**.
5. **Tab 5 – Thư viện Hệ số Tra cứu IPCC & GWP (CRUD):**
   * Cho phép người dùng tra cứu, tìm kiếm, **Thêm nhiên liệu / môi chất lạnh mới**, **Cập nhật hệ số phát thải lưới điện năm mới**, hoặc **Chỉnh sửa hệ số NCV/EF/GWP** khi có kết quả thử nghiệm thực tế tại phòng thí nghiệm.
6. **Tab 6 – Sao lưu, Xuất/Nhập Dữ liệu & In Báo cáo:**
   * Xuất/Nhập toàn bộ cơ sở dữ liệu dưới dạng file `.json` (để lưu trên máy tính và mở lại bất cứ lúc nào), xuất bảng tổng hợp ra `.csv` và nút **In / Xuất Báo cáo PDF**.
