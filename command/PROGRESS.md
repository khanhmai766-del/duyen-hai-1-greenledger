# Tiến độ · GreenLedger

## Giao diện Web

- Đã áp dụng Motion Prompt cho hộp thoại (#049), menu xổ xuống (#053) và gạch chân điều hướng (#086). Edge đã kiểm tra cả chín màn hình, mở và đóng menu bằng bàn phím, chế độ giảm chuyển động và giao diện ở 375 px. `node test.cjs` và `node test-accounts.mjs` đều đạt trên Web.

- Nền đăng nhập phát lặp 45 giây, ghép 15 giây đầu từ `DJI_0563.MP4`, `DJI_0481.MP4` và `6994564298914.MP4` theo thứ tự. Edge đã xác nhận phát tự động, chuyển đoạn và lặp, nút tạm dừng, chế độ giảm chuyển động và đăng nhập. `node test.cjs` và `node test-accounts.mjs` đều đạt.

- Đã đưa bộ sắp xếp lên cạnh nút đổi bố cục ở trang Tính toán và bỏ dòng phạm vi kết quả. `node test.cjs` đạt. Edge xác nhận vị trí trên màn hình rộng, sắp xếp, đổi sang Xem dọc và bố cục ở 360 px.

- **13/11/2026 · Hero Tổng quan.** Trang Tổng quan mở đầu bằng hero kiểu landing (`dist/overview-hero.js`, `dist/overview-hero.css`): tiêu đề Bricolage xen serif nghiêng, nền xanh sage, số liệu thật của kỳ đang mở, dải 4 bước dẫn tới Dữ liệu, Thư viện hệ số, Tính toán và Báo cáo. Bên phải nhúng mô hình 3D Sketchfab "Nhà Máy Nhiệt điện Duyên Hải Vĩnh Long" của 3DPLUS.vn, có dòng ghi nguồn và nút chuyển sang ảnh tĩnh. Khối `inventory-snapshot` cũ được thay bằng thẻ kết quả trong hero. Đã chạy `node test.cjs`, `node --check`, `node build-worker.mjs` (Worker có hai tệp mới). Đã kiểm tra trên Edge bằng máy chủ tĩnh cục bộ ở 1440, 1024 và 375 px: không tràn ngang, không lỗi console, re-render giữ iframe không tải lại, tắt/bật mô hình hoạt động. Chưa kiểm tra qua Worker có đăng nhập. Không dùng `autospin` vì tâm xoay của mô hình lệch làm mô hình trôi khỏi khung. Mô hình tải từ sketchfab.com nên cần mạng. Bản Desktop chưa áp dụng vì host chặn request ra ngoài.

- **13/11/2026 · Hero Tổng quan cho Desktop.** Chép `overview-hero.js/.css` sang `GreenLedger-Desktop/dist/` (giống bản Web; iframe thêm `sandbox`), gắn vào `dist/app.js` và `index.html`, bỏ khối `.kpis` cũ. `build.ps1` chép hai tệp mới và gọi `mountOverviewModel()` sau `restoreSplitScroll`. Host `GreenLedger.cs` chỉ cho một khung con là `https://sketchfab.com/models/bdc122add7754c989a976fdd5b01012d/embed` và chỉ cho tài nguyên `sketchfab.com`/`*.sketchfab.com` sau đăng nhập; mọi host khác vẫn bị chặn. Thêm tham số `GreenLedger.exe --data-dir <đường dẫn tuyệt đối>` để chạy hồ sơ thử. Đã chạy `node test.cjs` (đạt), mô phỏng 37 lệnh vá của `build.ps1` (khớp hết), dựng thử vào thư mục tạm (biên dịch app và bộ cài đạt, `node --check` trên `app/www/app.js` đạt). Chạy `GreenLedger.exe` bản dựng thử với hồ sơ thử, đăng nhập và đọc trạng thái qua cổng gỡ lỗi WebView2: hero hiện, khung Sketchfab tải xong, không tràn ngang, render lại giữ iframe. Dữ liệu thật ở `%LOCALAPPDATA%\GreenLedger` không bị ghi. Chưa cài bộ cài lên máy và chưa thay tệp trong `Ban-giao/`.
- **13/11/2026 · Bố cục hero ở độ rộng trung bình.** Breakpoint hero chuyển sang container query theo bề rộng `main`, không theo cửa sổ. Khi vùng nội dung hẹp hơn 1060 px, mô hình 3D nằm riêng trong luồng trang, dưới là dải bước và thẻ kết quả; hẹp hơn 640 px thì xếp một cột. Đã kiểm tra trên Edge (máy chủ tĩnh) ở 1440, 1024, 766 và 375 px: không chồng lấp, không tràn ngang, không lỗi console. Đã chép `overview-hero.css` sang Desktop; chưa dựng lại bộ cài Desktop sau thay đổi này.
- **13/11/2026 · Hero tràn mép.** Ở Tổng quan, hero phủ toàn bộ vùng bên phải thanh điều hướng, cao gần một màn hình, không bo góc. Thanh trên nằm đè lên hero với nền trong suốt và chữ sáng; `trackOverviewTopbar()` đo chiều cao thanh để đẩy nội dung hero xuống. Các khối bên dưới và các trang khác giữ lề và thanh trên trắng như cũ. Đã kiểm tra Web trên Edge (máy chủ tĩnh) ở 1820, 766 và 375 px và chuyển qua lại giữa các trang; dựng lại Desktop vào thư mục tạm và chạy với hồ sơ thử: hero, thanh trên và mô hình hiển thị đúng. Dữ liệu thật không bị ghi.
- **13/11/2026 · Mô hình tự xoay 360°.** `overview-hero.js` điều khiển camera Sketchfab qua giao thức `postMessage` của Viewer API 1.12.1 (tự viết theo mã nguồn `sketchfab-viewer-1.12.1.js`, không nạp script ngoài vào trang). Camera quay quanh trục Z đi qua điểm nhìn, 48 giây một vòng. Tham số `autospin` có sẵn bị bỏ vì xoay sai trục làm mô hình trôi khỏi khung; hiệu ứng camera bay vào cũng tắt (`camera=0`) vì làm sai điểm bắt đầu. Rê chuột vào mô hình thì dừng để người dùng tự kéo xem, rời chuột thì xoay tiếp từ góc nhìn mới. Mô hình ngừng xoay khi khuất màn hình hoặc khi máy bật chế độ giảm chuyển động. Đã sửa lỗi theo dõi khối mô hình cũ sau `render()` làm vòng xoay dừng. Kiểm tra: Web trên Edge (máy chủ tĩnh), góc quay tăng và mô hình nằm giữa khung qua nhiều ảnh chụp, rê chuột vào thì dừng 0°; Desktop dựng thử với hồ sơ thử, 30° trong 4 giây sau khi render lại. `node test.cjs` đạt ở hai kho. Dữ liệu thật không bị ghi.
- **13/11/2026 · Video mô phỏng thay ảnh tĩnh.** Cắt 20 giây đầu của `E:\. vh1_video\Video_VH1\Video Source\port_view.MP4` (gốc 3840×2160, 59,94 fps, 2:24) thành `dist/port-view.mp4` ở cả hai kho: H.264 1280×720, 30 fps, khoảng 1,8 Mbps, không tiếng, 4,72 MB. Dùng Windows Media Foundation (`MediaTranscoder`) vì máy không có ffmpeg. Hero không còn dùng `duyen-hai.png`: video chạy làm nền khi mô hình 3D đang tải rồi mờ đi và dừng; nút "Xem video mô phỏng" chuyển hẳn sang video (lặp, tắt tiếng). Video chỉ phát khi đang trong màn hình và không tự phát khi bật giảm chuyển động. `build-worker.mjs` thêm kiểu `video/mp4` (nhúng base64); `build.ps1` chép thêm `port-view.mp4`. Kiểm tra: Web trên Edge (máy chủ tĩnh) ở cả hai chế độ, video dừng khi cuộn khuất và chạy lại khi cuộn về, không lỗi console; Desktop dựng thử với hồ sơ thử, chế độ video phát 1280×720 dài 20 s, chế độ 3D xoay đúng tốc độ. Worker sinh ra tăng lên khoảng 8,6 MB; cần kiểm tra giới hạn kích thước của nơi triển khai trước khi phát hành. Bộ cài thử khoảng 109 MB.
- **13/11/2026 · Luân phiên video và mô hình 3D.** Hero mặc định chạy vòng lặp: video `port-view.mp4` một lượt 20 giây → chuyển mờ 1,2 s sang mô hình 3D xoay đúng một vòng 360° (30 s/vòng, trước là 48 s) → chuyển mờ về video chạy lại từ giây 0. Nút ở chân hero đổi thành "Chỉ xem video" / "Luân phiên video và mô hình 3D". Mô hình đang ẩn không nhận chuột. Rê chuột vào mô hình thì dừng xoay tối đa 10 giây rồi xoay tiếp. Render lại giữ giây đang xem của video và lượt hiện tại. Khi bật giảm chuyển động: chỉ hiện mô hình đứng yên. Kiểm tra: Web trên Edge (máy chủ tĩnh) ghi nhận video 20 s → mô hình khoảng 31 s → video từ 0; Desktop dựng thử với hồ sơ thử chạy đủ hai vòng liên tiếp (chuyển lượt ở 26,3 s, 46,3 s, 76,3 s). `node test.cjs` đạt ở hai kho. Dữ liệu thật không bị ghi.
- **13/11/2026 · Luân phiên luôn là mặc định.** Lựa chọn "Chỉ xem video" không còn lưu vào `localStorage`; chỉ có tác dụng trong lần mở trang hiện tại. Khi tải trang, khóa cũ `greenledger.overviewModel` bị xóa. Kiểm tra trên Edge: đặt khóa cũ là `off` rồi tải lại thì trang vẫn ở chế độ luân phiên và khóa đã bị xóa; bấm "Chỉ xem video" rồi tải lại thì trang về luân phiên. Desktop dùng cùng tệp và đã dựng lại thành công.
- **14/11/2026 · Nút và nút tách đôi.** Thêm `buttons.css` và `buttons.js` (giống nhau ở hai kho): kiểu nút chung (bo 8px, cao 36px, bóng nhẹ, giữ màu sẵn có) và nút tách đôi "Thao tác | ⌄" theo mẫu Button Group. Dải chọn kỳ gộp "+ Kỳ mới" với menu (Nhân bản kỳ, Thông tin cơ sở, Xóa kỳ), thay cho menu "Quản lý kỳ" ở Web và ba nút rời ở Desktop. Các chỗ xuất (đầu trang Báo cáo ở Web, thân báo cáo, báo cáo theo mẫu Word, trang Sao lưu) thành "In / Lưu PDF | ⌄" với Excel và CSV. Desktop bỏ lệnh vá chèn nút Excel trong `build.ps1`; 35 lệnh vá còn lại vẫn khớp. Kiểm tra: Web trên Edge (máy chủ tĩnh) mở/đóng menu, phím mũi tên, Home/End, Esc trả con trỏ về nút, bấm ra ngoài thì đóng, chọn "Thông tin cơ sở" mở hộp thoại; ở 375 và 1440 px mọi menu nằm trong màn hình, không tràn ngang, không lỗi console. Desktop dựng thử với hồ sơ thử: ba nút tách đôi có đủ mục, Esc đóng menu. `node test.cjs` đạt ở hai kho. Chưa thử bấm Excel/CSV từ menu để tải tệp thật.
- **14/11/2026 · Hiệu ứng React Bits cho bản Web.** Rà 218 thành phần trong `Phu-thuoc/react-bits/`; chọn ba hiệu ứng phục vụ nội dung và chuyển sang JS/CSS thuần trong `dist/react-bits.js` và `dist/react-bits.css` (chỉ bản Web; nạp sau `excel-export.js`, tự gắn sau mỗi `render()` bằng MutationObserver, không sửa `app.js`):
  - SpotlightCard: vệt sáng theo con trỏ và viền sáng trên 4 thẻ bước và thẻ kết quả của hero (sáng), các panel Tổng quan (xanh rất nhẹ). Bỏ qua chạm cảm ứng; có theo dõi lấy nét bằng bàn phím.
  - RotatingText: tiêu đề hero "rõ đến từng nguồn → hệ số → bước tính", 2,6 s một lần. Trình đọc màn hình chỉ đọc "nguồn". Dừng khi trang ẩn hoặc bật giảm chuyển động. Bản Desktop dùng chung `overview-hero.js` nhưng không nạp `react-bits.js` nên chữ đứng yên.
  - StatusMark: thông báo "Đã …" có dấu ✓ tự vẽ, "Chưa …"/"Không …" có dấu ✕; thông báo nhắc nhở không có dấu.
  Kiểm tra trên Edge (máy chủ tĩnh, khung trình duyệt đang ẩn nên giả lập trang hiện cho phần chữ chạy): chữ đổi đủ ba từ; thẻ đang rê sáng 0,15/viền 0,6, thẻ xa không sáng; thông báo đúng ba loại; 375 px không tràn; không lỗi console. `node test.cjs` đạt ở hai kho. Chưa kiểm tra trực quan vệt sáng trên màn hình thật và hiệu năng khi rê chuột liên tục.
- **14/11/2026 · Thẻ kết quả theo phạm vi (Web).** Trang Tính toán: thẻ Phạm vi 1 nền xanh lục nhạt, vạch xanh lục mép trái và nhãn "Phát thải trực tiếp"; thẻ Phạm vi 2 nền xanh lam nhạt, vạch và nút "Xem chi tiết" xanh lam, nhãn "Gián tiếp · điện năng mua vào". Khi sắp xếp theo nhóm nguồn, danh sách có tiêu đề chia mục kèm số nguồn và tổng tCO₂e của mỗi phạm vi (tính trên mọi nguồn đang lọc). `react-bits.js` thêm vệt sáng màu theo phạm vi và hiệu ứng thẻ hiện lần lượt (chuyển từ AnimatedContent), chỉ chạy khi danh sách đổi, không chạy khi mở/đóng chi tiết. Không dùng GSAP. Kiểm tra trên Edge (máy chủ tĩnh): 2 tiêu đề phạm vi đúng số liệu (8 nguồn · 5.543.647,24; 1 nguồn · 1.794,37); đổi bộ lọc thì 11 phần tử hiện lần lượt, mở chi tiết thì không; Xem dọc tiêu đề trải hai cột; xếp theo phát thải thì không có tiêu đề; 375 px không tràn; không lỗi console. `node test.cjs` đạt. Chưa áp dụng cho Desktop vì `calculations.js` của Desktop là bản riêng.
- **14/11/2026 · Đăng nhập, tài khoản và phân quyền (Web và Desktop).**
  - Trang đăng nhập mới `dist/login.html` + `login.css` (dùng chung hai bản): ảnh nhà máy, hiện/ẩn mật khẩu, cảnh báo Caps Lock, trạng thái chờ, giữ tên tài khoản khi nhập sai.
  - Tài khoản mặc định `pxvh1` / `pxvh1` (Quản trị). Ứng dụng nhắc đổi mật khẩu mặc định hoặc mật khẩu tạm nhưng không bắt buộc.
  - Tab 8 "Tài khoản & phân quyền" (`dist/accounts.js`, `accounts.css`, dùng chung): hồ sơ và quyền của mình, đổi mật khẩu (độ mạnh, nhập lại), quản trị thêm/sửa quyền/đặt lại mật khẩu/khóa/mở khóa/xóa người dùng, bảng vai trò mẫu. 6 quyền: kỳ, số liệu, hệ số & phương pháp, nhập/khôi phục, xuất, tài khoản; 4 vai trò mẫu (Quản trị, Kiểm kê viên, Nhập liệu, Xem & xuất báo cáo) + Tùy chỉnh.
  - Chặn theo quyền: nút không đủ quyền bị khóa kèm lý do; `commit()` chặn tài khoản không có quyền ghi.
  - Web: Worker lưu tài khoản trong D1 (`migrations/0001_accounts.sql`, Worker cũng tự tạo bảng), PBKDF2-SHA256 100.000 vòng, phiên ký HMAC kèm dấu phiên theo người (đổi mật khẩu/quyền/khóa làm phiên cũ hết hiệu lực), khóa 5 phút sau 5 lần sai, kiểm tra `Origin` cho API ghi, luôn giữ ít nhất một người quản lý tài khoản. Chưa gắn D1 thì giữ chế độ cũ (GL_OPERATOR_PASSWORD). Mật khẩu quản trị ban đầu lấy từ bí mật `GL_INITIAL_ADMIN_PASSWORD` nếu có, không thì `pxvh1`.
  - Desktop: `desktop/Accounts.cs` lưu `users.json` cạnh dữ liệu (PBKDF2-SHA256), bridge `accountBridge`; `InventoryStorage.Save` từ chối tài khoản không có quyền ghi. `build.ps1` dịch thêm `Accounts.cs`, tham chiếu `System.Web.Extensions`, thêm 5 lệnh vá cho tab 8 (40/40 lệnh vá khớp).
  - Chạy thử Web có Worker: `node dev-server.mjs` (D1 giả lập bằng `node:sqlite` ở `.dev/accounts.sqlite`).
  - Kiểm tra: `node test-accounts.mjs` (12 nhóm: đăng nhập, mặc định, vai trò, đổi mật khẩu, hủy phiên, khóa tạm, bảo vệ quản trị, chặn khác nguồn, chế độ cũ) đạt; `node test.cjs` đạt hai kho. Edge qua `dev-server.mjs`: đăng nhập sai/đúng, tạo người dùng qua hộp thoại, đăng nhập người xem (7 thao tác bị khóa, `commit()` bị chặn, xuất PDF vẫn được), đổi mật khẩu 4 trường hợp, xóa người dùng, 375 px không tràn. Desktop dựng thử với hồ sơ thử: tạo `users.json` mặc định, đăng nhập sai báo số lần thử, tạo người xem, host từ chối `desktopStorage.setItem` của người xem, đổi mật khẩu; `users.json` không chứa mật khẩu gốc. Sửa lỗi vòng lặp MutationObserver khi ghi chữ avatar (chỉ có ở Desktop). Chưa cài bộ cài lên máy thật; chưa triển khai Worker lên Cloudflare.
- **Lưu ý đóng gói:** Windows PowerShell 5.1 đọc `build.ps1` (UTF-8 không BOM) theo mã ANSI nên báo lỗi cú pháp ở các dòng tiếng Việt. Lần dựng này đọc script bằng UTF-8 qua một wrapper; cần chạy bằng PowerShell 7 hoặc lưu `build.ps1` có BOM nếu muốn gọi trực tiếp.

- Đã cài Taste Skill ở cấp dự án cho Codex và Claude Code. Bản Web dùng font đóng gói cùng Worker, ảnh Duyên Hải 1 trong khối Tổng quan và màu hổ phách cho nút xuất báo cáo. Đã kiểm tra tám màn hình, tải font tiếng Việt, lọc và mở công thức, cùng bố cục Tổng quan và Tính toán từ 360 đến 1440 px trên Edge.

- Đã cập nhật vùng Tính toán & ĐKĐBĐ theo ảnh tham chiếu Booking. `node test.cjs`, đóng gói Worker và kiểm tra Edge trên bản chạy cục bộ đều đạt. Đã thử hai kiểu hiển thị, lọc, sắp xếp, mở công thức, chia khung và kiểm tra tràn ngang từ 360 đến 1440 px.

- Đã bật lại trang đăng nhập theo bản Windows. Bản xem thử chạy Worker và đã qua kiểm tra HTTP cho đăng nhập đúng/sai, tài nguyên cần phiên hợp lệ và đăng xuất. Website công khai cần cấu hình bí mật khi triển khai bản này.

- Đã chuẩn hóa điều hướng, dải chọn kỳ, chỉ số Tổng quan, biểu đồ và bảng. Thiết kế dùng ảnh Duyên Hải 1 có sẵn và các biến màu của GreenLedger.
- Đã chạy `node test.cjs`, kiểm tra cú pháp và tạo Worker bằng `node build-worker.mjs`. Kiểm tra Edge trên máy cục bộ qua tám màn hình, với kích thước Tổng quan từ 360 đến 1440 px. Đã thử lọc dữ liệu, mở chi tiết tính toán, quản lý kỳ, tạo PDF và tải XLSX.
- Bước tiếp theo trong danh sách kiểm kê là thử nhập lại hồ sơ cũ. Việc đối chiếu số liệu gốc và kiểm tra tính lại trong XLSX còn mở.

Rà soát ngày **13/11/2026** trên các cây làm việc hiện có.

## Đã có và đã kiểm tra

- Đã có hai kho Web và Desktop, cùng các tệp bàn giao HTML, XLSX, ZIP và bộ cài Windows trong `Ban-giao/`.
- `node test.cjs` đạt ở cả hai kho với Node.js 24.16.0. Bộ kiểm thử bao phủ quy đổi đơn vị, tổng tháng, sinh khối, điện, nước thải, hỗn hợp khí, tổng hợp ĐKĐBĐ, urê và xác thực bản sao lưu. Ca 50.000 lít dầu DO cho **134,2818792 tCO₂e** và **U95 khoảng 4,2270%**.
- Kiểm tra cú pháp JavaScript Web đạt. Chạy riêng luồng khởi tạo kỳ Duyên Hải 1 năm 2025 trong Node theo thứ tự script của trang. Engine chấp nhận cấu trúc và tính được **9 dòng**.
- `desktop/build.ps1` tạo được bộ cài x64 trong thư mục tạm với gói WebView2 và `IPCC.zip` hiện có. `node --check` đạt trên `app.js` sinh ra.

## Lỗi và phần chưa xác nhận

- Các phép kiểm thử trên chưa tái hiện lỗi ứng dụng. Lần đầu chạy thử hồ sơ 2025 trong Node thiếu DOM giả lập và một script phụ thuộc. Sau khi thêm DOM giả lập và nạp theo `index.html`, phép kiểm tra đạt.
- Chưa xác nhận luồng Web trong trình duyệt, hồ sơ 2025 đối chiếu với số liệu gốc, kết quả tính lại trong XLSX, hoặc hành vi của bộ cài sau khi cài đặt và chạy.
- Web có thay đổi đang làm trong giao diện tính toán và tệp `dist/duyen-hai-2025.js` chưa được Git theo dõi. Desktop cũng có thay đổi đang làm, gồm các tệp dưới `desktop/` và một số tài nguyên trong `dist/` chưa được theo dõi. Các kết quả trên áp dụng cho cây làm việc ngày rà soát.

## Tiếp theo

Bắt đầu từ mục 1 trong [TASKS.md](TASKS.md). Kiểm tra kỳ Duyên Hải 1 năm 2025 trên một origin Web mới, sau đó thử mở lại hồ sơ cũ trước khi đối chiếu báo cáo và tệp xuất.

## 14/11/2026 · Biểu tượng tab Web

- Dùng logo GreenLedger hiện có cho tab trang đăng nhập và trang ứng dụng. Worker phục vụ tệp ảnh trước đăng nhập.
- `node test.cjs` và `git diff --check` đạt. Đã khởi động lại localhost ở cổng 8765, kiểm tra ảnh trên trang đăng nhập bằng Edge và xác nhận trang sau đăng nhập dùng cùng biểu tượng qua Worker với cơ sở dữ liệu kiểm thử.

## 14/11/2026 · Thanh điều hướng Web

- Cài `3d-web-experience` và `ui-design-system` vào thư mục skill của Claude Code và Codex trong dự án. Áp dụng UI Design System cho thanh bên nền sáng, mục đang mở màu xanh đậm, nhóm menu có đường phân cách và thẻ đồng hồ.
- `node test.cjs`, `node test-accounts.mjs`, `node --check dist/app.js` và `git diff --check` đạt. Đã khởi động lại localhost cổng 8765. Kiểm tra Edge qua cơ sở dữ liệu thử với màn hình rộng, thấp và điện thoại, thao tác bàn phím, giữ vị trí cuộn, đồng hồ và chế độ in.

## 14/11/2026 · Thanh chọn kỳ kiểm kê Web

- Khôi phục thanh bên xanh đậm, gồm đồng hồ giờ Việt Nam. Đổi dải chọn kỳ dùng chung sang nền xanh đậm, ô chọn trắng, nhãn GWP và nút tách đôi màu hổ phách.
- `node --check dist/app.js`, `node test.cjs` và `git diff --check` đạt. Đã chạy lại localhost cổng 8765 và kiểm tra Edge bằng dữ liệu thử với tạo kỳ, chuyển kỳ, menu bàn phím, màn hình 375px và chế độ in.

## 14/11/2026 · Thao tác báo cáo theo mẫu Word trên Web

- Dời nút Thông tin báo cáo lên trước In / Lưu PDF ở đầu trang và bỏ nút in trùng trong khung báo cáo.
- `node --check`, `node test.cjs` và `git diff --check` đạt. Đã chạy lại localhost cổng 8765 và xác nhận trên Edge bố cục desktop, điện thoại, hộp thoại thông tin, lệnh in và menu định dạng xuất.

## 14/11/2026 · Nền ô chọn kỳ Web

- Đặt nền trong suốt cho ô chọn kỳ trên thanh xanh, giữ chữ sáng và danh sách mở tông tối.
- `node test.cjs` và `git diff --check` đạt. Đã chạy lại localhost cổng 8765 và kiểm tra trên Edge kiểu nền, tiêu điểm bàn phím và bố cục màn hình hẹp.

## 14/11/2026 · Chiều rộng ô chọn kỳ Web

- Ô chọn kỳ co theo tên kỳ đang hiển thị và giới hạn theo chiều rộng vùng chứa.
- `node test.cjs` và `git diff --check` đạt. Đã khởi động lại localhost cổng 8765 và kiểm tra trên Edge khi đổi giữa hai kỳ tên dài, ngắn và ở màn hình rộng 320px.

## 14/11/2026 · Căn hàng thanh chọn kỳ Web

- Căn nhãn kỳ, ô chọn, GWP và nút tạo kỳ trên một hàng desktop. Trên màn hình hẹp, nhóm thao tác xuống dòng.
- `node test.cjs` và `git diff --check` đạt. Đã chạy lại localhost cổng 8765 và kiểm tra trên Edge ở 1536px và 320px, gồm menu quản lý kỳ.
