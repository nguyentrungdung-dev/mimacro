# Dữ liệu và nhập tài liệu

Ngày cập nhật: 02/11/2026. Đây là hợp đồng dữ liệu mục tiêu, chưa phải schema database đã triển khai. Schema vật lý và migration phải bảo toàn các quan hệ dưới đây.

## Bằng chứng mẫu

Nguồn đối chiếu: [báo cáo mẫu](../data/audits/sample-bank-audit.json), chứa đường dẫn 11 file đã kiểm tra. Mười file Frank có 1.741 mục Answer Key liên tục theo từng file, chưa loại trùng và chưa xác minh học thuật từng câu. Đã đếm 264 mục media và 228 phần tử bảng trong 11 file; đó không phải số đồ thị hoặc bảng dữ liệu duy nhất. Không dùng số lượng paragraph đánh số làm số câu: nó gồm cả đáp án và nội dung bảng.

| Nhóm | Chương 1 | Chương 2 | Chương 3 | Chương 4 | Chương 5 | Tổng mục Answer Key |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Frank Macro | 152 | 174 | 195 | 159 | 220 | 900 |
| Frank Micro | 152 | 174 | 195 | 165 | 155 | 841 |

Các chương đầu có nhiều câu dùng chung hoặc biến thể số/liên quan lựa chọn. Không gộp hai câu chỉ vì stem giống. Mẫu Frank là tiếng Anh; mẫu tiếng Việt hiện là Vi mô CLC. Chưa suy ra có đủ cả bốn nhóm hay toàn bộ chương trình.

CLC_HaLE gồm bốn đề 90 phút, mỗi đề có phần Đúng/Sai và giải thích 4 điểm, câu ngắn 2 điểm, bài tập 4 điểm. Có các ý vẽ đồ thị và năm công thức OMML. Đã xem bốn trang render; đáp án/rubric chưa có trong file mẫu, chủ sản phẩm sẽ bổ sung.

## Các thực thể cần có

| Thực thể | Dữ liệu và quan hệ bắt buộc |
| --- | --- |
| SourceDocument | ID, tên, hash file, dạng file, nơi lưu riêng tư, phiên bản, môn/ngôn ngữ nguồn, quyền truy cập, trạng thái nhập |
| SourceExam | Đề/chương trong file; thời lượng, cấu trúc phần, thang điểm, nguồn gốc; không mặc định một file một đề |
| SourceLocator | Trang nếu đã xác minh, thứ tự khối/paragraph/bảng/ảnh/OMML để đối chiếu; không tự bịa số trang từ XML |
| ContentBlock / MediaAsset | Văn bản, công thức, bảng, hình theo thứ tự đọc; quan hệ tới câu/ngữ cảnh/đáp án; phân biệt hình câu hỏi với logo/trang trí |
| QuestionFamily | Nhóm câu cùng mẫu/kỹ năng, dùng chống lặp; không thay thế ID câu |
| QuestionVersion | Stem, lựa chọn, dạng, ngôn ngữ, giả định, đơn vị, ngữ cảnh, ý con, nguồn, version, trạng thái kiểm định |
| Option | ID ổn định, nội dung, thứ tự gốc; nhãn hiển thị được tính theo lượt làm |
| AnswerKey / Explanation | Đáp án chuẩn theo ID, lời giải nguồn, trường hợp chấp nhận, đơn vị, sai số/làm tròn khi áp dụng, provenance |
| RubricVersion / Criterion | ID ý/tiêu chí, bằng chứng cần quan sát, điểm tối đa, đáp án/phương pháp tương đương và điều kiện chấm |
| Topic / CurriculumMapping | Chủ đề kiến thức, chương trong từng nguồn/chương trình, track được phép dùng |
| DifficultyEstimate | Nhãn, nguồn ước lượng, phiên bản, số quan sát; tách nhãn nguồn với AI ước lượng và dữ liệu thực nghiệm |
| ImportRun / ContentIssue | Phiên nhập, parser/model, thống kê, vấn đề, mức độ, vị trí nguồn, cách xử lý và audit |
| ExamBlueprint / ExamSnapshot | Ràng buộc yêu cầu, phân bổ thực tế, seed, phiên bản câu, thứ tự và trọng số đã khóa |
| Attempt / Response / Attachment | Chủ sở hữu/phiên khách, chế độ, hạn giờ, câu trả lời theo ý, file bài làm riêng tư, trạng thái nộp |
| Assessment / AssessmentPart | Điểm từng tiêu chí, phần pending, feedback, evidence, rubric/model/prompt version, thời điểm và lịch sử chấm lại |
| AIJob / AIUsage | Input version/hash, mục đích, trạng thái, retry, usage/chi phí, lỗi; không lưu bí mật |
| Account / GuestSession / Entitlement | Danh tính, role, quyền và hạn mức có hiệu lực |
| Order / PaymentEvent | Giá snapshot, trạng thái, mã đối soát, giao dịch duy nhất và lịch sử cấp quyền |

