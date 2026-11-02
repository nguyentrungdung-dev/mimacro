# Tiến trình xây dựng MVP

Ngày cập nhật: 02/11/2026. Mốc mục tiêu: 06/11/2026, giờ Việt Nam. Lịch dưới đây là kế hoạch, không phải cam kết mọi công việc đã hoàn thành. Chủ sản phẩm là người xây dựng chính; AI hỗ trợ triển khai; giáo sư NEU nghiệm thu học thuật.

## Quy ước trạng thái

`todo`: chưa làm; `in_progress`: đang làm; `waiting_input`: phần việc cần thông tin cụ thể; `blocked`: đã xác định phụ thuộc ngăn thực hiện; `done`: có kết quả và bằng chứng. Trạng thái ở đây chỉ dùng theo dõi công việc dự án, không phải trạng thái goal của công cụ.

Mỗi công việc đang làm có người thực hiện. Khi done, ghi ngày, file/commit nếu có, cách kiểm tra và giới hạn. Không đánh dấu done nhờ chỉ có mockup. Các mục khác không cần dừng vì một mục waiting_input.

## Công việc đã thực hiện

| ID | Công việc | Trạng thái | Bằng chứng và giới hạn |
| --- | --- | --- | --- |
| P00 | Phỏng vấn và ghi yêu cầu | done | PRODUCT_SCOPE và DECISIONS; các điểm chưa chốt được giữ riêng |
| P01 | Kiểm tra cấu trúc 11 file mẫu | done | data/audits/sample-bank-audit.json; không phải nhập ngân hàng hoặc kiểm định toàn bộ đáp án |
| P02 | Cài skill giao diện | done | .agents/skills/taste-skill/SKILL.md cùng references/scripts; chưa chạy thiết kế UI |
| P03 | Bộ tài liệu nền trước code | done | README, AGENTS và 8 tài liệu docs; kiểm tra link/cấu trúc sau khi tạo |

P00–P03 thực hiện ngày 02/11/2026 bởi AI hỗ trợ và chủ sản phẩm trong trao đổi. Sau đó đã dựng mốc ứng dụng local bên dưới; chưa có deploy public, thanh toán hoặc kiểm thử AI chấm bài.

## Backlog theo phụ thuộc

