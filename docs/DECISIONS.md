# Quyết định và điểm còn mở

Ngày cập nhật: 02/11/2026. Chỉ giữ quyết định còn hiệu lực và thông tin cần chốt; yêu cầu hiện tại của người dùng ưu tiên hơn hướng cũ. Yêu cầu sản phẩm đầy đủ ở PRODUCT_SCOPE.md.

## Quyết định sản phẩm

| ID | Trạng thái | Quyết định | Hệ quả |
| --- | --- | --- | --- |
| D01 | Đã chốt | Tên Ôn MiMacro, ưu tiên NEU, mở cho sinh viên khác | Không mang nhận diện Vui Học sang |
| D02 | Đã chốt | Dùng OpenRouter; bỏ AI local và offline | Không đóng gói model hay cache offline |
| D03 | Đã chốt | 4 nhóm môn/ngôn ngữ | Nội dung và thống kê có phạm vi rõ |
| D04 | Đã chốt | Tạo đề từ kho là giá trị cốt lõi | Lắp ráp và kiểm tra độ phủ trước khi tối ưu sinh câu |
| D05 | Đã chốt | Giải thích nguồn là ưu tiên | MVP không cần AI tìm nguồn Internet |
| D06 | Đã chốt | Câu AI được lưu và duyệt tự động | Có trạng thái nháp/đạt/lỗi; không phải mọi bản lưu đều phát hành |
| D07 | Đã chốt | AI chấm tự luận chính thức theo rubric | Lưu phiên bản, tiêu chí và lịch sử chấm |
| D08 | Đã chốt | Sinh viên tải file bài vẽ; AI chấm đồ thị | Upload riêng theo câu/ý; không mở upload tài liệu nguồn |
| D09 | Đã chốt | Giá 150.000 đồng/tháng | Quyền gói và cách tính chu kỳ cần chốt trước mở bán |
| D10 | Đã chốt | 5 đề khách, 1 lần mỗi đề | Chi tiết phân bổ và tiêu thụ lượt còn mở |
| D11 | Đã chốt | Không cho tải đề gốc, không xuất PDF/in | File nguồn lưu riêng tư |
| D12 | Đã chốt | Đáp án CLC sẽ được gửi bổ sung | Hiện chỉ dùng file đó khảo sát định dạng, chưa đủ căn cứ chấm |
| D13 | Đã chốt | Dùng taste-skill người dùng chỉ định | Gói nằm tại .agents/skills/taste-skill |

## Kỹ thuật và cách làm hiện hành

| ID | Quyết định | Hệ quả |
| --- | --- | --- |
| T01–T02 | Một ứng dụng tách module, phân môn bằng dữ liệu | Không thêm agent điều phối/microservice/vector DB khi chưa có nhu cầu |
| T03–T04 | Đọc cấu trúc DOCX trước OCR; chấm trắc nghiệm bằng code | Không đoán đáp án hoặc gọi AI chỉ để so lựa chọn |
| T05/T08 | Next.js 16.4.2, React 19.2, TypeScript, Node.js 24, pg, Zod, CSS/Lucide | Hosting public và job nền chưa hoàn tất; OpenRouter chưa kết nối |
| T06 | Model AI còn mở | Chọn theo mẫu thật, giá và hạn mức; không coi model chưa thử là đã chọn |
| T11 | Phiên opaque, token hash trong DB; scrypt + salt; cookie HttpOnly | Backend xác nhận danh tính/quyền; role không lấy từ client |
| T13 | Bộ trộn chia đều chương, chống trùng chính xác, xáo stable option ID | Baseline kỹ thuật, chưa phải chuẩn NEU; độ khó/họ gần nghĩa còn thiếu |
| T14/T19 | MEDIA_STORAGE=postgres, hình bank private trong DB | 43 hình đã chuyển; upload bài làm là phần riêng chưa triển khai |
| T16 | Bản hiện hành ở questions, snapshot ở question_revisions; khóa transaction + expectedVersion | Giữ baseline và revision; sửa bank không tự sửa/chấm lại lịch sử |
| T17 | Sửa thủ công chuyển needs_review; mở lại cần kiểm tra cấu trúc và xác nhận nguồn/issue | Không thay quy trình tự kiểm định câu AI D06; không coi kiểm tra code là nghiệm thu học thuật |
| T18–T20 | Theo chỉ thị mới, **mọi công việc dùng DATABASE_URL trong .env.local; không dùng DB local riêng** | Đã áp 001–003 và chuyển adminsci, giữ mật khẩu; không chuyển dữ liệu smoke/phiên local. Thay thế hướng DB local T09–T10/T15 và giới hạn đích cũ của T07; vẫn không dùng dữ liệu Vui Học |
| T21 | Theo chỉ thị mới, báo kết quả trong chat; không tự sinh docs theo mỗi lần code | Giữ bảy tài liệu nền, gộp hướng dẫn vào README; chỉ thêm file khi có giá trị sử dụng lâu dài hoặc người dùng yêu cầu |