## Các bất biến

- Câu có nhiều ý giữ quan hệ cha/con và ngữ cảnh chung. Mỗi ý có kiểu trả lời và trọng số riêng; không mất yêu cầu khi tách câu.
- Đáp án trắc nghiệm trỏ Option ID. Không giữ “B” làm đáp án duy nhất sau khi xáo thứ tự.
- Trong đề gốc giữ nguyên dữ kiện, thứ tự, số câu, hình và điểm. Phân tách để lưu trữ không được làm đổi nội dung hiển thị.
- Mọi câu dùng được phải có dữ kiện/media đầy đủ và đáp án hoặc rubric phù hợp. Câu thiếu nguồn tham chiếu vẫn lưu nhưng không tự đưa vào bài chấm chính thức.
- Một bản lưu có thể có nhiều nguồn xuất hiện. Khử trùng chỉ khi văn bản, lựa chọn, media, ngữ cảnh, đáp án và điều kiện tương ứng đã được kiểm tra; giữ tất cả provenance.
- Câu khác số liệu, thứ tự/phần lựa chọn hoặc đáp án là biến thể cần kiểm tra, không tự đồng nhất. Cùng biểu đồ không có nghĩa cùng câu.
- Không có nội dung vẫn hiện như có: thiếu lời giải, đáp án hoặc hình phải có trạng thái, không điền câu mẫu giả.
- Attempt giữ snapshot để sửa ngân hàng không làm biến đổi kết quả cũ.

## Pipeline nhập

1. Kiểm tra file, hash chống nhập lặp, lưu nguồn nguyên trạng và tạo ImportRun.
2. Đọc DOCX qua OOXML theo thứ tự; trích paragraph/run, bảng, ảnh/relationship, danh sách đánh số và công thức OMML. Với PDF, thử text/layout trước; chỉ OCR/vision phần cần.
3. Xác định đề/chương, phần câu hỏi và Answer Key. Ghép bằng khóa nguồn + đề + số câu, không chỉ số câu toàn file.
4. Tạo câu và ý con, giữ ngữ cảnh, media, lựa chọn và mapping đáp án/giải thích. Không bỏ công thức vì bộ đọc text không thấy.
5. Kiểm tra tính liên tục, câu thiếu/trùng, đáp án ngoài lựa chọn, số ý/rubric, hình thất lạc, công thức trống, tổng điểm và phụ thuộc nhóm.
6. Gắn taxonomy dựa nguồn; dùng AI cho phân loại ngữ nghĩa khi cần, lưu nhãn ước lượng riêng. Không ép độ khó thành đã xác nhận.
7. Xuất báo cáo nhập ngay khi hoàn thành đợt kiểm tra; lỗi từng phần hiện sớm. Nội dung đủ điều kiện có thể chuyển trạng thái riêng; không đánh dấu cả tài liệu sạch khi còn lỗi.

Trạng thái nhập đề xuất: `uploaded → extracting → validating → ready hoặc needs_attention hoặc failed`. Trạng thái câu đề xuất: `draft`, `validated`, `needs_review`, `rejected`, `retired`. Giá trị enum có thể điều chỉnh trong schema nhưng không được mất ý nghĩa.

## Phân loại vấn đề