| ID | Công việc | Trạng thái | Phụ thuộc | Kết quả cần có |
| --- | --- | --- | --- | --- |
| P10 | Chọn stack/hosting/auth/DB/storage và kiểm chứng deploy | in_progress | T05/O10 | AI hỗ trợ đã thêm cấu hình Vercel, origin HTTPS và media PostgreSQL; 8 tests/build/typecheck, 19 smoke local đạt; chưa có DB từ xa/URL cloud, chưa chọn gói |
| P11 | Dựng app, cấu hình môi trường, schema/migration và quyền cơ bản | done | P10 local | Next.js build/typecheck đạt; PostgreSQL cụm riêng 55438; 001_foundation có migration checksum; smoke kiểm tra ownership và không lộ key |
| P12 | Parser Frank và mẫu chuẩn đối chiếu | done | P01 | scripts/extract-frank.py + kiểm tra dữ liệu; đủ 1.741 key/câu, kiểm tra media q91 và subscript q93; không phải kiểm định học thuật mọi câu |
| P13 | Parser đề nhiều phần, bảng, OMML, ảnh | in_progress | P12 | Đã giữ bảng/ảnh/run superscript/subscript Frank; parser CLC/OMML và nhiều đề chưa triển khai |
| P14 | Báo cáo nhập, issue, version và UI sửa nội dung | todo | P11–P13 | Admin thấy lỗi và sửa có audit |
| P15 | Nhập ngân hàng đủ căn cứ, taxonomy và chống trùng | in_progress | P12–P14 | 10 nguồn: 1.739 validated theo cấu trúc, 2 needs_review; chương/chủ đề baseline; độ khó và họ biến thể ngữ nghĩa chưa hoàn tất |
| P16 | Bổ sung đáp án/rubric CLC và nguồn còn thiếu | waiting_input | O06 | Chủ sản phẩm gửi; chưa chặn parser hoặc đề khác |
| P20 | Đăng ký, đăng nhập, phiên và lịch sử cá nhân | in_progress | P11 | Đã có scrypt/session, auth và lịch sử; kiểm thử đăng xuất/đăng nhập và isolation; khôi phục mật khẩu/chính sách gộp khách chưa làm |
| P21 | Làm đề gốc, autosave, thi thử, đồng hồ và nộp | done | P11/P12 | Mốc trắc nghiệm: smoke đạt reload, autosave lỗi/khôi phục, deadline server, submit idempotent và modal bàn phím; tự luận/ảnh thuộc P31–P32 |
| P22 | Chấm trắc nghiệm, giải thích theo chế độ và xem lại | done | P21 | Unit + smoke: key ẩn trước nộp, practice mở đúng câu, chấm bằng stable ID, nộp lặp không đổi điểm |
| P23 | Blueprint và tạo đề từ kho | in_progress | P15/P22/O11 | Đã chia đều chương, xáo lựa chọn và loại trùng chính xác; smoke 12 câu/3 chương và kho thiếu; độ khó/chuẩn phân bổ NEU chưa chốt |
| P24 | Điểm, lịch sử, chủ đề cần ôn | in_progress | P20/P22 | Có lịch sử và thống kê theo các lượt hoàn thành; chưa phân tích lần đầu/làm lại hoặc hiệu chuẩn nhận định năng lực |
| P25 | Catalog năm đề khách và giới hạn lượt | todo | P20/P21/O01–O03 | A31; chính sách thực được ghi rõ |
| P30 | AI gateway, job nền, usage, hạn mức và retry | todo | P11/T06 | Tác vụ phục hồi được, chi phí theo loại |
| P31 | Rubric và chấm tự luận văn bản | todo | P30/nguồn rubric | A22/A24/A25 |
| P32 | Upload riêng tư, xem trước, PDF/ảnh và chấm đồ thị | todo | P30/P31/O07 | A23/A24/A42 |
| P33 | Sinh biến thể/câu mới và review tự động | todo | P15/P30/O05 | A20/A21; ưu tiên sau tạo đề từ kho |
| P34 | So sánh chấm AI với giáo sư | todo | P31/P32/O08 | Bộ đánh giá, sai lệch điểm, chi phí, kết luận |
| P40 | Gói/quyền/hạn mức dạng cấu hình | todo | P20/O04 | Không có quyền trả phí ngầm |
| P41 | Đơn hàng, SePay webhook và đối soát | todo | P40/O09 | A33–A36; chống xử lý trùng |
| P42 | Trang admin người dùng, jobs, chi phí, lỗi/phản hồi | todo | P14/P20/P30/P41 | Đủ chức năng quản trị đã yêu cầu |
| P50 | Chọn hướng UI và triển khai theo taste-skill | in_progress | P10 và các luồng | Achromatic ledger seed 1240087745; catalog meter 0 FAIL/0 WARN, đã xem ảnh 3 widths; quản trị/AI/billing UI chưa có |
| P51 | Kiểm thử chức năng/quyền/lỗi mạng/tích hợp và UI | in_progress | Theo module đã có | Mốc local: 5 tests, typecheck/build và 19 smoke đạt; kiểm tra ảnh/gate 3 widths; chi tiết VERIFICATION; không thay thế toàn bộ ACCEPTANCE |
| P52 | Deploy, sao lưu/phục hồi và chạy thử nhóm | todo | P51/O10 | URL môi trường thử, bằng chứng vận hành |
| P53 | Nghiệm thu và quyết định phát hành | todo | P34/P41/P51/P52 | Giáo sư + chủ sản phẩm, lỗi còn lại và phạm vi rõ |

## Mốc từng ngày

| Ngày | Mục tiêu | Bằng chứng để kết thúc mốc |
| --- | --- | --- |
| Thứ Hai 02/11 | Tài liệu nền, chọn stack, luồng deploy nhỏ, bắt đầu parser | Tài liệu, quyết định T05, dữ liệu mẫu và URL thử nếu đã triển khai |
| Thứ Ba 03/11 | Một đề có đáp án chạy trọn luồng, tài khoản và nhập liệu cơ bản | Chọn đề → trả lời → nộp → chấm → giải thích; auth và lưu bài |
| Thứ Tư 04/11 | Bộ tạo đề có độ phủ, luyện/thi, tiến trình cá nhân | Ràng buộc đề kiểm tra được; autosave/hết giờ/lịch sử đúng |
| Thứ Năm 05/11 | Tự luận/ảnh, thanh toán, quản trị; mở rộng câu AI nếu đủ điều kiện | Tích hợp có bằng chứng, chi phí đo được, rubric sẵn |
| Thứ Sáu 06/11 | Nghiệm thu, sửa lỗi và mở thử nghiệm | Checklist, báo cáo giáo sư, kết quả tích hợp và trạng thái nội dung |

