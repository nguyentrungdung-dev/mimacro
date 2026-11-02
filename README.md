# Ôn MiMacro

Công cụ học và ôn thi Kinh tế vi mô và Kinh tế vĩ mô, ưu tiên sinh viên NEU và mở cho sinh viên có nhu cầu. Giá trị chính của MVP là tạo đề có độ phủ kiến thức từ ngân hàng câu hỏi, hỗ trợ luyện tập, thi thử, chấm bài và giải thích.

Mốc mục tiêu: thứ Sáu, **06/11/2026**, theo giờ Việt Nam. Chủ sản phẩm và người xây dựng chính là người dùng; giáo sư NEU nghiệm thu học thuật; 30–40 sinh viên thử nghiệm.

## Trạng thái hiện tại

Ngày cập nhật: 02/11/2026. Đã dựng ứng dụng Next.js, PostgreSQL local riêng và nhập 10 nguồn Frank: 1.741 câu lưu, 1.739 câu đủ điều kiện theo kiểm tra cấu trúc hiện tại, 2 câu chờ xử lý lời giải. Có catalog, tạo đề trắc nghiệm theo chương, luyện/thi thử, lưu bài, chấm/giải thích và tài khoản. **Đây là mốc nền local, chưa phải MVP hoàn chỉnh:** AI tự luận/đồ thị, thanh toán, chính sách thương mại và upload quản trị chưa triển khai. Chưa nghiệm thu học thuật toàn bộ bank hoặc deploy public.

Mở local: [http://127.0.0.1:3006](http://127.0.0.1:3006). Các lệnh khởi tạo, chạy, kiểm tra và chuyển DB được ghi trong [hướng dẫn development](docs/LOCAL_DEVELOPMENT.md).

## Đọc trước khi xây dựng

| Tài liệu | Dùng để làm gì |
| --- | --- |
| [Phạm vi sản phẩm](docs/PRODUCT_SCOPE.md) | Yêu cầu đã chốt, mức ưu tiên và phần loại khỏi MVP |
| [Kiến trúc](docs/ARCHITECTURE.md) | Ranh giới module, luồng xử lý, dữ liệu và triển khai |
| [Dữ liệu và nhập tài liệu](docs/DATA_AND_IMPORT.md) | Hợp đồng nội dung, đáp án nguồn, hình và công thức |
| [Luồng sử dụng](docs/USER_FLOWS.md) | Luyện tập, thi thử, tải bài vẽ, quản trị và thanh toán |
| [Quy tắc AI](docs/AI_POLICY.md) | Tạo câu, kiểm định, chấm bài, nguồn giải thích và ngân sách |
| [Nghiệm thu](docs/ACCEPTANCE.md) | Các tình huống phải chứng minh trước khi phát hành |
| [Tiến trình](docs/PROGRESS.md) | Công việc, phụ thuộc, trạng thái và bằng chứng hoàn thành |
| [Quyết định](docs/DECISIONS.md) | Điều đã chốt, đề xuất và câu hỏi còn mở |
| [Hướng dẫn cho tác nhân lập trình](AGENTS.md) | Quy tắc đọc tài liệu, triển khai và cập nhật tiến trình |
| [Chạy và kiểm tra trên máy](docs/LOCAL_DEVELOPMENT.md) | PostgreSQL riêng, nhập mẫu, chạy ứng dụng, kiểm thử và chuyển DB |
| [Kết quả xác minh mốc local](docs/VERIFICATION.md) | Kiểm tra thực đã đạt, ảnh UI, giới hạn và phần chưa triển khai |

Hướng dẫn chuẩn bị triển khai thử: [Vercel](docs/VERCEL_DEPLOYMENT.md). Cấu hình đã bổ sung; chưa có URL cloud được xác minh.

## Bằng chứng và tài nguyên

- [Báo cáo kiểm tra dữ liệu mẫu](data/audits/sample-bank-audit.json): đường dẫn nguồn, cấu trúc và các phát hiện đã ghi nhận. Không công khai file này qua giao diện sản phẩm.
- [Taste skill](.agents/skills/taste-skill/SKILL.md): gói đầy đủ đã cài; màn hình học và quản trị dùng hướng dẫn `app-screens`, trang giới thiệu dùng hướng dẫn dành cho trang công khai.
- Tài liệu test bank gốc nằm ngoài thư mục dự án. Giữ nguyên nguồn, không sửa trực tiếp và không đưa file gốc vào kho mã công khai.

## Cách giữ phạm vi

Yêu cầu đã chốt trong PRODUCT_SCOPE là chuẩn sản phẩm. DECISIONS phân biệt rõ quyết định, đề xuất và điểm chưa chốt. Khi thay đổi phạm vi, ghi quyết định rồi cập nhật tài liệu liên quan và tiêu chí nghiệm thu; không chỉ sửa checklist. Một chức năng được đánh dấu hoàn thành khi có bằng chứng phù hợp, không phải khi chỉ có giao diện hoặc dữ liệu giả.

## Việc bắt đầu tiếp theo

Hoàn thiện quản trị nhập/sửa và phân loại, sau đó AI gateway/rubric/chấm tự luận và ảnh; bổ sung chính sách miễn phí/trả phí và tích hợp SePay khi có cấu hình. Giữ tiến trình và bằng chứng kiểm tra trong PROGRESS; không coi mốc nền local là đã hoàn thành toàn bộ MVP.
