# Phạm vi MVP Ôn MiMacro

Ngày cập nhật: 02/11/2026. Các mục ghi “đã chốt” xuất phát từ trao đổi của chủ sản phẩm. Thông số còn mở nằm trong DECISIONS và chưa được dùng làm cam kết thương mại.

## Mục tiêu đã chốt

Sinh viên tạo được đề mới tương tự bằng cách ghép các câu từ nhiều nguồn trong kho; có thể xen một tỷ lệ nhỏ câu AI tạo. Đề phải phù hợp cấu hình và có độ phủ kiến thức, không chỉ lấy ngẫu nhiên đủ số câu.

Đối tượng ban đầu là sinh viên NEU, mở cho người học khác. Có bốn nhóm: Vi mô tiếng Việt, Vi mô tiếng Anh, Vĩ mô tiếng Việt, Vĩ mô tiếng Anh. Độ phủ được xác định từ nội dung ngân hàng đã nhập, không tự tuyên bố có toàn bộ kiến thức kinh tế học. Tài liệu mẫu hiện chưa cung cấp đủ nội dung cho mọi nhóm; không tự dịch và coi bản dịch là nguồn đã duyệt.

## Yêu cầu và mức ưu tiên

| ID | Yêu cầu | Ưu tiên theo người dùng |
| --- | --- | --- |
| S01 | Làm nguyên đề gốc, giữ thứ tự/cấu trúc gốc | Bắt buộc |
| S02 | Luyện tập: đúng/sai và giải thích ngay sau trả lời | Bắt buộc |
| S03 | Thi thử có bấm giờ; điểm, đáp án và giải thích sau khi nộp/kết thúc | Bắt buộc |
| S04 | Tạo đề bằng chọn và xáo câu từ kho, có độ phủ | Bắt buộc |
| S05 | Chọn môn/ngôn ngữ, chương, số câu, độ khó, tỷ lệ dạng bài khi tạo đề | Đã yêu cầu |
| S06 | Tự luận nhập văn bản, AI chấm điểm chính thức theo rubric | Bắt buộc |
| S07 | Tải ảnh/PDF bài vẽ cho từng ý đồ thị, AI đọc và chấm | Đã bổ sung vào MVP |
| S08 | Điểm, lịch sử, tiến trình cá nhân, chủ đề cần ôn | Bắt buộc |
| S09 | Đăng ký, đăng nhập, phân quyền khách/thành viên/trả phí/admin | Bắt buộc |
| S10 | Khách làm 5 đề có sẵn, mỗi đề 1 lần; không cần tài khoản | Đã chốt; chi tiết lượt còn mở |
| S11 | Thu phí 150.000 đồng/tháng, thanh toán online; dự kiến SePay | Đã chốt giá; quyền/hạn mức và cách tính tháng còn mở |
| S12 | Admin tải tài liệu, sửa câu/đáp án, xem lỗi, tạo đề, quản lý người dùng và chi phí | Đã chốt |
| S13 | Luyện chuyên biệt theo chương/chủ đề | Có thì tốt; bộ lọc chương trong tạo đề S05 vẫn phải hỗ trợ |
| S14 | Biến thể đổi dữ kiện và AI tạo câu mới tương tự | Có thì tốt; thiết kế hỗ trợ, không thay thế S04 |
| S15 | Lưu mọi câu AI sinh, tự động kiểm định, không bắt buộc chờ người duyệt | Đã chốt; chỉ bản đạt kiểm định được phát hành |

Giải thích sau trả lời/nộp bài là bắt buộc theo các câu trả lời sau cùng của chủ sản phẩm. “Để sau” chỉ còn áp dụng cho gợi ý trước khi trả lời. Không tự đưa chức năng bắt buộc ra khỏi MVP vì hạn ra mắt; báo rõ nguy cơ và điều chỉnh cùng chủ sản phẩm.

## Ranh giới

Không có offline, model local, người học tải test bank/tài liệu nguồn, tải đề gốc, in hoặc xuất PDF đề. Upload bài làm S07 không phải upload tài liệu nguồn. Chưa có yêu cầu chat mở, web search học thuật, mạng xã hội, bảng xếp hạng, app native hoặc gia sư agent tự chủ.

Không tái sử dụng nhận diện và giao diện Vui Học. Có thể học kinh nghiệm kỹ thuật, nhưng không mang prompt lớp 2 hoặc quy tắc môn tiểu học sang sản phẩm.

## Điều kiện sử dụng

Chủ sản phẩm xác nhận được sử dụng công khai, miễn phí và thương mại, không cho tải file đề gốc. Đường dẫn nguồn và file gốc không công khai. Việc hiển thị câu hỏi cho người học không thể ngăn tuyệt đối chụp/chép lại; không mô tả “không tải file gốc” thành cam kết chống sao chép tuyệt đối.

Khách chưa đăng nhập không có danh tính bền vững giữa các trình duyệt/thiết bị. Giới hạn 5 lượt không được mô tả là chống vượt lượt tuyệt đối khi chính sách nhận diện còn mở.

## Tiêu chí thành công do chủ sản phẩm đặt

Sinh viên chọn và hoàn thành một đề; thi thử được chấm và giải thích sau khi làm hết; luyện tập được phản hồi từng câu; tạo đề mới từ kho đáp ứng độ phủ kiến thức. Các điều kiện kiểm thử đầy đủ ở ACCEPTANCE.md.

## Ràng buộc

- Người xây dựng chính: chủ sản phẩm. Nghiệm thu học thuật: giáo sư NEU. Thử nghiệm: 30–40 sinh viên.
- Mốc mục tiêu 06/11/2026. Nhập toàn bộ ngân hàng là khối lượng chưa xác định; tách tiến độ nội dung và tiến độ phần mềm.
- Mục tiêu ngân sách OpenRouter: nhập liệu dưới 10 USD; vận hành ban đầu khoảng 5 USD/tháng. Đây là ngân sách mong muốn, chưa phải chi phí được xác nhận.
- Ưu tiên hạ tầng miễn phí, chưa cần tên miền riêng. Không lựa chọn gói miễn phí có điều kiện sử dụng xung đột với sản phẩm thu phí.
- Cập nhật 02/11: stack lõi giống Vui Học; công ty đã xác nhận dùng PostgreSQL. Phát triển bằng cụm PostgreSQL riêng trên máy trước; không dùng dịch vụ PostgreSQL/Neon cá nhân cũ hoặc DB Vui Học, chưa kết nối DB công ty.
