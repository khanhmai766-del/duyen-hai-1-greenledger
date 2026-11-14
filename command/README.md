# Lệnh và tài liệu GreenLedger

Mở một phiên mới tại thư mục cha chứa `GreenLedger-Web/` và `GreenLedger-Desktop/`. Đây là gốc của kho Git duy nhất của dự án và là phạm vi cấu hình chung cho hai bản.

| Thao tác | Codex | Claude Code |
| --- | --- | --- |
| Xem tiến độ và việc kế tiếp | `$gl-status` | `/gl-status` |
| Chạy kiểm thử engine | `$gl-test` | `/gl-test` |
| Làm đúng một việc trong danh sách | `$gl-next` | `/gl-next` |

Ba kỹ năng trong [skill/](../skill/) được cân nhắc theo mô tả khi yêu cầu liên quan đến công thức KNK, xuất báo cáo hoặc đóng gói Desktop. Codex nạp từ `.agents/skills/` và Claude Code nạp từ `.claude/skills/`. Các tệp cấu hình trỏ về nội dung dùng chung. [Kỹ năng Codex](https://learn.chatgpt.com/docs/build-skills) · [Kỹ năng và lệnh Claude Code](https://code.claude.com/docs/en/skills)

Ba vai trò trong [agent/](../agent/) là `gl-emissions`, `gl-web` và `gl-desktop`. Trong Claude Code, gõ `@` rồi chọn agent, hoặc nhập `@agent-gl-emissions Rà soát công thức điện lưới`. Trong Codex, nhập `@gl-emissions Rà soát công thức điện lưới` theo quy ước của dự án hoặc viết `Hãy dùng subagent gl-emissions để rà soát công thức điện lưới`. [Subagent Codex](https://learn.chatgpt.com/docs/agent-configuration/subagents) · [Subagent Claude Code](https://code.claude.com/docs/en/sub-agents)

Tài liệu dự án gồm [PRD](PRD.md), [kiến trúc](ARCHITECTURE.md), [thiết kế](DESIGN.md), [quy tắc](RULES.md), [công việc](TASKS.md) và [tiến độ](PROGRESS.md).

## UI UX Pro Max

Mở phiên tại thư mục cha và yêu cầu thiết kế hoặc rà soát giao diện. Có thể gọi trực tiếp bằng `$ui-ux-pro-max` trong Codex hoặc `/ui-ux-pro-max` trong Claude Code. Dùng [DESIGN.md](DESIGN.md) làm chuẩn hiện hành của GreenLedger. [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

## Ponytail

Sáu skill `ponytail`, `ponytail-review`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain` và `ponytail-help` nằm trong `.agents/skills/`; `.claude/skills/` liên kết tới cùng thư mục. Gọi bằng `/ponytail`, `/ponytail-review`… trong Claude Code hoặc `$ponytail`… trong Codex. Chỉ cài phần skill (giấy phép MIT, lấy từ [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) bản 5.3.3, commit `96608e0`); không cài hook, thanh trạng thái hay bảng ghi chi phí của plugin. Quy tắc trong [RULES.md](RULES.md) vẫn ưu tiên hơn: không cắt kiểm tra dữ liệu, ĐKĐBĐ hay nguồn hệ số để làm mã ngắn hơn.

## GSAP

Tám skill `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-performance`, `gsap-react` và `gsap-frameworks` nằm trong `.agents/skills/`; `.claude/skills/` liên kết tới cùng thư mục. Lấy từ [greensock/gsap-skills](https://github.com/greensock/gsap-skills), commit `aed9cfd`, giấy phép MIT. GreenLedger chưa dùng GSAP. Nếu đưa vào, chép bản `gsap.min.js` cố định phiên bản vào `dist/` (và danh sách tệp của `desktop/build.ps1`) như ExcelJS, thay vì `npm install` mà skill gợi ý, vì hai bản không có bước đóng gói npm. Hero Tổng quan hiện chạy bằng CSS và JavaScript thuần.

## React Bits

Mã nguồn JS + CSS của 218 thành phần [React Bits](https://github.com/DavidHDev/react-bits) (commit `4e0d091`) nằm ở `Phu-thuoc/react-bits/` để tra cứu, không nạp vào ứng dụng. Các thành phần cần React nên phải chuyển từng hiệu ứng sang JavaScript thuần trước khi dùng. Giấy phép MIT + Commons Clause không cho phát tán lại chính các thành phần. Xem [Phu-thuoc/react-bits/README.md](../Phu-thuoc/react-bits/README.md).
