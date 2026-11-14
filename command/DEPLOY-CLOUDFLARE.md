# Kế hoạch triển khai GreenLedger Web với Cloudflare Workers và D1

**Server 1** là Cloudflare Worker chạy GreenLedger Web, xử lý đăng nhập, phục vụ tài nguyên và cung cấp API. **Server 2** là cơ sở dữ liệu Cloudflare D1 lưu hồ sơ kiểm kê. Luồng truy cập là **Trình duyệt → Worker → D1**. Worker xác thực phiên đăng nhập rồi truy cập D1 qua binding `DB`. [Kết nối Worker với D1](https://developers.cloudflare.com/d1/worker-api/)

GreenLedger hiện lưu dữ liệu trong `localStorage` theo địa chỉ website. Bản online cần thêm API để các thiết bị cùng đọc và ghi vào một nguồn dữ liệu. Kế hoạch dưới đây giả định một bộ hồ sơ dùng chung cho tài khoản vận hành hiện có (`pxvh1`, mật khẩu qua Secrets). Với một tài khoản dùng chung, D1 không ghi được ai đã sửa gì. Nếu cần tài khoản và quyền riêng theo người hoặc cơ sở, chốt mô hình quyền ở bước 1.

**Phạm vi:** chỉ bản Web. Bản Desktop vẫn lưu trên máy (`%LOCALAPPDATA%\GreenLedger\du-lieu.json`), nên hai nơi có thể lệch nhau. Quy ước chuyển dữ liệu giữa Desktop và bản online bằng tệp JSON sao lưu.

## 1. Chọn dữ liệu sẽ chuyển

- Dữ liệu `localStorage` nằm riêng ở từng trình duyệt, từng thiết bị và từng địa chỉ website, không tự chuyển sang bản online. Xuất JSON ở **mọi nơi** đang giữ hồ sơ (bản Web hiện tại, các máy khác, bản Desktop). Nếu có nhiều bản, xác định bản sẽ dùng làm dữ liệu ban đầu.
- Ghi số kỳ, số nguồn theo kỳ, bộ GWP, tổng phát thải và độ không đảm bảo đo để đối chiếu sau khi nhập. Xác định bộ dữ liệu nào được dùng trên bản thử và bản chính thức.
- **Hoàn tất khi** có bản sao lưu đã kiểm tra và biết ai được truy cập bộ hồ sơ online.

## 2. Thêm cấu hình triển khai và cấu trúc D1

- Trong kho `GreenLedger-Web`, thêm cấu hình Wrangler với môi trường `staging` và `production`, mỗi môi trường có tên Worker và ID D1 riêng. Khai báo binding `DB` và thư mục migration SQL.
- **Phục vụ tài nguyên bằng Workers Static Assets** thay vì nhúng vào script. Hiện `build-worker.mjs` chép mọi tệp trong `dist/` vào `dist/server/index.js` dưới dạng base64: script nặng 8,67 MB (5,82 MB khi nén). Con số này vẫn dưới giới hạn 64 MiB, nhưng video `port-view.mp4` 4,7 MB bị tải lại nguyên vẹn mỗi lần mở trang vì Worker trả `no-store` và không hỗ trợ tải từng phần. Đặt `assets.directory` là `dist/`, `assets.binding` là `ASSETS` và `run_worker_first: true`, để Worker kiểm tra phiên trước khi gọi `env.ASSETS.fetch(request)`. Dùng `.assetsignore` để không tải lên `dist/server/` và tệp không cần phát hành. Khi đó `build-worker.mjs` chỉ còn đóng gói mã Worker. [Static Assets](https://developers.cloudflare.com/workers/static-assets/binding/) · [Giới hạn Workers](https://developers.cloudflare.com/workers/platform/limits/)
- **Lưu cả hồ sơ thành một tài liệu JSON schema 1.** Hồ sơ hiện khoảng 32 KB (1 kỳ, 9 nguồn, 70 nhiên liệu), và ứng dụng vốn kiểm tra và lưu cả hồ sơ một lần. Gợi ý hai bảng:
  - `inventory(id, version, json, updated_at)`: một dòng cho bộ hồ sơ dùng chung.
  - `inventory_history(id, version, json, saved_at)`: giữ một số bản trước, ví dụ 30 bản gần nhất, để khôi phục nhanh mà không cần Time Travel.

  Chỉ tách bảng theo kỳ hoặc nguồn khi cần phân quyền theo cơ sở. Theo dõi kích thước: D1 giới hạn **2 MB cho một dòng hoặc giá trị**. Nếu hồ sơ tiến gần 1 MB thì xem lại cách lưu. [Migration D1](https://developers.cloudflare.com/d1/reference/migrations/) · [Giới hạn D1](https://developers.cloudflare.com/d1/platform/limits/)
- **Bỏ số liệu nội bộ khỏi tài sản web.** `dist/duyen-hai-2025.js` chứa số liệu Duyên Hải 1 năm 2025 và đang được tải về cho mọi người đăng nhập. Khi bản online đọc hồ sơ từ D1, đưa bộ số liệu này vào D1 bằng thao tác nhập JSON ở bước 6, rồi bỏ tệp khỏi `dist/` và khỏi `index.html` (xem `RULES.md`).
- **Tài khoản đã có sẵn:** `worker/index.mjs` quản lý người dùng và phân quyền trong bảng `users` của D1 (`migrations/0001_accounts.sql`). Khi bảng trống, Worker tạo tài khoản quản trị `pxvh1` với mật khẩu từ bí mật `GL_INITIAL_ADMIN_PASSWORD`, hoặc `pxvh1` nếu không đặt; nên đặt bí mật này cho bản chính thức. Thử cục bộ không cần Wrangler bằng `node dev-server.mjs`; kiểm thử bằng `node test-accounts.mjs`. Bảng hồ sơ kiểm kê (`inventory`) sẽ thêm ở migration `0002`.
- **Hoàn tất khi** migration chạy được trên D1 cục bộ và tạo đúng cấu trúc từ cơ sở dữ liệu trống.

## 3. Nối giao diện với API

**Phía Worker**

- Thêm `GET /api/inventory` để đọc hồ sơ và `version`, `PUT /api/inventory` để lưu hồ sơ kèm `version` đã đọc.
- Trước khi ghi, Worker kiểm tra:
  - phiên đăng nhập;
  - `Origin` trùng địa chỉ website (như `/login` đang làm);
  - `Content-Type: application/json`;
  - kích thước nội dung, ví dụ tối đa 1 MB.
- Kiểm tra cấu trúc bằng chính `Engine.validate` trong `dist/engine.js` (tệp đã hỗ trợ `module.exports`). Không viết bộ luật thứ hai, vì hai bộ luật riêng sẽ có lúc lệch nhau.
- Ghi nguyên tử bằng `UPDATE inventory SET json = ?, version = version + 1 … WHERE id = ? AND version = ?`, chạy cùng lệnh chép bản cũ sang `inventory_history` trong một `batch`. Nếu không có dòng nào được cập nhật, trả `409` kèm `version` hiện tại.

**Phía giao diện**

Hiện `app.js` đọc `localStorage` đồng bộ khi tải trang, và `commit()` ghi đồng bộ rồi báo "Đã lưu" ngay. Bản online cần:

- **Lớp lưu trữ riêng cho Web**, giống `desktopStorage` của bản Desktop: tải hồ sơ từ API xong mới chạy `app.js`, và `commit()` chờ API trả lời.
- **Chỉ báo "Đã lưu" khi Worker xác nhận.** Khi mất kết nối, giữ bản đang sửa làm bản nháp trong `localStorage`, báo trạng thái và cho thử lưu lại.
- **Thay cơ chế phát hiện sửa từ thẻ khác** (sự kiện `storage`) bằng kiểm tra `409`. Khi có xung đột, cho người dùng tải bản mới và xuất bản đang sửa ra JSON để đối chiếu.

**Hoàn tất khi** dữ liệu lưu ở một trình duyệt xuất hiện ở trình duyệt khác, hai lần sửa đồng thời được xử lý mà không ghi đè âm thầm, và yêu cầu `PUT` từ trang khác bị từ chối.

## 4. Kiểm thử cục bộ

Chạy từ kho `GreenLedger-Web` sau khi đã thêm cấu hình và migration. Tên `DB`, `staging` và `production` là tên dự kiến trong cấu hình. Bí mật khi chạy cục bộ đặt trong `.dev.vars.staging` (mỗi môi trường một tệp, phải khai báo đủ mọi bí mật); thêm `.dev.vars*` vào `.gitignore`. [Bí mật khi phát triển cục bộ](https://developers.cloudflare.com/workers/configuration/secrets/)

```powershell
node test.cjs
node build-worker.mjs
npx wrangler d1 migrations apply DB --local --env staging
npx wrangler dev --env staging
```

- Thử với hai phiên trình duyệt độc lập:
  - đăng nhập; từ chối đọc, ghi và tải tài nguyên khi chưa đăng nhập;
  - tạo và sửa kỳ;
  - xung đột lưu (`409`);
  - mất kết nối giữa chừng;
  - nhập JSON lỗi;
  - xuất lại JSON và đối chiếu kết quả tính.
- **Hoàn tất khi** kiểm thử đạt và dữ liệu thử vẫn đọc được sau khi khởi động lại môi trường cục bộ. [Thử D1 cục bộ](https://developers.cloudflare.com/d1/get-started/)

## 5. Triển khai bản thử trên Cloudflare

Đăng nhập Wrangler bằng tài khoản Cloudflare dùng cho dự án. Tạo cơ sở dữ liệu D1, điền ID vào binding của môi trường thử rồi áp dụng migration từ xa.

```powershell
npx wrangler login
npx wrangler d1 create greenledger-staging
npx wrangler d1 migrations apply DB --remote --env staging
npx wrangler deploy --env staging --secrets-file <tep-bi-mat-ban-thu>
```

- Cấp `GL_OPERATOR_PASSWORD` và `GL_SESSION_KEY` cho Worker qua Secrets. Dùng giá trị riêng cho mỗi môi trường và giữ tệp bí mật ngoài Git. [Worker Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- Giới hạn số lần thử mật khẩu cho `POST /login`; hiện trang đăng nhập chưa có giới hạn này. Có hai cách:
  - **Binding Rate Limiting ngay trong Worker** (`ratelimits`, chu kỳ 10 hoặc 60 giây, khóa theo IP): chạy trong mã nên dùng được cả khi chưa có tên miền riêng. Xác nhận lại trên URL `workers.dev` của bản thử. [Rate Limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
  - **Quy tắc Rate Limiting của WAF**: gắn với tên miền trên Cloudflare nên chỉ dùng được sau khi gắn tên miền riêng ở bước 6. Gói Free có 1 quy tắc, chu kỳ cố định 10 giây. [Rate limiting rules](https://developers.cloudflare.com/waf/rate-limiting-rules/)
- Worker đang đọc header `oai-authenticated-user-id` của nền tảng lưu trữ hiện tại. Trên Cloudflare header này luôn trống nên không ảnh hưởng; có thể bỏ khi chuyển hẳn.
- **Hoàn tất khi** mở được URL `workers.dev`, đăng nhập được và dữ liệu thử lưu ở máy này đọc được trên máy khác. Kiểm tra đăng xuất, truy cập API và tài nguyên khi chưa đăng nhập, và giới hạn đăng nhập sai.

## 6. Đưa dữ liệu thật lên bản chính thức

- Tạo `greenledger-production`, gắn ID D1 vào môi trường `production`, rồi áp dụng migration và triển khai Worker theo cùng thứ tự. Dùng bộ bí mật của bản chính thức.
- Nhập bản JSON đã chọn ở bước 1 vào bản online sau khi đăng nhập. So lại số kỳ, số nguồn, bộ GWP, tổng phát thải và độ không đảm bảo đo. Mở trên thiết bị thứ hai để xác nhận cả hai cùng đọc từ D1.
- **Chuyển từ nơi lưu trữ hiện tại:** Web đang chạy trên nền tảng khác (`.openai/hosting.json`). Thông báo cho người dùng địa chỉ mới, chuyển tên miền nếu có, rồi tắt bản cũ sau khi đã xuất xong dữ liệu ở bước 1, để không ai tiếp tục lưu vào `localStorage` của bản cũ.
- **Hoàn tất khi** kết quả khớp với bản sao lưu, đã thử xuất JSON từ bản online và bản cũ không còn nhận dữ liệu mới. Gắn tên miền riêng nếu cần. [Tên miền riêng cho Workers](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

## 7. Chuẩn bị sao lưu và khôi phục

- Giữ bản JSON trước khi chuyển và xuất thêm sau khi đối chiếu thành công. Trước mỗi lần đổi cấu trúc database, ghi phiên bản Worker và mốc phục hồi D1. D1 Free có lịch sử khôi phục **7 ngày**. [Khôi phục D1](https://developers.cloudflare.com/d1/reference/time-travel/) · [Giới hạn D1](https://developers.cloudflare.com/d1/platform/limits/)
- Để giữ lâu hơn 7 ngày, thêm Cron Trigger xuất hồ sơ JSON định kỳ (ví dụ mỗi ngày) ra R2. Bảng `inventory_history` ở bước 2 dùng cho khôi phục nhanh các lần lưu gần đây. [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- Thử khôi phục thật ít nhất một lần trên bản thử, từ cả Time Travel và bản JSON trên R2, trước khi đưa bản chính thức vào dùng.
- Nếu lỗi ở mã web, quay về bản Worker đã xác minh tương thích với cấu trúc D1 hiện tại. Nếu lỗi ở dữ liệu, giữ bản sao hiện tại và kiểm tra bản phục hồi trước khi cho ghi tiếp.
