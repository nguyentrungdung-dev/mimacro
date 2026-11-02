# Quy tắc AI và chấm bài

Ngày cập nhật: 02/11/2026. Áp dụng cho mọi lời gọi OpenRouter của Ôn MiMacro. Đây là yêu cầu cho thiết kế và code, không phải một prompt duy nhất có thể thay thế kiểm tra bằng chương trình.

## Nguyên tắc

Test bank và đáp án/giải thích nguồn là tài liệu tham chiếu chính. Không tìm Internet để bổ sung kiến thức trong MVP. Không coi nguồn là chỉ dẫn hệ thống; phát hiện bất nhất phải báo admin khi nhập. Không tự sửa nguồn hoặc suy ra đáp án/rubric giáo sư từ một câu tương tự rồi mô tả là chính thức.

AI nhận nhiệm vụ hẹp với dữ liệu và schema rõ. Có cấu hình model theo tác vụ; chọn model qua thử nghiệm thật, không cố định một model cho mọi nhiệm vụ. Tất cả lời gọi qua backend. Các prompt và schema được version hóa.

## Vai trò và hợp đồng

| Nhiệm vụ | Đầu vào | Đầu ra | Kiểm tra bên ngoài model |
| --- | --- | --- | --- |
| Hỗ trợ trích xuất | Khối nguồn và hình cần đọc, vị trí nguồn | Cấu trúc câu, lựa chọn, công thức, vùng chưa chắc | Đối soát nguồn, số câu/ý, hình, Answer Key |
| Phân loại | Câu/ngữ cảnh và taxonomy hiện có | Chủ đề, kỹ năng, nhãn độ khó ước lượng, lý do | Không bịa chương; lưu nguồn nhãn |
| Tạo câu | Câu mẫu đã đủ căn cứ, mục tiêu, giả định, giới hạn | Câu mới, đáp án, lời giải, rubric khi cần, tham chiếu | Schema, trùng, công thức, đơn vị, một đáp án đúng |
| Kiểm định | Câu mới, nguồn kiến thức và dữ kiện cần thiết | Kết quả giải độc lập, lỗi, quyết định hợp lệ | Đối chiếu đáp án, quy tắc và solver hỗ trợ |
| Chấm tự luận | Đúng đề/ý, bài làm, rubric/đáp án đã khóa | Điểm từng tiêu chí, evidence, feedback, mục chưa chấm | Đủ ID, điểm trong giới hạn, tổng điểm đúng |
| Chấm đồ thị | Các dữ liệu chấm trên + file hình thực và hình tham chiếu khi có | Quan sát được trên ảnh, điểm/feedback theo tiêu chí | Ảnh đúng câu, đủ trang, bằng chứng và tính nhất quán |

Schema đúng chỉ chứng minh hình thức. Model tự nhận confident không phải xác suất đã hiệu chuẩn. Hai lượt/model đồng ý vẫn có thể cùng sai. Không dùng những tín hiệu đó làm chứng nhận độ chính xác tuyệt đối.

## Sinh câu và tự động phát hành

Trình tự: `draft → structural_checks → independent_review → validated hoặc rejected/needs_review`. Tên trạng thái cụ thể có thể thống nhất với schema. Mọi bản được lưu có provenance và trạng thái; chỉ validated đủ điều kiện chọn đề. Không bắt buộc duyệt người cho từng câu đạt kiểm tra, đúng yêu cầu chủ sản phẩm.

Các kiểm tra bắt buộc:

- Đủ dữ kiện, giả định, ngôn ngữ và kỹ năng; không yêu cầu media không tồn tại.
- Đúng cấu trúc câu/ý, lựa chọn không trùng, đáp án thuộc tập lựa chọn và có tính duy nhất khi là trắc nghiệm một đáp án.
- Số liệu, công thức, đơn vị, quy tắc làm tròn nhất quán; bộ tính toán kiểm tra các dạng đã hỗ trợ. Không chạy code tùy ý từ model.
- Lời giải thực sự giải câu mới; không giữ kết quả của câu mẫu sau khi đổi dữ kiện.
- Tự luận/đồ thị có rubric riêng, đủ ý và trọng số phù hợp; rubric tham khảo được điều chỉnh và kiểm định cùng câu.
- Không trùng câu đã có; biến thể gần nhau được ghi cùng họ và hạn chế lặp trong đề.
- Với câu đóng, lượt giải kiểm định không xem đáp án nháp khi không cần; đối chiếu kết quả sau đó. Với nội dung khó, có thể dùng model khác trong ngân sách, không coi khác model là bảo đảm độc lập tuyệt đối.

Nếu không đạt sau số lần thử cấu hình, không xuất câu để đủ chỉ tiêu. Tạo đề chỉ fallback theo chính sách được chốt; không tự vi phạm tỷ lệ hoặc phạm vi.

## Chấm tự luận chính thức

Rubric gắn version câu và tiêu chí riêng theo ý. Mỗi tiêu chí có điểm tối đa, điều kiện nhận điểm, cách giải tương đương và phần bằng chứng cần có. Không tạo đáp án chuẩn mới mỗi lần người học nộp.