## Điểm cần chốt trước chức năng phụ thuộc

| ID | Điểm còn mở | Ai quyết định / khi cần | Công việc vẫn làm được |
| --- | --- | --- | --- |
| O01 | 5 đề miễn phí tổng cộng hay chia theo môn/ngôn ngữ; chọn đề nào | Chủ sản phẩm; trước công bố catalog khách | Catalog và cấu hình phân quyền |
| O02 | Lượt khách tính khi bắt đầu hay khi nộp; chính sách tiếp tục/lỗi mạng | Chủ sản phẩm; trước bật giới hạn thật | Lưu phiên và tiếp tục cùng lượt |
| O03 | Quyền thành viên miễn phí, việc gộp lịch sử khách sau đăng ký | Chủ sản phẩm; trước khóa quyền | Tài khoản, lịch sử và quyền dạng cấu hình |
| O04 | Gói trả phí: số lượt, số câu AI, chấm tự luận/ảnh, cách tính tháng | Chủ sản phẩm; trước mở bán | Module hạn mức, entitlement, đơn hàng |
| O05 | Tỷ lệ câu AI và cách làm tròn theo số câu; khi ngân hàng thiếu | Chủ sản phẩm; trước bật sinh câu cho người học | Bộ tạo đề từ kho; bộ sinh có cấu hình và test |
| O06 | Đáp án/rubric CLC và tài liệu còn lại cho 4 nhóm | Chủ sản phẩm cung cấp; trước phát hành nội dung | Nhập cấu trúc và chuẩn hóa nguồn đã đủ đáp án |
| O07 | Giới hạn ảnh/PDF, số trang, thời gian lưu file, quy trình chấm lại | Chủ sản phẩm + người xây dựng; trước mở upload | Giao diện và pipeline có cấu hình |
| O08 | Ngưỡng nghiệm thu điểm AI so với giáo sư, bộ bài vẽ thật | Giáo sư + chủ sản phẩm; trước công bố AI chấm đạt chuẩn | Chuẩn bị đánh giá, log và bảng đối chiếu |
| O09 | Tài khoản SePay, tài khoản nhận tiền, hình thức tích hợp và kiểm thử | Chủ sản phẩm; trước thanh toán live | Mock, webhook, đối soát và sandbox nếu hỗ trợ |
| O10 | Hosting/auth/storage, thông tin truy cập và ngân sách ngoài API; version/quyền/network DB công ty khi chuyển | Người xây dựng + chủ sản phẩm khi cần chi phí/quyền | Phát triển trên DB đang cấu hình; hosting public và phục hồi còn phải xác minh |
| O11 | Phân bổ chương và chuẩn độ khó khi tạo đề; thời lượng theo cấu hình | Chủ sản phẩm/giáo sư; trước nghiệm thu bộ đề | Taxonomy theo nguồn, bộ phân bổ có ràng buộc |

Không dùng dữ liệu giả để lấp O06; không tự mở bán khi O04/O09 chưa giải quyết. Điểm chưa chốt phải hiển thị là chưa cấu hình trong quản trị, không tạo gói “không giới hạn” ngầm.

D14 — 02/11/2026, chỉ thị người dùng: admin chỉ quản trị, không được tạo/làm/nộp bài dưới vai trò admin. Tách điều hướng và chặn backend. Admin tải bank DOCX, xử lý câu lỗi/chưa duyệt, sửa và phát hành có phiên bản. Không suy diễn yêu cầu này thành bắt duyệt tay mọi câu AI đã qua kiểm định; D06 vẫn áp dụng cho câu đạt kiểm định.

T22 — Giữ xác minh chứng chỉ/hostname của pg bằng sslmode=verify-full. Chuẩn hóa alias prefer/require/verify-ca về verify-full nếu URL không chủ động chọn uselibpqcompat=true; giữ nguyên đích kết nối và các tham số khác. Không dùng rejectUnauthorized=false để bỏ cảnh báo.