Không tự chuyển mục bắt buộc thành “để sau” để làm đẹp bảng. Khi mốc có nguy cơ trễ, báo nguyên nhân, ảnh hưởng và phương án cụ thể; quyết định thay phạm vi thuộc chủ sản phẩm. Chưa biết dung lượng toàn bank, không gộp “app chạy” với “đã nhập hết”.

## Tiến trình nội dung riêng

| Phạm vi | Hiện có bằng chứng mẫu | Trạng thái phát hành |
| --- | --- | --- |
| Vi mô tiếng Anh | Frank chương 1–5 | Đã nhập 841 câu: 840 đủ điều kiện cấu trúc, 1 chờ xử lý; chưa nghiệm thu học thuật toàn bộ |
| Vĩ mô tiếng Anh | Frank chương 1–5, gồm nền tảng dùng chung | Đã nhập 900 câu: 899 đủ điều kiện cấu trúc, 1 chờ xử lý; chưa nghiệm thu học thuật toàn bộ |
| Vi mô tiếng Việt | 4 đề CLC, chưa có đáp án/rubric | Chưa đủ căn cứ chấm chính thức |
| Vĩ mô tiếng Việt | Chưa có file mẫu được kiểm tra | Chờ tài liệu; không tự tạo nguồn thay thế |

## Nhật ký thay đổi

| Ngày | Thay đổi | Bằng chứng |
| --- | --- | --- |
| 02/11/2026 | Tạo bộ tài liệu nền, quy tắc AI và backlog; giữ các tham số thương mại/kỹ thuật chưa chốt ở DECISIONS | README và docs |
| 02/11/2026 | Kiểm tra đủ 10 file Markdown, tiêu đề, liên kết file nội bộ, cặp code fence, tổng 1.741 mục Answer Key và đường dẫn skill; tất cả đạt | Kiểm tra tự động read-only bằng Python; chưa phải kiểm thử ứng dụng |
| 02/11/2026 | Kiểm tra stack thật của Vui Học; ghi ưu tiên stack lõi tương tự và ràng buộc không dùng DB cá nhân, chờ xác nhận engine DB công ty | T07–T09; đối chiếu package.json, README, database.ts và .env.example của Vui Học, không đọc/chép thông tin kết nối bí mật |
| 02/11/2026 | Người dùng xác nhận DB công ty là PostgreSQL và ưu tiên chạy trên máy trước; đề xuất PostgreSQL local riêng, không dùng dịch vụ DB cá nhân cũ | T09–T10; chưa cài/chạy DB hoặc kết nối dịch vụ |
| 02/11/2026 | Bắt đầu code theo lệnh người dùng; dựng Next.js, migration, cụm PostgreSQL riêng, parser Frank, tài khoản, exam engine và UI theo skill | src, scripts, migrations, tests; hướng dẫn LOCAL_DEVELOPMENT; không dùng DB công ty/cá nhân cũ |
| 02/11/2026 | Nhập 1.741 câu/10 nguồn bằng đọc DOCX trực tiếp, giữ 2 câu có vấn đề lời giải; 43 media duy nhất | data/imports/frank.json và DB local; không gọi OpenRouter |
| 02/11/2026 | Xác minh mốc nền: 5/5 tests, TypeScript/build đạt, 19/19 smoke; catalog 0 FAIL/0 WARN; builder 0 FAIL/2 WARN có giải trình; xem ảnh ở 1440/768/390 | docs/VERIFICATION.md, .local/reports/smoke.json và .taste-skill/inspect; không phải nghiệm thu toàn bộ MVP |

| 02/11/2026 | Chuẩn bị Vercel theo yêu cầu: vercel.json/.vercelignore, origin HTTPS, pool nhỏ, migration 002, import media và hướng dẫn deploy; không thay đổi điều kiện Hobby | docs/VERCEL_DEPLOYMENT.md; 8/8 tests, typecheck/build đạt không warning; migration local và nhập 43 hình/882.125 bytes hai lần thành công; 19/19 smoke khi MEDIA_STORAGE=postgres, gồm quyền hình và render ở 3 widths; chưa kiểm chứng cloud, chi phí API 0; P10 vẫn in_progress, P52 todo |

## Mẫu cập nhật công việc

```text
Ngày:
ID công việc:
Người thực hiện:
Trạng thái trước → sau:
Kết quả và file/commit:
Đã kiểm tra: dữ liệu, lệnh hoặc thao tác, expected/actual:
Chi phí API nếu có:
Giới hạn/lỗi/phụ thuộc còn lại:
Quyết định và tài liệu đã đồng bộ:
```
