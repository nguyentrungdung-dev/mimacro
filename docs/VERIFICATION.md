# Xác minh mốc nền local

Ngày kiểm tra: 02/11/2026, giờ Việt Nam. Bản build production local `GWAXKpdZnfF1wCPwBNZlj`, chạy tại http://127.0.0.1:3006 với cụm PostgreSQL riêng 127.0.0.1:55438. Đây là kiểm tra mốc nền trắc nghiệm; không phải nghiệm thu toàn bộ MVP, chất lượng học thuật hoặc chấm AI.

## Kết quả thực thi

| Kiểm tra | Kết quả | Bằng chứng |
| --- | --- | --- |
| Unit và kiểm tra dữ liệu | 5/5 đạt | tests/exams.test.ts qua npm test |
| TypeScript | Đạt | npm run typecheck |
| Production build | Đạt, không còn warning tracing file riêng tư | npm run build, build ID trên |
| HTTP và trình duyệt Chrome với DB thật | 19/19 kiểm tra đạt | scripts/smoke.mjs; .local/reports/smoke.json |
| Kho đề theo taste-skill | 0 FAIL, 0 WARN ở 1440/768/390 | .taste-skill/inspect/catalog-gate/report.json |
| Tạo đề theo taste-skill | 0 FAIL, 2 WARN ở 1440/768/390 | .taste-skill/inspect/builder-gate/report.json; giải trình bên dưới |
| Source lint theo skill | 0 FAIL, 3 WARN có lý do | Shadow chỉ ở modal; 2 padStart chỉ dùng đồng hồ |
| Kiểm tra ảnh | Đã mở 12 ảnh gate của catalog/builder và 3 ảnh đồ thị ở 1440/768/390 | .taste-skill/inspect; không suy luận chất lượng chỉ từ code |
| Chi phí OpenRouter | Không gọi API có phí trong đợt này | Extractor đọc OOXML, MC chấm bằng code; smoke paidApiCalls=0 |

## Các luồng đã chứng minh

1. Catalog lấy đúng 10 nguồn trong PostgreSQL, không dùng dữ liệu giả thay thế DB.
2. Trước nộp thi thử, response không có đáp án, lời giải, solution media hoặc review.
3. Câu trả lời được lưu nhưng chưa mở key thi thử.
4. Phiên khách khác không đọc được attempt.
5. Mutation sai Origin bị từ chối.
6. Hình câu hỏi chỉ đọc được qua phiên sở hữu lượt làm được gán hình.
7. Luyện tập chỉ mở review câu đã gửi và không đổi lần trả lời đầu đã được chấm.
8. Đề trộn 12 câu có đủ 3 chương chọn, không chọn hai câu đang chờ xử lý.
9. Cấu hình không đủ câu trả lỗi thay vì thay phạm vi âm thầm.
10. Hạn giờ do backend xác nhận và kết thúc lượt làm.
11. Câu chọn vẫn còn sau khi reload trình duyệt.
12. Lỗi autosave giữ lựa chọn tạm và chặn nộp cho đến khi lưu lại thành công.
13. Nộp, mở lời giải, tính điểm đúng trọng số trắc nghiệm và nộp lặp không đổi điểm.
14. Đồ thị nguồn tải và hiển thị thật trên desktop/tablet/điện thoại, không tràn trang.
15. Modal bắt đầu giữ focus bàn phím bên trong và đóng bằng Escape.
16. Catalog và form tạo đề không tràn trang ở ba kích thước.
17. Đăng ký tạo tài khoản riêng, không tự gộp bài khách.
18. Đăng xuất sau khi có bài làm và đăng nhập lại vẫn đọc được đúng lịch sử tài khoản.
19. Không có lỗi JavaScript runtime trong đợt kiểm tra trình duyệt.

Unit tests bổ sung tính đúng stable option ID sau xáo; không lộ key ở projection; phân bổ theo chương, khử trùng; trường hợp câu dùng chung không làm một chương mất quota; đối soát đủ 1.741 câu/Answer Key và giữ công thức subscript/ảnh mẫu. Bộ chọn dùng matching theo slot của blueprint để không bù câu từ chương khác một cách âm thầm.

## Nhận xét giao diện

