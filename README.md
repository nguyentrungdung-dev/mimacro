# Ôn MiMacro

Ứng dụng học và ôn thi Kinh tế vi mô/vĩ mô, ưu tiên sinh viên NEU. Giá trị cốt lõi là tạo đề có độ phủ kiến thức từ ngân hàng, luyện tập, thi thử, chấm bài và giải thích. Mốc mục tiêu MVP: 06/11/2026, giờ Việt Nam.

## Chạy ứng dụng

Dùng Node.js 24. Cấu hình trong `.env.local`; mọi công việc với database dùng **DATABASE_URL đang được cấu hình**, không dùng hoặc chuyển sang cụm PostgreSQL local riêng.

```sh
npm ci
npm run dev
```

Mở [http://127.0.0.1:3006](http://127.0.0.1:3006). `APP_ORIGIN=http://127.0.0.1:3006`, `MEDIA_STORAGE=postgres`. Không ghi URL kết nối hoặc mật khẩu vào tài liệu/commit. Tên thư mục có dấu `:`, nên npm scripts gọi binary bằng Node trực tiếp.

Các lệnh bảo trì dùng cùng cấu hình DB:

```sh
npm run db:migrate
npm run admin:role -- ten_dang_nhap admin
```

Migration chỉ chạy khi có thay đổi schema; kiểm checksum và khóa transaction. Không sửa migration đã áp. Cấp role chỉ dành cho tài khoản đã đăng ký, qua CLI tin cậy. Tài khoản `adminsci` đã có trên DB cấu hình; thông tin đăng nhập nằm trong tệp riêng tư `.local/adminsci-credentials.txt`, không nằm trong mã nguồn.

Kiểm tra code không cần DB:

```sh
npm run verify
```

Lệnh này chạy unit/data tests, TypeScript và build; data tests cần `data/imports/frank.json` có sẵn. Không build đè thư mục `.next` khi server đang dùng nó. Các script `smoke`/`smoke:admin` cũ chỉ hỗ trợ DB local và **không được chạy theo quy trình hiện tại**; không gỡ chặn để chạy bộ fixture cũ vào DB cấu hình. Kiểm thử tích hợp tiếp theo phải được điều chỉnh cho đúng DB hiện tại, cô lập dữ liệu test và giữ nguyên dữ liệu thật.

## Trạng thái hiện tại

Đã có catalog, tài khoản, đề gốc/trộn trắc nghiệm theo chương, luyện/thi thử, autosave, chấm và giải thích, lịch sử/tiến trình cơ bản, quản trị ngân hàng có phiên bản. DB cấu hình đã áp migration 001–004, có 10 nguồn Frank/1.741 câu, 43 hình; 1.739 câu đủ điều kiện cấu trúc, 2 câu chờ đối chiếu lời giải. Chưa nghiệm thu học thuật toàn bộ bank.

MVP chưa hoàn tất: tự luận/ảnh, AI gateway, parser ngoài Frank DOCX, thanh toán/quyền gói và deploy public còn trong backlog. Nội dung tiếng Việt chưa đủ căn cứ chấm chính thức. Xem [tiến độ](docs/PROGRESS.md).

## Quản trị

Admin chỉ quản trị; backend chặn tạo/đọc/trả lời/nộp bài dưới vai trò admin. Đăng nhập rồi mở `/quan-tri`. Có tổng quan, nguồn/phiên nhập DOCX, câu chờ duyệt, ngân hàng có phiên bản, quản lý đề, người dùng, tác vụ/chi phí, thanh toán, phản hồi và audit.

Nhập DOCX tối đa 25 MB, dạng Frank như mẫu có câu/lựa chọn/Answer Key/lời giải; cần Python 3 ở server (có thể đặt PYTHON_BIN). File gốc giữ private trong PostgreSQL; parser giữ bảng/ảnh/sup/sub, nhập theo lô transaction và chống trùng hash. Câu mới chờ admin đối chiếu/duyệt. File không đọc được, thiếu hình hoặc có OMML/đề nhiều phần giữ trạng thái lỗi và nguồn để thử lại; không đoán đáp án. Chưa có AI kiểm định nội dung.

Ngân hàng giữ ID/thứ tự lựa chọn, media và mọi revision. Sửa có lý do → chờ duyệt; kiểm tra cấu trúc + xác nhận nguồn/giải quyết issue → duyệt và phát hành. Lượt làm cũ giữ snapshot/điểm. Tạo đề quản trị tạo snapshot nháp để xem trước, không tạo attempt; phát hành/gỡ về nháp/ngừng dùng có audit, đề có câu đổi phiên bản phải tạo lại. Ứng viên năm đề miễn phí chưa kích hoạt chính sách lượt khách.

Người dùng: tìm kiếm, khóa/mở, đổi role có lý do và thu hồi phiên; bảo vệ tài khoản admin đang dùng/admin cuối. Phản hồi từ từng câu được tiếp nhận/xử lý, không tự thay điểm. Màn tác vụ theo dõi các phiên nhập và usage đã ghi nhận; AI gateway/SePay/quyền gói chưa kết nối và được ghi rõ trên giao diện. Chưa có editor trực quan, thay ảnh, quản trị rubric hoặc chấm lại.

`npm run smoke:workspace` kiểm thử tích hợp theo DB đang cấu hình với fixture gắn nhãn riêng và chỉ dọn đúng fixture của lượt chạy; cần Chrome/Playwright bundled runtime cùng thông tin admin qua ADMIN_SMOKE_PASSWORD hoặc tệp riêng tư hiện có. Không chạy script smoke cũ vốn khóa vào DB local. Có thể dùng `NEXT_DIST_DIR=.local/build-admin npm run build` để kiểm tra build riêng khi dev đang chạy; không dùng nó để đổi DB.

## Tài liệu nền

| Tài liệu | Nội dung |
| --- | --- |
| [Phạm vi](docs/PRODUCT_SCOPE.md) | Yêu cầu đã chốt và ranh giới MVP |
| [Tiến độ](docs/PROGRESS.md) | Trạng thái hiện tại và backlog |
| [Quyết định](docs/DECISIONS.md) | Quyết định còn hiệu lực và câu hỏi cần chốt |
| [Kiến trúc](docs/ARCHITECTURE.md) | Module, luồng và vận hành |
| [Dữ liệu](docs/DATA_AND_IMPORT.md) | Nguồn, nhập liệu, phiên bản và bất biến |
| [AI](docs/AI_POLICY.md) | Sinh câu, chấm bài, hạn mức và căn cứ |
| [Nghiệm thu](docs/ACCEPTANCE.md) | Tiêu chí phát hành |
| [AGENTS.md](AGENTS.md) | Quy tắc làm việc cho tác nhân lập trình |

Chỉ sửa tài liệu hiện có khi thông tin cần dùng lâu dài thay đổi. Kết quả triển khai/kiểm thử thông thường báo trong chat, không tạo file docs theo mỗi lần thêm code.

File nguồn, dữ liệu nhập, ảnh và bản sao lưu riêng tư không commit; không sửa test bank gốc. Báo cáo đối chiếu nguồn ở `data/audits/sample-bank-audit.json` là dữ liệu phục vụ nhập liệu, không phải báo cáo tiến độ. Giao diện dùng [.agents/skills/taste-skill/SKILL.md](.agents/skills/taste-skill/SKILL.md).
