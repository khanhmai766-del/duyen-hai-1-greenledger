'use strict';

const publishedInventory2025 = {
  "period": {
    "id": "duyen-hai-2025",
    "year": 2025,
    "facility": "Nhà Máy Nhiệt Điện Duyên Hải 1",
    "gwp": "ar6",
    "weighted": true,
    "rows": [
      {
        "id": "duyen-hai-2025-1",
        "name": "Nhiên Liệu Than",
        "group": 0,
        "factor": "Atracite 2025",
        "amount": 2908419146.5,
        "mode": "annual",
        "months": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "ad": 0.16,
        "nitrogen": 0.02,
        "cod": 0.1,
        "nU": 0,
        "codU": 0,
        "mcf": "MCF_SEPTIC",
        "includeCH4": false,
        "adHalfWidth": 0.32
      },
      {
        "id": "duyen-hai-2025-2",
        "name": "Dầu DO",
        "group": 0,
        "factor": "DO_STAT",
        "amount": 50000,
        "mode": "annual",
        "months": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "ad": 0.2886751345948129,
        "nitrogen": 0.02,
        "cod": 0.1,
        "nU": 0,
        "codU": 0,
        "mcf": "MCF_SEPTIC",
        "includeCH4": false
      },
      {
        "id": "duyen-hai-2025-3",
        "name": "Xăng",
        "group": 0,
        "factor": "GAS_STAT",
        "amount": 34000,
        "mode": "annual",
        "months": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "ad": 0.2886751345948129,
        "nitrogen": 0.02,
        "cod": 0.1,
        "nU": 0,
        "codU": 0,
        "mcf": "MCF_SEPTIC",
        "includeCH4": false
      },
      {
        "id": "duyen-hai-2025-4",
        "name": "Khí LPG",
        "group": 0,
        "factor": "IPCC22_LPG",
        "amount": 15000,
        "mode": "annual",
        "months": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "ad": 0.2886751345948129,
        "nitrogen": 0.02,
        "cod": 0.1,
        "nU": 0,
        "codU": 0,
        "mcf": "MCF_SEPTIC",
        "includeCH4": false
      },
      {
        "id": "duyen-hai-2025-5",
        "name": "Xăng vận chuyển đường bộ",
        "group": 1,
        "factor": "GAS_UNCTRL",
        "amount": 30000,
        "mode": "annual",
        "months": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "ad": 0.2886751345948129,
        "nitrogen": 0.02,
        "cod": 0.1,
        "nU": 0,
        "codU": 0,
        "mcf": "MCF_SEPTIC",
        "includeCH4": false
      },
      {
        "id": "duyen-hai-2025-6",
        "name": "Phát thải sinh hoạt",
        "group": 2,
        "factor": "",
        "amount": 3960000,
        "mode": "annual",
        "months": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "ad": 0,
        "nitrogen": 0.02,
        "cod": 0.1,
        "nU": 0,
        "codU": 0,
        "mcf": "MCF_SEPTIC",
        "includeCH4": false,
        "personUncertain": true
      },
      {
        "id": "duyen-hai-2025-7",
        "name": "Nguồn phát thải mới",
        "group": 4,
        "factor": "HFC_134A",
        "amount": 70,
        "mode": "annual",
        "months": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "ad": 0.2886751345948129,
        "nitrogen": 0.02,
        "cod": 0.1,
        "nU": 0,
        "codU": 0,
        "mcf": "MCF_SEPTIC",
        "includeCH4": false
      },
      {
        "id": "duyen-hai-2025-8",
        "name": "Nguồn phát thải mới",
        "group": 4,
        "factor": "R410A",
        "amount": 300,
        "mode": "annual",
        "months": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "ad": 0.2886751345948129,
        "nitrogen": 0.02,
        "cod": 0.1,
        "nU": 0,
        "codU": 0,
        "mcf": "MCF_SEPTIC",
        "includeCH4": false
      },
      {
        "id": "duyen-hai-2025-9",
        "name": "Nguồn phát thải mới",
        "group": 7,
        "factor": "GRID_2024",
        "amount": 2900233,
        "mode": "annual",
        "months": [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
        ],
        "ad": 0.1,
        "nitrogen": 0.02,
        "cod": 0.1,
        "nU": 0,
        "codU": 0,
        "mcf": "MCF_SEPTIC",
        "includeCH4": false
      }
    ]
  },
  "fuels": [
    {
      "id": "DO_STAT",
      "name": "Dầu DO · Gas/Diesel Oil",
      "unit": "Lít",
      "density": 0.84,
      "ncv": [
        43,
        41.4,
        43.3
      ],
      "co2": [
        74100,
        72600,
        74800
      ],
      "ch4": [
        3,
        1,
        10
      ],
      "n2o": [
        0.6,
        0.2,
        2
      ],
      "bio": false,
      "type": "stationary",
      "source": "IPCC 2006 V2 Ch.1 Table 1.2 (tr.18–19), Ch.2 Table 2.3 (tr.18–19)"
    },
    {
      "id": "GAS_STAT",
      "name": "Xăng động cơ",
      "unit": "Lít",
      "density": 0.745,
      "ncv": [
        44.3,
        42.5,
        44.8
      ],
      "co2": [
        69300,
        67500,
        73000
      ],
      "ch4": [
        3,
        1,
        10
      ],
      "n2o": [
        0.6,
        0.2,
        2
      ],
      "bio": false,
      "type": "stationary",
      "source": "IPCC 2006 V2 Ch.1 Table 1.2 (tr.18–19), Ch.2 Table 2.3 (tr.18–19)"
    },
    {
      "id": "GAS_UNCTRL",
      "name": "Xăng đường bộ · Không kiểm soát",
      "unit": "Lít",
      "density": 0.745,
      "ncv": [
        44.3,
        42.5,
        44.8
      ],
      "co2": [
        69300,
        67500,
        73000
      ],
      "ch4": [
        33,
        9.6,
        110
      ],
      "n2o": [
        3.2,
        0.96,
        11
      ],
      "bio": false,
      "type": "mobile",
      "source": "IPCC 2006 V2 Ch.3 Tables 3.2.1/3.2.2 (tr.16/21); off-road Table 3.3.1 (tr.36)"
    },
    {
      "id": "IPCC22_LPG",
      "name": "Khí hóa lỏng LPG · Liquefied Petroleum Gases",
      "ncv": [
        47.3,
        44.8,
        52.2
      ],
      "co2": [
        63100,
        61600,
        65600
      ],
      "ch4": [
        1,
        0.3,
        3
      ],
      "n2o": [
        0.1,
        0.03,
        0.3
      ],
      "density": 1,
      "unit": "Kg",
      "type": "stationary",
      "bio": false,
      "source": "IPCC 2006, Quyển 2: Bảng 1.2 (tr.18 PDF), Bảng 2.2 đốt cố định ngành năng lượng (tr.16 PDF). Số liệu hoạt động nhập theo kg."
    },
    {
      "id": "Atracite 2025",
      "name": "Than Atracite DH1 2025",
      "type": "stationary",
      "unit": "Kg",
      "density": 1,
      "ncv": [
        19.3,
        18.1,
        20.5
      ],
      "co2": [
        98300,
        94600,
        101000
      ],
      "ch4": [
        1,
        0.3,
        3
      ],
      "n2o": [
        1.5,
        0.5,
        5
      ],
      "bio": false,
      "source": "Tính toán từ phòng LAB DH1"
    }
  ],
  "gases": [
    {
      "id": "CO2",
      "name": "Carbon dioxide",
      "ar4": 1,
      "ar5": 1,
      "ar6": 1,
      "u": 0,
      "mix": [],
      "source": "IPCC AR6 WGI Ch.7 Table 7.15 (tr.95); SM Table 7.SM.7; hỗn hợp: IPCC 2006 V3 Ch.7 Table 7.8 (tr.44). Giá trị khởi tạo theo file yêu cầu."
    },
    {
      "id": "CH4_FOSSIL",
      "name": "Methane hóa thạch",
      "ar4": 25,
      "ar5": 30,
      "ar6": 29.8,
      "u": 5.5,
      "mix": [],
      "source": "IPCC AR6 WGI Ch.7 Table 7.15 (tr.95); SM Table 7.SM.7; hỗn hợp: IPCC 2006 V3 Ch.7 Table 7.8 (tr.44). Giá trị khởi tạo theo file yêu cầu."
    },
    {
      "id": "CH4_BIO",
      "name": "Methane sinh học",
      "ar4": 25,
      "ar5": 28,
      "ar6": 27,
      "u": 5.5,
      "mix": [],
      "source": "IPCC AR6 WGI Ch.7 Table 7.15 (tr.95); SM Table 7.SM.7; hỗn hợp: IPCC 2006 V3 Ch.7 Table 7.8 (tr.44). Giá trị khởi tạo theo file yêu cầu."
    },
    {
      "id": "N2O",
      "name": "Nitrous oxide",
      "ar4": 298,
      "ar5": 265,
      "ar6": 273,
      "u": 65,
      "mix": [],
      "source": "IPCC AR6 WGI Ch.7 Table 7.15 (tr.95); SM Table 7.SM.7; hỗn hợp: IPCC 2006 V3 Ch.7 Table 7.8 (tr.44). Giá trị khởi tạo theo file yêu cầu."
    },
    {
      "id": "HFC_32",
      "name": "R-32",
      "ar4": 675,
      "ar5": 677,
      "ar6": 771,
      "u": 146,
      "mix": [],
      "source": "IPCC AR6 WGI Ch.7 Table 7.15 (tr.95); SM Table 7.SM.7; hỗn hợp: IPCC 2006 V3 Ch.7 Table 7.8 (tr.44). Giá trị khởi tạo theo file yêu cầu."
    },
    {
      "id": "HFC_125",
      "name": "R-125",
      "ar4": 3500,
      "ar5": 3170,
      "ar6": 3740,
      "u": 286.18,
      "mix": [],
      "source": "IPCC AR6 WGI Ch.7 Table 7.15 (tr.95); SM Table 7.SM.7; hỗn hợp: IPCC 2006 V3 Ch.7 Table 7.8 (tr.44). Giá trị khởi tạo theo file yêu cầu."
    },
    {
      "id": "HFC_134A",
      "name": "R-134a",
      "ar4": 1430,
      "ar5": 1300,
      "ar6": 1526,
      "u": 290.5,
      "mix": [],
      "source": "IPCC AR6 WGI Ch.7 Table 7.15 (tr.95); SM Table 7.SM.7; hỗn hợp: IPCC 2006 V3 Ch.7 Table 7.8 (tr.44). Giá trị khởi tạo theo file yêu cầu."
    },
    {
      "id": "R410A",
      "name": "R-410A",
      "ar4": 2087.5,
      "ar5": 1923.5,
      "ar6": 2255.5,
      "u": 321.27,
      "mix": [
        [
          "HFC_32",
          0.5
        ],
        [
          "HFC_125",
          0.5
        ]
      ],
      "source": "IPCC AR6 WGI Ch.7 Table 7.15 (tr.95); SM Table 7.SM.7; hỗn hợp: IPCC 2006 V3 Ch.7 Table 7.8 (tr.44). Giá trị khởi tạo theo file yêu cầu."
    }
  ],
  "other": [
    {
      "id": "BOD",
      "name": "BOD sinh hoạt",
      "value": 40,
      "u": 15,
      "unit": "g/người/ngày",
      "source": "IPCC V5 Ch.6 Table 6.4 tr.14; Table 6.7 tr.17"
    },
    {
      "id": "BO_DOM",
      "name": "Bo sinh hoạt",
      "value": 0.6,
      "u": 15,
      "unit": "kg CH₄/kg BOD",
      "source": "IPCC V5 Ch.6 Table 6.2 tr.12"
    },
    {
      "id": "MCF_SEPTIC",
      "name": "MCF bể tự hoại",
      "value": 0.5,
      "u": 5,
      "unit": "tỷ lệ",
      "source": "IPCC V5 Ch.6 Table 6.3 tr.13"
    },
    {
      "id": "PERSON",
      "name": "Nhân sự",
      "value": 1,
      "u": 2.5,
      "unit": "tỷ lệ",
      "source": "IPCC V5 Ch.6 Table 6.7 tr.17"
    }
  ],
  "grid": [
    {
      "id": "GRID_2021",
      "year": 2021,
      "value": 0.7221,
      "source": "Cục Biến đổi khí hậu; theo file yêu cầu, cần đối chiếu công bố năm"
    },
    {
      "id": "GRID_2022",
      "year": 2022,
      "value": 0.6766,
      "source": "Cục Biến đổi khí hậu; theo file yêu cầu, cần đối chiếu công bố năm"
    },
    {
      "id": "GRID_2023",
      "year": 2023,
      "value": 0.6592,
      "source": "Cục Biến đổi khí hậu; theo file yêu cầu, cần đối chiếu công bố năm"
    },
    {
      "id": "GRID_2024",
      "year": 2024,
      "value": 0.6187,
      "source": "Cục Biến đổi khí hậu; theo file yêu cầu, cần đối chiếu công bố năm"
    }
  ]
};
