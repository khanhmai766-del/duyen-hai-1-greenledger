'use strict';
const factorWorkbook = {
  "fuels": [
    {
      "sheet": "TC_NHIEN_LIEU_VOL2",
      "title": "Đốt cố định",
      "start": 7,
      "fields": [
        [
          "Mã nhiên liệu (Key)",
          false
        ],
        [
          "Tên nhiên liệu (Việt - Anh chuẩn IPCC Table 1.1)",
          false
        ],
        [
          "ĐVT gốc",
          false
        ],
        [
          "KLR mặc định (kg/ĐVT)",
          false
        ],
        [
          "NCV Mặc định (TJ/Gg)",
          false
        ],
        [
          "NCV Lower (TJ/Gg)",
          false
        ],
        [
          "NCV Upper (TJ/Gg)",
          false
        ],
        [
          "ĐKĐBĐ chuẩn u(NCV)",
          false
        ],
        [
          "EF CO2 Mặc định (kg/TJ)",
          false
        ],
        [
          "EF CO2 Lower (kg/TJ)",
          false
        ],
        [
          "EF CO2 Upper (kg/TJ)",
          false
        ],
        [
          "EF CH4 Mặc định (kg/TJ)",
          false
        ],
        [
          "EF CH4 Lower (kg/TJ)",
          false
        ],
        [
          "EF CH4 Upper (kg/TJ)",
          false
        ],
        [
          "EF N2O Mặc định (kg/TJ)",
          false
        ],
        [
          "EF N2O Lower (kg/TJ)",
          false
        ],
        [
          "EF N2O Upper (kg/TJ)",
          false
        ],
        [
          "Nguồn trích dẫn chính xác (Tên File PDF, Bảng, Trang)",
          false
        ]
      ],
      "rows": [
        [
          "Dầu DO",
          "Dầu DO (Gas/Diesel Oil)",
          "Lít",
          0.84,
          43,
          41.4,
          43.3,
          0.800000000000001,
          74100,
          72600,
          74800,
          3,
          1,
          10,
          0.6,
          0.2,
          2,
          "V2_1_Ch1 Table 1.2 (tr.18 PDF) & V2_2_Ch2 Table 2.3 (tr.18 PDF); KLR: TCCS 01/2023/PLX"
        ],
        [
          "LPG",
          "Khí hóa lỏng LPG (Liquefied Petroleum Gases)",
          "Kg",
          1,
          47.3,
          44.8,
          52.2,
          2.45,
          63100,
          61600,
          65600,
          1,
          0.3,
          3,
          0.1,
          0.03,
          0.3,
          "V2_1_Ch1 Table 1.2 (tr.18 PDF) & V2_2_Ch2 Table 2.3 (tr.18 PDF)"
        ],
        [
          "Xăng",
          "Xăng động cơ (Motor Gasoline)",
          "Lít",
          0.745,
          44.3,
          42.5,
          44.8,
          0.899999999999999,
          69300,
          67500,
          73000,
          3,
          1,
          10,
          0.6,
          0.2,
          2,
          "V2_1_Ch1 Table 1.2 (tr.18 PDF) & V2_2_Ch2 Table 2.3 (tr.18 PDF); KLR: Petrolimex A95"
        ],
        [
          "Than đá 4800Nar",
          "Than á bitum (Sub-Bituminous Coal - 4800Nar)",
          "Kg",
          1,
          18.9,
          11.5,
          26,
          3.7,
          96100,
          92800,
          100000,
          10,
          3,
          30,
          1.5,
          0.5,
          5,
          "V2_1_Ch1 Table 1.2 (tr.18 PDF) & V2_2_Ch2 Table 2.3 (tr.18 PDF) [Hoặc theo KQ thử nghiệm lô than]"
        ],
        [
          "Acetylen",
          "Khí Acetylen hàn cắt (Acetylene C2H2)",
          "Kg",
          1,
          48.2,
          46.5,
          50,
          0.899999999999999,
          69900,
          67000,
          73000,
          1,
          0.3,
          3,
          0.1,
          0.03,
          0.3,
          "Engineering Toolbox (LHV C2H2 = 48.2 TJ/Gg) & BC Gov PSO Methodology (EF CO2 = 3.385 tCO2/t C2H2)"
        ],
        [
          "Khí tự nhiên (CH4)",
          "Khí tự nhiên (Natural Gas)",
          "Kg",
          1,
          48,
          46.5,
          50.4,
          1.2,
          56100,
          54300,
          58300,
          1,
          0.3,
          3,
          0.1,
          0.03,
          0.3,
          "V2_1_Ch1 Table 1.2 (tr.19 PDF) & V2_2_Ch2 Table 2.3 (tr.18 PDF)"
        ],
        [
          "Biomass",
          "Sinh khối rắn: Củi, trấu, vỏ điều (Wood/Wood Waste)",
          "Kg",
          1,
          15.6,
          7.9,
          31,
          7.7,
          112000,
          95000,
          132000,
          30,
          10,
          100,
          4,
          1.5,
          15,
          "V2_1_Ch1 Table 1.2 (tr.19 PDF) & V2_2_Ch2 Table 2.3 (tr.19 PDF) - CO2 tính riêng vào CO2 sinh học"
        ],
        [
          "Bùn khô",
          "Bùn thải sấy khô đốt thu hồi nhiệt (Dried Sludge)",
          "Kg",
          1,
          11.6,
          5.9,
          23,
          5.7,
          100000,
          84700,
          117000,
          30,
          10,
          100,
          4,
          1.5,
          15,
          "V2_1_Ch1 Table 1.2 (Other Solid Biomass tr.19) & V5_5_Ch5_IOB Table 5.2, 5.5, 5.6 (tr.18-22 PDF)"
        ],
        [
          "LPG - Thương mại",
          "LPG dùng cho bếp ăn / văn phòng (Table 2.4 - 1A4a)",
          "Kg",
          1,
          47.3,
          44.8,
          52.2,
          2.45,
          63100,
          61600,
          65600,
          5,
          1.5,
          15,
          0.1,
          0.03,
          0.3,
          "V2_2_Ch2 Table 2.4 Commercial/Institutional (tr.20 PDF)"
        ],
        [
          "Dầu DO - Thương mại",
          "Dầu DO dùng cho thương mại/cơ quan (Table 2.4 - 1A4a)",
          "Lít",
          0.84,
          43,
          41.4,
          43.3,
          0.800000000000001,
          74100,
          72600,
          74800,
          10,
          3,
          30,
          0.6,
          0.2,
          2,
          "V2_2_Ch2 Table 2.4 Commercial/Institutional (tr.20 PDF)"
        ]
      ]
    },
    {
      "sheet": "TC_NHIEN_LIEU_VOL2",
      "title": "Đốt di động",
      "start": 21,
      "fields": [
        [
          "Mã nhiên liệu (Key)",
          false
        ],
        [
          "Tên nhiên liệu (Việt - Anh chuẩn IPCC Table 1.1)",
          false
        ],
        [
          "ĐVT gốc",
          false
        ],
        [
          "KLR mặc định (kg/ĐVT)",
          false
        ],
        [
          "NCV Mặc định (TJ/Gg)",
          false
        ],
        [
          "NCV Lower (TJ/Gg)",
          false
        ],
        [
          "NCV Upper (TJ/Gg)",
          false
        ],
        [
          "ĐKĐBĐ chuẩn u(NCV)",
          false
        ],
        [
          "EF CO2 Mặc định (kg/TJ)",
          false
        ],
        [
          "EF CO2 Lower (kg/TJ)",
          false
        ],
        [
          "EF CO2 Upper (kg/TJ)",
          false
        ],
        [
          "EF CH4 Mặc định (kg/TJ)",
          false
        ],
        [
          "EF CH4 Lower (kg/TJ)",
          false
        ],
        [
          "EF CH4 Upper (kg/TJ)",
          false
        ],
        [
          "EF N2O Mặc định (kg/TJ)",
          false
        ],
        [
          "EF N2O Lower (kg/TJ)",
          false
        ],
        [
          "EF N2O Upper (kg/TJ)",
          false
        ],
        [
          "Nguồn trích dẫn chính xác (Tên File PDF, Bảng, Trang)",
          false
        ]
      ],
      "rows": [
        [
          "DO - Đường bộ",
          "Dầu DO giao thông đường bộ (Road Diesel)",
          "Lít",
          0.84,
          43,
          41.4,
          43.3,
          0.800000000000001,
          74100,
          72600,
          74800,
          3.9,
          1.6,
          9.5,
          3.9,
          1.3,
          12,
          "V2_3_Ch3_Mobile_Combustion.pdf – Table 3.2.1 (tr.16 PDF) & Table 3.2.2 (tr.21 PDF)"
        ],
        [
          "Xăng - Không kiểm soát",
          "Xăng đường bộ không kiểm soát (Motor Gasoline - Uncontrolled)",
          "Lít",
          0.745,
          44.3,
          42.5,
          44.8,
          0.899999999999999,
          69300,
          67500,
          73000,
          33,
          9.6,
          110,
          3.2,
          0.96,
          11,
          "V2_3_Ch3_Mobile_Combustion.pdf – Table 3.2.1 (tr.16 PDF) & Table 3.2.2 (tr.21 PDF)"
        ],
        [
          "Xăng - Xúc tác oxy hóa",
          "Xăng đường bộ có bầu xúc tác (Motor Gasoline - Oxidation Catalyst)",
          "Lít",
          0.745,
          44.3,
          42.5,
          44.8,
          0.899999999999999,
          69300,
          67500,
          73000,
          25,
          7.5,
          86,
          8,
          2.6,
          24,
          "V2_3_Ch3_Mobile_Combustion.pdf – Table 3.2.1 (tr.16 PDF) & Table 3.2.2 (tr.21 PDF)"
        ],
        [
          "Xăng - Xe con đời mới",
          "Xăng xe con từ 1995 trở về sau (Low Mileage LDV >=1995)",
          "Lít",
          0.745,
          44.3,
          42.5,
          44.8,
          0.899999999999999,
          69300,
          67500,
          73000,
          3.8,
          1.1,
          13,
          5.7,
          1.9,
          17,
          "V2_3_Ch3_Mobile_Combustion.pdf – Table 3.2.1 (tr.16 PDF) & Table 3.2.2 (tr.21 PDF)"
        ],
        [
          "DO - Máy móc công nghiệp",
          "Dầu DO xe nâng, máy công trình nội bộ (Off-road Industry Diesel)",
          "Lít",
          0.84,
          43,
          41.4,
          43.3,
          0.800000000000001,
          74100,
          72600,
          74800,
          4.15,
          1.66,
          10.4,
          28.6,
          14.3,
          85.8,
          "V2_3_Ch3_Mobile_Combustion.pdf – Table 3.3.1 Off-road Industry (tr.36 PDF)"
        ],
        [
          "Xăng 4 kỳ - Máy cắt cỏ/PCCC",
          "Xăng máy cắt cỏ, bơm PCCC 4 kỳ (Off-road Industry Gasoline 4-stroke)",
          "Lít",
          0.745,
          44.3,
          42.5,
          44.8,
          0.899999999999999,
          69300,
          67500,
          73000,
          50,
          20,
          125,
          2,
          1,
          6,
          "V2_3_Ch3_Mobile_Combustion.pdf – Table 3.3.1 Off-road Industry (tr.36 PDF)"
        ],
        [
          "Xăng 2 kỳ - Máy cắt cỏ",
          "Xăng máy cắt cỏ 2 kỳ (Off-road Industry Gasoline 2-stroke)",
          "Lít",
          0.745,
          44.3,
          42.5,
          44.8,
          0.899999999999999,
          69300,
          67500,
          73000,
          130,
          52,
          325,
          0.4,
          0.2,
          1.2,
          "V2_3_Ch3_Mobile_Combustion.pdf – Table 3.3.1 Off-road Industry (tr.36 PDF)"
        ]
      ]
    }
  ],
  "gases": [
    {
      "sheet": "TC_GWP_MOI_CHAT_VOL3",
      "title": "GWP-100",
      "start": 7,
      "fields": [
        [
          "Mã khí / Môi chất (Key)",
          false
        ],
        [
          "Tên hóa học / Ký hiệu ASHRAE",
          false
        ],
        [
          "Công thức hóa học",
          false
        ],
        [
          "GWP-100 AR4 (2007)",
          false
        ],
        [
          "GWP-100 AR5 (2014)",
          false
        ],
        [
          "GWP-100 AR6 (2021)",
          false
        ],
        [
          "Nửa khoảng 90% CI (± AR6)",
          false
        ],
        [
          "ĐKĐBĐ chuẩn u(GWP)",
          false
        ],
        [
          "ĐKĐBĐ tương đối %u(GWP)",
          true
        ],
        [
          "Phương pháp xác định u(GWP)",
          false
        ],
        [
          "Nguồn trích dẫn chính xác (File PDF, Bảng, Trang)",
          false
        ]
      ],
      "rows": [
        [
          "CO2",
          "Carbon dioxide (CO2)",
          "CO2",
          1,
          1,
          1,
          0,
          0,
          0,
          "Bằng 0 theo định nghĩa chuẩn",
          "3.7 IPCC_AR6_WGI_Chapter07.pdf – Table 7.15 (trang 95 PDF / 1017 báo cáo)"
        ],
        [
          "CH4-fossil",
          "Methane - Nguồn hóa thạch (CH4-fossil)",
          "CH4",
          25,
          30,
          29.8,
          11,
          5.5,
          0.184563758389262,
          "Lấy ±11 / 2 từ Table 7.15 AR6",
          "3.7 IPCC_AR6_WGI_Chapter07.pdf – Table 7.15 (trang 95 PDF - dòng 'CH4-fossil Nguồn hóa thạch')"
        ],
        [
          "CH4-non fossil",
          "Methane - Nguồn sinh học/nước thải (CH4-non fossil)",
          "CH4",
          25,
          28,
          27,
          11,
          5.5,
          0.203703703703704,
          "Lấy ±11 / 2 từ Table 7.15 AR6",
          "3.7 IPCC_AR6_WGI_Chapter07.pdf – Table 7.15 (trang 95 PDF - dòng 'CH4-non fossil Không hóa thạch')"
        ],
        [
          "N2O",
          "Nitrous oxide (N2O)",
          "N2O",
          298,
          265,
          273,
          130,
          65,
          0.238095238095238,
          "Lấy ±130 / 2 từ Table 7.15 AR6",
          "3.7 IPCC_AR6_WGI_Chapter07.pdf – Table 7.15 (trang 95 PDF) & SM Table 7.SM.9 (trang 28 PDF)"
        ],
        [
          "HFC-32",
          "Difluoromethane (R-32 / HFC-32)",
          "CH2F2",
          675,
          677,
          771,
          292,
          146,
          0.189364461738003,
          "Lấy ±292 / 2 (38%) từ Table 7.15 & 7.SM.13",
          "3.7 IPCC_AR6_WGI_Chapter07.pdf – Table 7.15 (trang 95 PDF) & SM Table 7.SM.7 (tr.17), 7.SM.13 (tr.29)"
        ],
        [
          "HFC-125",
          "Pentafluoroethane (R-125 / HFC-125)",
          "CHF2CF3",
          3500,
          3170,
          3740,
          0,
          286.181760425084,
          0.0765191872794341,
          "Độ lệch chuẩn STDEV(AR4, AR5, AR6)",
          "IPCC_AR6_WGI_Chapter07_SM.pdf – Table 7.SM.7 (tr.17 PDF) & GHG Protocol 2016 (tr.2 PDF)"
        ],
        [
          "HCFC-22",
          "Chlorodifluoromethane (R-22 / HCFC-22)",
          "CHClF2",
          1810,
          1760,
          1960,
          0,
          104.083299973307,
          0.0531037244761769,
          "Độ lệch chuẩn STDEV(AR4, AR5, AR6)",
          "IPCC_AR6_WGI_Chapter07_SM.pdf – Table 7.SM.7 (tr.16 PDF) & GHG Protocol 2016 (tr.2 PDF)"
        ],
        [
          "HFC-134a",
          "1,1,1,2-Tetrafluoroethane (R-134a / HFC-134a)",
          "CH2FCF3",
          1430,
          1300,
          1530,
          581,
          290.5,
          0.189869281045752,
          "Lấy ±581 / 2 (38%) từ Table 7.15 & 7.SM.12",
          "3.7 IPCC_AR6_WGI_Chapter07.pdf – Table 7.15 (tr.95 PDF) & SM Table 7.SM.12 (tr.29 PDF)"
        ],
        [
          "HFC-143a",
          "1,1,1-Trifluoroethane (R-143a / HFC-143a)",
          "CH3CF3",
          4470,
          4800,
          5810,
          0,
          698.164259564562,
          0.120165965501646,
          "Độ lệch chuẩn STDEV(AR4, AR5, AR6)",
          "IPCC_AR6_WGI_Chapter07_SM.pdf – Table 7.SM.7 (tr.17 PDF) & GHG Protocol 2016 (tr.2 PDF)"
        ],
        [
          "HFC-227ea",
          "1,1,1,2,3,3,3-Heptafluoropropane (FM-200 / HFC-227ea)",
          "CF3CHFCF3",
          3220,
          3350,
          3600,
          0,
          193.13207915828,
          0.0536477997661888,
          "Độ lệch chuẩn STDEV(AR4, AR5, AR6)",
          "IPCC_AR6_WGI_Chapter07_SM.pdf – Table 7.SM.7 (tr.17 PDF) & GHG Protocol 2016 (tr.2 PDF)"
        ]
      ]
    },
    {
      "sheet": "TC_GWP_MOI_CHAT_VOL3",
      "title": "Môi chất và thành phần",
      "start": 21,
      "fields": [
        [
          "Mã môi chất lạnh",
          false
        ],
        [
          "Đơn chất 1",
          false
        ],
        [
          "Tỷ lệ 1",
          true
        ],
        [
          "GWP 1",
          false
        ],
        [
          "u(GWP 1)",
          false
        ],
        [
          "Đơn chất 2",
          false
        ],
        [
          "Tỷ lệ 2",
          true
        ],
        [
          "GWP 2",
          false
        ],
        [
          "u(GWP 2)",
          false
        ],
        [
          "Đơn chất 3",
          false
        ],
        [
          "Tỷ lệ 3",
          true
        ],
        [
          "GWP 3",
          false
        ],
        [
          "u(GWP 3)",
          false
        ],
        [
          "GWP Hỗn hợp (AR6)",
          false
        ],
        [
          "u(GWP) Không trọng số (Theo file gốc)",
          false
        ],
        [
          "u(GWP) Có trọng số chuẩn",
          false
        ],
        [
          "Nguồn trích dẫn chính xác (File PDF, Bảng, Trang)",
          false
        ]
      ],
      "rows": [
        [
          "R410A",
          "HFC-32",
          0.5,
          771,
          146,
          "HFC-125",
          0.5,
          3740,
          286.181760425084,
          "Không",
          0,
          0,
          0,
          2255.5,
          321.27247003128,
          160.63623501564,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.8 (trang 44 PDF / 7.44): R-410A = 50% HFC-32 + 50% HFC-125"
        ],
        [
          "R32",
          "HFC-32",
          1,
          771,
          146,
          "Không",
          0,
          0,
          0,
          "Không",
          0,
          0,
          0,
          771,
          146,
          146,
          "3.7 IPCC_AR6_WGI_Chapter07.pdf – Table 7.15 (trang 95 PDF): Đơn chất HFC-32 (100%)"
        ],
        [
          "R22",
          "HCFC-22",
          1,
          1960,
          104.083299973307,
          "Không",
          0,
          0,
          0,
          "Không",
          0,
          0,
          0,
          1960,
          104.083299973307,
          104.083299973307,
          "IPCC_AR6_WGI_Chapter07_SM.pdf – Table 7.SM.7 (trang 16 PDF): Đơn chất HCFC-22 (100%)"
        ],
        [
          "R134a",
          "HFC-134a",
          1,
          1530,
          290.5,
          "Không",
          0,
          0,
          0,
          "Không",
          0,
          0,
          0,
          1530,
          290.5,
          290.5,
          "3.7 IPCC_AR6_WGI_Chapter07.pdf – Table 7.15 (trang 95 PDF): Đơn chất HFC-134a (100%)"
        ],
        [
          "R404A",
          "HFC-125",
          0.44,
          3740,
          286.181760425084,
          "HFC-143a",
          0.52,
          5810,
          698.164259564562,
          "HFC-134a",
          0.04,
          1530,
          290.5,
          4728,
          808.531745408511,
          384.438340613073,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.8 (trang 44 PDF): R-404A = 44% HFC-125 + 52% HFC-143a + 4% HFC-134a"
        ],
        [
          "R407C",
          "HFC-32",
          0.23,
          771,
          146,
          "HFC-125",
          0.25,
          3740,
          286.181760425084,
          "HFC-134a",
          0.52,
          1530,
          290.5,
          1907.93,
          433.135371448696,
          170.486040484258,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.8 (trang 44 PDF): R-407C = 23% HFC-32 + 25% HFC-125 + 52% HFC-134a"
        ],
        [
          "R507A",
          "HFC-125",
          0.5,
          3740,
          286.181760425084,
          "HFC-143a",
          0.5,
          5810,
          698.164259564562,
          "Không",
          0,
          0,
          0,
          4775,
          754.541803569115,
          377.270901784558,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.8 (trang 44 PDF): R-507A = 50% HFC-125 + 50% HFC-143a"
        ]
      ]
    },
    {
      "sheet": "TC_GWP_MOI_CHAT_VOL3",
      "title": "Tỷ lệ rò rỉ và PCCC",
      "start": 32,
      "fields": [
        [
          "Nhóm thiết bị lạnh / PCCC",
          false
        ],
        [
          "Tên tiếng Anh chuẩn (IPCC Table 7.9)",
          false
        ],
        [
          "Lượng nạp điển hình M (kg) - Min",
          false
        ],
        [
          "Lượng nạp điển hình M (kg) - Max",
          false
        ],
        [
          "Tuổi thọ trung bình (năm)",
          false
        ],
        [
          "Rò rỉ vận hành hàng năm x (%) - Min",
          true
        ],
        [
          "Rò rỉ vận hành hàng năm x (%) - Max",
          true
        ],
        [
          "Hệ số rò rỉ khuyến nghị trung bình (%/năm)",
          true
        ],
        [
          "Nguồn trích dẫn chính xác (File PDF, Bảng, Trang)",
          false
        ]
      ],
      "rows": [
        [
          "Tủ lạnh gia dụng",
          "Domestic Refrigeration",
          0.05,
          0.5,
          15,
          0.001,
          0.005,
          0.003,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.9 (trang 52 PDF / 7.52)"
        ],
        [
          "Tủ mát / Tủ đông thương mại độc lập",
          "Stand-alone Commercial Applications",
          0.2,
          6,
          12,
          0.01,
          0.15,
          0.08,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.9 (trang 52 PDF / 7.52)"
        ],
        [
          "Hệ thống lạnh công nghiệp / Kho lạnh",
          "Industrial Refrigeration (food processing, cold storage)",
          10,
          10000,
          20,
          0.07,
          0.25,
          0.16,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.9 (trang 52 PDF / 7.52)"
        ],
        [
          "Hệ thống làm lạnh nước Chiller",
          "Chillers",
          10,
          2000,
          20,
          0.02,
          0.15,
          0.085,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.9 (trang 52 PDF / 7.52)"
        ],
        [
          "Điều hòa không khí dân dụng & văn phòng",
          "Residential and Commercial A/C, including Heat Pumps",
          0.5,
          100,
          15,
          0.01,
          0.1,
          0.055,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.9 (trang 52 PDF / 7.52)"
        ],
        [
          "Điều hòa ô tô / Phương tiện vận tải",
          "Mobile Air Conditioning (MAC)",
          0.5,
          1.5,
          12,
          0.1,
          0.2,
          0.15,
          "V3_7_Ch7_ODS_Substitutes.pdf – Table 7.9 (trang 52 PDF / 7.52)"
        ],
        [
          "Hệ số rò rỉ tổng hợp Bậc 1 (Tier 1a/b)",
          "Composite Default Emission Factor (Tier 1)",
          0.5,
          1000,
          15,
          0.15,
          0.15,
          0.15,
          "V3_7_Ch7_ODS_Substitutes.pdf – Mục 7.5.2.1 (trang 45, 47, 51 PDF)"
        ],
        [
          "Hệ thống chữa cháy cố định dùng khí HFC/PFC",
          "Fixed Fire Protection Equipment (FM-200 / HFC-227ea)",
          5,
          500,
          20,
          0.01,
          0.03,
          0.02,
          "V3_7_Ch7_ODS_Substitutes.pdf – Mục 7.6.2.1, Equation 7.17 (trang 61, 63 PDF: 2% ± 1%/năm)"
        ]
      ]
    }
  ],
  "other": [
    {
      "sheet": "TC_URE_NUOC_THAI_VOL4_5",
      "title": "Nước thải và phân bón",
      "start": 7,
      "fields": [
        [
          "Mã thông số (Key)",
          false
        ],
        [
          "Tên thông số & Hệ thống áp dụng",
          false
        ],
        [
          "Đơn vị tính",
          false
        ],
        [
          "Giá trị mặc định",
          false
        ],
        [
          "Khoảng 95% CI (±% hoặc Min-Max)",
          true
        ],
        [
          "ĐKĐBĐ chuẩn tương đối (%u)",
          true
        ],
        [
          "Công thức áp dụng trong IPCC 2006",
          false
        ],
        [
          "Nguồn trích dẫn chính xác (File PDF, Bảng, Trang)",
          false
        ]
      ],
      "rows": [
        [
          "BOD_ASIA",
          "Hệ số phát sinh BOD5 nước thải sinh hoạt (Khu vực Châu Á / Việt Nam)",
          "g BOD/người/ngày",
          40,
          0.3,
          0.15,
          "Equation 6.3 (TOW = P * BOD * 0.001 * 365)",
          "V5_6_Ch6_Wastewater.pdf – Table 6.4 (trang 14 PDF / 6.14) & Table 6.7 (trang 17 PDF: ±30%)"
        ],
        [
          "BO_DOMESTIC",
          "Khả năng sản sinh CH4 tối đa của nước thải sinh hoạt (Bo theo BOD)",
          "kg CH4/kg BOD",
          0.6,
          0.3,
          0.15,
          "Equation 6.2 (EF = Bo * MCF)",
          "V5_6_Ch6_Wastewater.pdf – Table 6.2 (trang 12 PDF / 6.12) & Table 6.7 (trang 17 PDF: ±30%)"
        ],
        [
          "MCF_SEPTIC",
          "Hệ số hiệu chỉnh mêtan MCF - Bể tự hoại / Bể phốt (Septic system)",
          "Hệ số",
          0.5,
          0.1,
          0.05,
          "Equation 6.2 (EF = 0.6 * 0.5 = 0.30 kg CH4/kg BOD)",
          "V5_6_Ch6_Wastewater.pdf – Table 6.3 (trang 13 PDF / 6.13) & Table 6.7 (trang 17 PDF: ±10%)"
        ],
        [
          "MCF_AEROBIC_GOOD",
          "Hệ số MCF - Trạm xử lý nước thải hiếu khí tập trung vận hành tốt",
          "Hệ số",
          0,
          0.1,
          0.05,
          "Equation 6.2 & Equation 6.5 (EF = 0 khi MCF = 0)",
          "V5_6_Ch6_Wastewater.pdf – Table 6.3 (trang 13 PDF) & Table 6.8 (trang 21 PDF: 0.0 [0 - 0.1])"
        ],
        [
          "MCF_AEROBIC_OVER",
          "Hệ số MCF - Trạm xử lý hiếu khí quá tải / vận hành chưa tốt",
          "Hệ số",
          0.3,
          0.3,
          0.15,
          "Equation 6.2 & Equation 6.5",
          "V5_6_Ch6_Wastewater.pdf – Table 6.3 (trang 13 PDF) & Table 6.8 (trang 21 PDF: 0.3 [0.2 - 0.4])"
        ],
        [
          "MCF_ANAEROBIC_REACTOR",
          "Hệ số MCF - Bể phản ứng kỵ khí UASB / Anaerobic Reactor",
          "Hệ số",
          0.8,
          0.1,
          0.05,
          "Equation 6.5 (EF = Bo * MCF)",
          "V5_6_Ch6_Wastewater.pdf – Table 6.3 (trang 13 PDF) & Table 6.8 (trang 21 PDF: 0.8 [0.8 - 1.0])"
        ],
        [
          "BO_INDUSTRIAL",
          "Khả năng sản sinh CH4 tối đa của nước thải công nghiệp (Bo theo COD)",
          "kg CH4/kg COD",
          0.25,
          0.3,
          0.15,
          "Equation 6.5 (EF = Bo * MCF theo kg COD)",
          "V5_6_Ch6_Wastewater.pdf – Mục 6.2.3.2 (trang 20 PDF / 6.20) & Table 6.10 (trang 23 PDF: ±30%)"
        ],
        [
          "EF_EFFLUENT_N2O",
          "Hệ số phát thải N2O từ Nitơ trong nước thải xả ra nguồn tiếp nhận",
          "kg N2O-N/kg N",
          0.005,
          0.5,
          0.25,
          "Equation 6.7 (N2O = N_effluent * EF * 44/28)",
          "V5_6_Ch6_Wastewater.pdf – Table 6.11 (trang 27 PDF / 6.27: 0.005 [0.0005 - 0.25])"
        ],
        [
          "U_POPULATION",
          "Độ không đảm bảo đo số liệu nhân sự / dân số (P) tại cơ sở",
          "Tỷ lệ",
          1,
          0.05,
          0.025,
          "Table 6.7 (ĐKĐBĐ của P = ±5%)",
          "V5_6_Ch6_Wastewater.pdf – Table 6.7 (trang 17 PDF / 6.17: Human population P = ±5%)"
        ],
        [
          "EF_UREA_C",
          "Hệ số phát thải CO2-C từ sử dụng phân bón Urê CO(NH2)2",
          "tấn C/tấn Urê",
          0.2,
          0.5,
          0.25,
          "Equation 11.13 (CO2 = M * 0.20 * 44/12)",
          "V4_11_Ch11_N2O&CO2.pdf – Mục 11.4.1, Equation 11.13 (trang 32 PDF / 11.32: EF = 0.20, ĐKĐBĐ -50%)"
        ],
        [
          "CONV_C_TO_CO2",
          "Hệ số chuyển đổi khối lượng phân tử từ C sang CO2 (44/12)",
          "tấn CO2/tấn C",
          3.66666666666667,
          0,
          0,
          "Equation 11.13 Step 3 (nhân 44/12 = 3.6667)",
          "V4_11_Ch11_N2O&CO2.pdf – Mục 11.4.1 Step 3 (trang 32 PDF / 11.32)"
        ],
        [
          "EF_UREA_CO2",
          "Hệ số phát thải CO2 trực tiếp tính trên 1 tấn phân Urê (0.20 * 44/12)",
          "tấn CO2/tấn Urê",
          0.733333333333333,
          0.5,
          0.25,
          "Equation 11.13 (E_CO2 = M_Urea * 0.7333)",
          "V4_11_Ch11_N2O&CO2.pdf – Mục 11.4.1, Equation 11.13 (trang 32 PDF / 11.32)"
        ],
        [
          "EF1_SOIL_N2O",
          "Hệ số phát thải N2O trực tiếp từ đất khi bón phân đạm tổng hợp (EF1)",
          "kg N2O-N/kg N",
          0.01,
          0.5,
          0.25,
          "Equation 11.1 (N2O = F_SN * EF1 * 44/28)",
          "V4_11_Ch11_N2O&CO2.pdf – Mục 11.2.1, Table 11.1 (trang 11 PDF / 11.11: 0.01 [0.003 - 0.03])"
        ],
        [
          "EF_LIMESTONE_C",
          "Hệ số phát thải CO2-C khi bón đá vôi cải tạo đất (CaCO3)",
          "tấn C/tấn đá vôi",
          0.12,
          0.5,
          0.25,
          "Equation 11.12 (CO2 = M_Lime * 0.12 * 44/12)",
          "V4_11_Ch11_N2O&CO2.pdf – Mục 11.3.1, Equation 11.12 (trang 27 PDF / 11.27)"
        ]
      ]
    }
  ],
  "grid": [
    {
      "sheet": "TC_URE_NUOC_THAI_VOL4_5",
      "title": "Hệ số điện và độ không đảm bảo",
      "start": 25,
      "fields": [
        [
          "Mã năm / Chỉ tiêu",
          false
        ],
        [
          "Nội dung chỉ tiêu",
          false
        ],
        [
          "Đơn vị tính",
          false
        ],
        [
          "Giá trị Hệ số phát thải lưới điện",
          false
        ],
        [
          "Sai số đồng hồ đo điện (%U, k=2)",
          true
        ],
        [
          "ĐKĐBĐ chuẩn đồng hồ điện (%u = U/2)",
          true
        ],
        [
          "Phương pháp tính / Áp dụng",
          false
        ],
        [
          "Nguồn trích dẫn pháp lý",
          false
        ]
      ],
      "rows": [
        [
          "GRID_2021",
          "Hệ số phát thải lưới điện Việt Nam năm 2021",
          "tCO2/MWh",
          0.7221,
          0.002,
          0.001,
          "Chuỗi dữ liệu lịch sử tính SD",
          "Công bố của Cục Biến đổi khí hậu – Bộ Tài nguyên và Môi trường (2021)"
        ],
        [
          "GRID_2022",
          "Hệ số phát thải lưới điện Việt Nam năm 2022",
          "tCO2/MWh",
          0.6766,
          0.002,
          0.001,
          "Chuỗi dữ liệu lịch sử tính SD",
          "Công bố của Cục Biến đổi khí hậu – Bộ Tài nguyên và Môi trường (2022)"
        ],
        [
          "GRID_2023",
          "Hệ số phát thải lưới điện Việt Nam năm 2023",
          "tCO2/MWh",
          0.6592,
          0.002,
          0.001,
          "Chuỗi dữ liệu lịch sử tính SD",
          "Công bố của Cục Biến đổi khí hậu – Bộ Tài nguyên và Môi trường (2023)"
        ],
        [
          "GRID_2024",
          "Hệ số phát thải lưới điện Việt Nam năm 2024 (Mới nhất áp dụng)",
          "tCO2/MWh",
          0.6187,
          0.002,
          0.001,
          "Áp dụng tính phát thải Phạm vi 2",
          "Công bố của Cục Biến đổi khí hậu – Bộ Tài nguyên và Môi trường (2024)"
        ],
        [
          "GRID_SD",
          "Độ lệch chuẩn (SD) của hệ số phát thải lưới điện giai đoạn 2021–2024",
          "tCO2/MWh",
          0.0428307132791412,
          0.002,
          0.0692269488914517,
          "Ô F29 = %u(EF điện) = SD / EF_2024",
          "Tính theo phương pháp thống kê chuỗi thời gian (bảng 4 sheet II - DIEN)"
        ]
      ]
    }
  ]
};
