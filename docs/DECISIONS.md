# Quyết định và điểm còn mở

Ngày cập nhật: 02/11/2026. “Đã chốt” là yêu cầu người dùng; “Định hướng” là đề xuất kiến trúc đã trình bày và được tiếp tục dùng làm nền; “Còn mở” chưa được phép biến thành chính sách ngầm.

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
| D13 | Đã chốt | Dùng taste-skill người dùng chỉ định | Gói nằm tại ../.agents/skills/taste-skill |

## Định hướng kỹ thuật

| ID | Trạng thái | Định hướng | Lý do |
| --- | --- | --- | --- |
| T01 | Định hướng | Một ứng dụng có module; tác vụ AI/nhập liệu chạy nền | Phù hợp quy mô thử nghiệm và thời hạn |
| T02 | Định hướng | Tách môn bằng dữ liệu và bộ quy tắc, không microservice từng môn | Giới hạn ngữ cảnh AI mà không tăng chi phí vận hành |
| T03 | Định hướng | Đọc cấu trúc DOCX trước OCR/vision | Mẫu Frank có văn bản và đáp án đọc được trực tiếp |
| T04 | Định hướng | Bộ chấm trắc nghiệm độc lập AI | Tính đúng ổn định và giảm chi phí |
| T05 | Còn mở một phần | Phiên bản stack, auth, storage, hosting và tác vụ nền | Stack lõi theo T08, engine/dev DB theo T09–T10; phải kiểm chứng trên đích triển khai |
| T06 | Còn mở | Model cụ thể theo nhập liệu/sinh câu/review/chấm ảnh | Chọn qua mẫu thật, giá và giới hạn đang áp dụng |
| T07 | Đã chốt ràng buộc 02/11 | Không dùng database PostgreSQL/Neon cá nhân của chủ sản phẩm cho Ôn MiMacro; ưu tiên database do công ty quản lý | Không sao chép DATABASE_URL hay dùng chung bảng/tài khoản DB của Vui Học |
| T08 | Đã triển khai local 02/11 theo lệnh bắt đầu code | Next.js 16.4.2, React 19.2, TypeScript, Node.js 24, CSS/Lucide, Zod; OpenRouter là tích hợp dự kiến | package-lock khóa phụ thuộc; UI theo taste-skill; chưa có code AI, không kéo TTS/video vào phạm vi |
| T09 | Đã xác nhận và dựng local 02/11 | Công ty dùng PostgreSQL; cụm local riêng PostgreSQL 15.14 qua pg, cổng 55438, DB mimacro | Chưa kết nối công ty; hosting/file/job cloud còn mở |
| T10 | Đã triển khai local 02/11 | Migration SQL có checksum và khóa transaction; cấu hình kết nối/file tách riêng | Không dùng dịch vụ DB cá nhân cũ. Không truy cập DB công ty khi chưa được cấp cấu hình/quyền |
| T11 | Quyết định kỹ thuật local 02/11 | Phiên opaque có token hash trong DB; mật khẩu scrypt + salt; dùng session cookie HttpOnly | Không phụ thuộc auth cloud. Đăng xuất thu hồi bằng expires_at để giữ tham chiếu lịch sử |
| T12 | Quyết định kỹ thuật local 02/11 | File media private ở .local/storage; chỉ serve hình gắn lượt làm của người có quyền | Kho production/ảnh bài làm/upload quản trị chưa làm. Không đóng gói thư mục riêng tư vào build |
| T13 | Quyết định kỹ thuật local 02/11 | Bộ trộn chia đều số câu theo chương, chống trùng chính xác qua stem/options/media; độ khó chưa gán | Phân bổ là baseline có thể đổi, không phải chuẩn đề NEU đã được giáo sư nghiệm thu; họ biến thể ngữ nghĩa chưa có |

Stack và auth local đã thực hiện theo T08–T12. Cloudflare, D1, R2, Vercel Blob hoặc Workflow SDK chưa được chọn chỉ vì từng được nêu trong trao đổi. Khi chọn stack triển khai public/job nền, ghi bằng chứng chạy luồng mẫu, giới hạn chi phí và lý do tại đây. Có thể tự chọn chi tiết kỹ thuật trong phạm vi được giao mà không hỏi lại từng thư viện.

## Chuẩn bị Vercel ngày 02/11/2026

T14 — Theo yêu cầu người dùng, chuẩn bị app để deploy Vercel; chưa chọn gói, tạo tài nguyên hay deploy live. Giữ PostgreSQL riêng; bổ sung tùy chọn MEDIA_STORAGE=postgres cho hình bank nhỏ (43 hình, khoảng 944 KB). Bytes lưu qua migration bổ sung, đối chiếu hash khi nhập; quyền xem hình giữ ở backend. Local vẫn đọc filesystem. Không dùng cách này để coi upload bài làm đã hoàn thành. APP_ORIGIN bắt buộc HTTPS trên Vercel; pool nhỏ và idle timeout cho bản test. Chi tiết và giới hạn ở VERCEL_DEPLOYMENT.md. Không thay đổi T07 hoặc điều kiện dùng thương mại của Vercel.

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
| O10 | Hosting/auth/storage, thông tin truy cập và ngân sách ngoài API; version/quyền/network DB công ty khi chuyển | Người xây dựng + chủ sản phẩm khi cần chi phí/quyền | Prototype local với PostgreSQL riêng; engine công ty đã xác nhận PostgreSQL |
| O11 | Phân bổ chương và chuẩn độ khó khi tạo đề; thời lượng theo cấu hình | Chủ sản phẩm/giáo sư; trước nghiệm thu bộ đề | Taxonomy theo nguồn, bộ phân bổ có ràng buộc |

Không dùng dữ liệu giả để lấp O06; không tự mở bán khi O04/O09 chưa giải quyết. Điểm chưa chốt phải hiển thị là chưa cấu hình trong quản trị, không tạo gói “không giới hạn” ngầm.

## Cách ghi thay đổi

Mỗi quyết định mới có ngày, nguồn quyết định, trạng thái, lựa chọn, lý do, ảnh hưởng đến phạm vi/chi phí/dữ liệu và ID yêu cầu liên quan. Khi thay thế quyết định, đánh dấu bản cũ là đã thay thế và liên kết bản mới. Đồng bộ PRODUCT_SCOPE, ACCEPTANCE và PROGRESS trong cùng thay đổi có liên quan.