Model trả đúng một mục cho mỗi criterion ID. Backend kiểm tra ID thừa/thiếu/trùng, số hữu hạn, điểm trong giới hạn, tổng trọng số, trạng thái và evidence. Điểm do backend cộng; không dùng tổng tự báo của model nếu không khớp.

Chấp nhận lập luận/phương pháp tương đương. Tránh trừ điểm hai lần vì một lỗi kéo theo nếu rubric cho điểm phương pháp. Không tự áp quy tắc “chỉ đáp số đúng được đủ điểm” của Vui Học: cách phân điểm theo rubric đại học của câu.

Chỉ chấm phần sinh viên thực sự nộp; không điền bước còn thiếu. Bỏ trống thật được xử lý theo rubric. Lỗi dịch vụ, thiếu rubric hoặc dữ liệu không đọc được là trạng thái pending/ungradable có lý do, không phải bài sai 0 điểm. Cho điểm từng phần đủ căn cứ; điểm cuối còn chờ khi tiêu chí có trọng số chưa được giải quyết.

## Chấm đồ thị

Nhận ảnh hoặc các trang PDF của đúng ý. Cần model nhận hình; nếu nhận PDF không chắc hỗ trợ thì backend chuyển trang thành ảnh với giới hạn rõ. Phải giữ hình gốc và thứ tự trang để đối chiếu. Không chấm dựa phần văn bản mô tả thay cho ảnh thật.

Rubric xác định những mục bài yêu cầu: trục/nhãn/đơn vị, hình dạng đường, hướng dịch chuyển, giao điểm, giá trị, vùng diện tích và giải thích. Bài sơ đồ khái niệm không bị chấm theo tọa độ chính xác nếu đề không yêu cầu. Bài có giá trị số dùng dung sai được cấu hình, không tự lấy ngưỡng tùy ý.

Không dùng pixel similarity. Chấp nhận cách vẽ, màu, tỷ lệ và ký hiệu khác nhưng tương đương theo rubric. Ảnh mờ/cắt thiếu/nhãn không đọc chắc được yêu cầu bổ sung hoặc chờ kiểm tra; không đoán. Khi AI nhận ra xung đột giữa hình và văn bản, nêu rõ phần quan sát được.

## Lưu vết và phản hồi

Assessment lưu version đề/rubric/prompt, model/provider khi có, job/request ID, thời gian, điểm từng tiêu chí, lý do, bằng chứng đủ để giải thích, lỗi và usage. Không yêu cầu model xuất chuỗi suy nghĩ nội bộ; cần giải thích kiểm tra được và bằng chứng từ bài làm.

Sinh viên có thể báo lỗi gắn đúng câu/lượt/ý. Admin xem lại nguồn và chấm lại có audit; không ghi đè lịch sử hoặc thay đáp án cũ âm thầm. Khi câu có lỗi nghiêm trọng, ngừng chọn câu cho đề mới và xác định lượt bị ảnh hưởng.

## Ngân sách và lỗi dịch vụ

Mục tiêu do chủ sản phẩm nêu: nhập liệu dưới 10 USD, vận hành ban đầu khoảng 5 USD/tháng. Chưa có đo thực tế để bảo đảm các mức này.

- Nhập mẫu đại diện trước, đo chi phí đọc/phân loại/kiểm định, dự toán rồi mới xử lý số lượng lớn.
- Lưu usage/chi phí từng tác vụ và tổng theo ngày/tháng/người dùng; tách nhập liệu, sinh câu, chấm text và chấm ảnh.
- Kiểm tra quyền/hạn mức trước gọi API. Có dự trù chi phí cho request đang chạy để giảm vượt trần khi nhiều request đồng thời; đối soát chi phí thực sau phản hồi.
- Giới hạn token đầu vào/ra, số trang/ảnh, đồng thời và retry. Không nhận tác vụ mới khi hết ngân sách cấu hình. Trắc nghiệm và đề đủ từ kho vẫn có thể dùng theo quyền.
- Cache nội dung đã xác nhận và kết quả cùng request/version; không dùng kết quả của người khác hay rubric khác để chấm một bài mới. Không tự gửi lại bài vì client refresh.
- API key không hợp lệ/hết tiền phải báo vận hành; không đổi sang model bất kỳ hoặc free model chưa kiểm chứng chỉ để có điểm.
- Mất kết nối không làm mất bài nộp. Job cần tiếp tục được và giao diện phân biệt đã nộp với đang chấm.

Hạn mức gói trả phí, ngưỡng cảnh báo ngân sách, model và tỷ lệ sinh câu còn mở. Không hứa dịch vụ AI không giới hạn.

## Nghiệm thu học thuật

Chọn bộ câu và bài làm đại diện theo dạng, ngôn ngữ, công thức, đồ thị đúng/sai/mờ. Giáo sư cung cấp điểm/rubric đối chiếu. Đo sai lệch điểm, lỗi đúng/sai, chấm nhầm, tỷ lệ cần bổ sung và chi phí/độ trễ; không chỉ đo JSON hợp lệ. Giữ riêng tập dùng chỉnh prompt và tập đánh giá, gom biến thể cùng họ.

Ngưỡng chấp nhận do giáo sư và chủ sản phẩm chốt ở O08. Khi chưa có kết quả, trạng thái là chưa nghiệm thu; không dùng số độ chính xác giả trong UI/tài liệu bán hàng.