| Loại | Ví dụ | Xử lý |
| --- | --- | --- |
| Trích xuất | Mất công thức, sai thứ tự bảng, ảnh không gắn câu | Chặn câu liên quan, kiểm tra parser và nguồn |
| Ghép đáp án | Trùng số câu giữa hai đề, thiếu Answer Key | Giữ chưa đủ căn cứ; không để AI đoán |
| Lời giải nguồn | Bước biến đổi không khớp phương trình dù đáp án cuối đúng | Báo admin, giữ nguyên bản; sửa có phiên bản và lý do |
| Phạm vi nội dung | Câu nền tảng xuất hiện cả Micro/Macro | Lưu mapping nhiều phạm vi, không đổi câu vì tên file |
| Nguồn thiếu tham chiếu | File CLC hiện chưa có đáp án/rubric | Dùng khảo sát định dạng, chưa chấm chính thức từ dữ liệu đó |

Hai phát hiện đã ghi trong audit: Macro chương 3 câu 195 có dòng `90=4P` thay vì `80=4P`; Micro chương 3 câu 195 có dòng `55=4P` thay vì `60=3P`. Các đáp án cuối tương ứng vẫn khớp phương trình đề. Không diễn giải phát hiện này thành kết luận toàn bộ bank sai hoặc đáp án cuối hai câu sai.

## Bộ dữ liệu dùng kiểm thử

Chọn mẫu đại diện gồm câu text, bảng, ảnh, công thức, nhóm câu, đề nhiều phần và câu có lời giải bất nhất. Đối chiếu thủ công mẫu chuẩn với nguồn để có expected output; dùng số lượng Answer Key làm đối soát, không làm bằng chứng mọi câu đã đọc đúng. Tách mẫu dùng chỉnh prompt/parser khỏi mẫu nghiệm thu; giữ các biến thể cùng họ trong cùng nhóm để tránh đánh giá quá lạc quan.

## Hình ngân hàng trong PostgreSQL

Migration 002 bổ sung media.data (bytea) để phục vụ bank nhỏ từ PostgreSQL. `db:import-media` nhập bytes nguyên gốc, kiểm SHA-256 theo ID, chạy lại không ghi đè khác biệt và rollback toàn bộ khi lỗi. Không sửa nguồn hoặc trạng thái câu. Backend chỉ đọc bytes sau kiểm tra quyền lượt làm/mở lời giải. Đây không phải kho bài làm upload. Dùng DB đang cấu hình trong .env.local.

## Quản trị phiên bản đã triển khai 02/11

Hướng dẫn thao tác ngắn ở README. Migration 003 lưu baseline và revision bất biến qua API; bản hiện hành ở questions. Sửa giữ ID/thứ tự lựa chọn, source ID/số câu, media và chapter; cho sửa nội dung/đáp án/lời giải/chủ đề kèm lý do. Sửa luôn chuyển chờ kiểm tra, bản lỗi vẫn lưu riêng với checks; HTML không an toàn bị chặn. Kiểm tra lại không sửa dữ kiện hoặc giải toán. Admin xác nhận nguồn và xử lý issue mới mở đủ điều kiện; issue giữ mô tả gốc và thêm thông tin xử lý. Không gọi OpenRouter và không nghiệm thu học thuật ngầm.

## Nhập qua quản trị

Migration 004 có source_uploads lưu nguyên bytes DOCX/hash/metadata/người gửi/trạng thái/báo cáo trong DB đang cấu hình. Giới hạn kỹ thuật file 25 MB, ZIP tối đa 2.000 entries/80 MB giải nén, mỗi part tối đa 30 MB; chặn traversal/encryption/DTD/entity/OMML và media không đọc được. Parser Python chạy với timeout 45 giây, không nhận chỉ thị từ nội dung hoặc gọi AI; output ghi bulk transaction vào sources/questions/media/revisions/issues, toàn bộ câu mới needs_review. File trùng không ghi đè; lỗi giữ file và báo cáo để thử lại, phiên processing quá hai phút có thể nhận lại. Chưa hỗ trợ DOC cũ/PDF/CLC nhiều phần/OMML hoặc ảnh trong lựa chọn. Đây không phải upload bài làm của người học; không áp các giới hạn này vào O07.
