# Tiến độ MVP

Cập nhật 02/11/2026. Mục tiêu 06/11/2026, giờ Việt Nam. Đây là trạng thái hiện tại và backlog, không phải nhật ký từng lần code. Kết quả kiểm tra chi tiết báo trong chat.

## Hiện trạng

Ứng dụng chạy trên máy qua npm run dev nhưng **dùng DB đang cấu hình trong .env.local**, không dùng DB local riêng. Migration 001–004 và adminsci đã áp vào DB cấu hình; hình dùng MEDIA_STORAGE=postgres. Chưa deploy public hoặc nghiệm thu học thuật toàn bộ.

Có 10 nguồn Frank/1.741 câu, 1.739 đủ điều kiện cấu trúc và 2 chờ đối chiếu lời giải; 43 hình. Vi mô tiếng Anh: 841 câu (840 đủ điều kiện); Vĩ mô tiếng Anh: 900 câu (899 đủ điều kiện). Vi mô tiếng Việt có mẫu CLC thiếu đáp án/rubric; Vĩ mô tiếng Việt chưa có nguồn mẫu đủ căn cứ.

Đã có catalog, tài khoản, đề gốc/trộn trắc nghiệm, luyện/thi thử, autosave, chấm/giải thích, lịch sử cơ bản và quản trị ngân hàng có phiên bản. Mốc kiểm tra trước khi dọn tài liệu: 11 unit/data tests + typecheck/build; 19 learner smoke và 16 admin smoke đã đạt trong đợt phát triển trước. Sau chuyển DB cấu hình đã xác minh đăng nhập/role, phiên ở đúng DB, danh sách, revision, hình và chặn người chưa đăng nhập. Đã có kiểm thử quản trị/nhập/duyệt/đề/quyền/phản hồi trên DB cấu hình bằng fixture riêng; không suy diễn thành nghiệm thu toàn bộ MVP.

## Backlog

`todo`: chưa làm; `in_progress`: làm một phần; `waiting_input`: cần thông tin; `done`: phần việc đã có kết quả kiểm chứng. Chủ sản phẩm xây dựng chính, AI hỗ trợ; giáo sư nghiệm thu học thuật. Không đánh dấu done chỉ nhờ mock/giao diện.

| ID | Công việc | Trạng thái | Phần còn lại / giới hạn |
| --- | --- | --- | --- |
| P00–P03 | Yêu cầu, khảo sát mẫu, skill và tài liệu nền | done | Tài liệu nền đã gọn lại; không thay nghiệm thu nội dung |
| P10 | Stack, hosting và triển khai | in_progress | Đã đo API public mimacro.vercel.app; bản tối ưu vùng sin1/bootstrap/pool đã push, chờ xác minh deploy và đo lại public; chưa nghiệm thu gói hosting/vận hành |
| P11 | App, môi trường, schema/migration và quyền cơ bản | done | DB cấu hình đã áp 001–004 |
| P12 | Parser Frank và mẫu đối chiếu | done | Đủ 1.741 câu/key; không phải kiểm định học thuật toàn bộ |
| P13 | Parser đề nhiều phần, bảng, OMML, ảnh | in_progress | Frank giữ bảng/ảnh/sup/sub; CLC/OMML/nhiều đề chưa làm |
| P14 | Quản trị nhập/sửa và lỗi | in_progress | Đã có upload Frank DOCX/private raw/phiên nhập/retry/duyệt/bulk transaction; parser CLC/OMML/định dạng khác chưa hỗ trợ |
| P14a | Danh sách, chi tiết, sửa có phiên bản, kiểm tra lại | done | Giữ baseline/audit/stable ID/snapshot; chưa có editor trực quan/thay hình |
| P14b | Áp quản trị và adminsci lên DB cấu hình | done | Giữ mật khẩu/nội dung/issue; không chuyển dữ liệu smoke hoặc phiên local |
| P15 | Nhập bank, taxonomy và chống trùng | in_progress | Độ khó và họ biến thể ngữ nghĩa chưa hoàn tất |
| P16 | Đáp án/rubric CLC và nguồn bốn nhóm | waiting_input | O06; không tự tạo đáp án giáo sư |
| P20 | Tài khoản, phiên và lịch sử | in_progress | Thiếu khôi phục mật khẩu/chính sách gộp khách |
| P21 | Đề gốc, autosave, thi thử, đồng hồ và nộp | done | Phạm vi trắc nghiệm; tự luận/ảnh ở P31–P32 |
| P22 | Chấm trắc nghiệm, giải thích và xem lại | done | Stable ID; đề thi ẩn key trước nộp; submit idempotent |
| P23 | Blueprint và tạo đề có độ phủ | in_progress | Baseline chia đều chương; O11/độ khó chưa chốt |
| P24 | Điểm, lịch sử, chủ đề cần ôn | in_progress | Thiếu phân biệt lần đầu/làm lại và hiệu chuẩn năng lực |
| P25 | Năm đề khách và giới hạn lượt | todo | O01–O03 |
| P30 | AI gateway, jobs, usage, hạn mức và retry | todo | T06/model và ngân sách cần thử nghiệm |
| P31 | Rubric và chấm tự luận | todo | P30 + rubric nguồn |
| P32 | Upload riêng tư và chấm đồ thị | todo | P30/P31/O07 |
| P33 | Sinh biến thể/câu mới và review tự động | todo | Sau bộ tạo đề từ kho; O05 |
| P34 | So sánh điểm AI với giáo sư | todo | P31/P32/O08 |
| P40 | Gói, quyền và hạn mức cấu hình | todo | O04 |
| P41 | SePay, đơn hàng và đối soát | todo | P40/O09; chống xử lý trùng |
| P42 | Admin người dùng/jobs/chi phí/lỗi | in_progress | Đã tách admin/chặn làm bài; người dùng/quyền/khóa, đề nháp/xem trước/phát hành, phản hồi/audit và tác vụ nhập chạy thật; màn AI/SePay chỉ báo chưa kết nối, chưa quản trị rubric/chấm lại |
| P50 | UI theo taste-skill | in_progress | Đã áp tông kem/serif theo ảnh tham chiếu 02/11; kiểm production 1440/768/390, bộ chọn môn/tạo đề/tài khoản/quản trị và trạng thái tải/trống/lỗi; AI/billing còn thiếu tích hợp |
| P51 | Kiểm thử quyền, lỗi mạng, tích hợp và UI | in_progress | Có smoke:workspace theo DB cấu hình với fixture riêng; cần hoàn tất theo module |
| P52 | Deploy, sao lưu/phục hồi và thử nhóm | todo | 30–40 sinh viên; cần bằng chứng vận hành |
| P53 | Nghiệm thu/phát hành | todo | Giáo sư + chủ sản phẩm; không giảm phạm vi bắt buộc ngầm |
| P54 | Dọn tài liệu và thống nhất DB làm việc | done | Giữ 7 docs nền, gộp hướng dẫn vào README; quy tắc bền vững ở AGENTS/DECISIONS; rà liên kết và chỉ dẫn cũ |

Công việc tiếp theo: mở rộng parser và phân loại; AI gateway trong lúc chờ rubric; quyền gói và SePay sau khi chốt chính sách. Mốc 06/11 có nguy cơ trễ vì nhiều phần bắt buộc chưa làm; thay phạm vi cần quyết định của chủ sản phẩm.