Hướng chọn: **Achromatic ledger**, seed **1240087745**, không redraw. Giữ font Geist thực được tải local với bộ ký tự tiếng Việt; nền xanh xám nhẹ và wordmark có hai đường giao nhau của đồ thị. Phần riêng của sản phẩm là phạm vi chương và bản phân bổ đề tính từ lựa chọn thật. Không có ảnh stock hoặc số liệu marketing bịa; biểu đồ trong câu là hình của nguồn.

| Màn hình | Câu hỏi chính | Đánh giá bằng ảnh |
| --- | --- | --- |
| Kho đề | Tôi muốn ôn môn/ngôn ngữ/chương nào? | Nhóm nội dung, số câu thật và nút mở đề đọc được; nhóm tiếng Việt hiển thị chưa có dữ liệu |
| Tạo đề | Đề sẽ phủ những chương nào và có bao nhiêu câu? | Form và preview dùng cùng cấu hình; font phần hướng dẫn đã tăng để dễ đọc |
| Làm/xem lại bài | Tôi trả lời câu này thế nào và vì sao đúng/sai? | Giữ đồ thị, lựa chọn, review và nguồn; ảnh source vẫn đọc được trên điện thoại |

Các điểm app-screen đã rà: nội dung chính đọc trước; cùng lề; số thống kê khớp dữ liệu; màu chủ yếu ở phân bổ/tiến độ và kết quả; zero không bị giấu; đồ thị nguồn giữ trục/nhãn; điều hướng gập ở điện thoại; modal/focus có kiểm tra thực.

Hai WARN còn giữ ở form tạo đề có lý do:

- `ragged-row`: preview chỉ là bản tóm tắt gắn với form dài, giữ chiều cao theo nội dung để không kéo dài thành một khối rỗng; không phải hai thẻ dữ liệu ngang hàng.
- `panel-void` 42px: khoảng tách giữa thông tin tỷ lệ dạng bài và nút tạo đề giúp phân biệt nội dung với hành động xác nhận, không phải phần rỗng do ép bằng chiều cao cột bên cạnh.

Giới hạn giao diện hiện tại: chưa có admin/AI/billing UI; danh sách câu của bộ gốc dài trên điện thoại; còn có thể tinh chỉnh mật độ và cách mở bảng câu. Không có điểm số đánh giá thiết kế từ người dùng thật hoặc tuyên bố chất lượng tuyệt đối.

## Chưa được xác minh hoặc chưa triển khai

Chấm tự luận/ảnh bằng AI, sinh câu mới, rubric CLC, SePay, năm lượt khách/gói trả phí, khôi phục mật khẩu, quản trị upload/sửa, độ khó, họ câu gần nghĩa, backup/restore, deploy public và tải đồng thời sinh viên. Chưa rà học thuật toàn bộ 1.741 câu, chưa xác nhận nguồn tiếng Việt đủ bốn nhóm. Điểm thống kê hiện tổng hợp lượt hoàn thành, chưa là ước lượng năng lực đã hiệu chuẩn.

Các bài/tài khoản do smoke tạo nằm trong DB local và có danh tính kiểm thử riêng. Không dùng chúng như dữ liệu người học thật hoặc bằng chứng nghiệm thu giáo sư. Không xóa dữ liệu người dùng để làm sạch test.

## Bổ sung cấu hình Vercel — 02/11/2026

- 8/8 unit/data tests đạt; TypeScript và production build đạt, build cuối không warning.
- Migration 002 chạy trên PostgreSQL local riêng. `db:import-media` chạy hai lần thành công: 43 hình, 882.125 bytes, SHA-256 đối chiếu ID; không sửa nội dung bank.
- Production local chạy với MEDIA_STORAGE=postgres: 19/19 smoke đạt, gồm origin khác bị từ chối, ownership bài/hình, không lộ đáp án, autosave, deadline, nộp lặp, đăng nhập và hình tải được ở desktop/tablet/phone. Kết quả `.local/reports/smoke.json`; không có thay đổi UI hoặc đánh giá ảnh thủ công bổ sung trong lượt này.
- Chưa deploy Vercel, chưa xác minh TLS/pooler/DB từ xa hoặc quyền gói; chưa thực hiện sao lưu/phục hồi cloud. P52 chưa hoàn thành. Không gọi API có phí.
