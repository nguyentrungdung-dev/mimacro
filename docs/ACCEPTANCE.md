# Tiêu chí nghiệm thu MVP

Ngày cập nhật: 02/11/2026. Đây là tiêu chí nghiệm thu toàn bộ MVP, không phải báo cáo đã đạt. Trạng thái ở PROGRESS.md; kết quả mỗi đợt báo trong chat, kèm môi trường, phiên bản, dữ liệu, expected/actual và giới hạn. Mock không thay kiểm thử dịch vụ thật. Kiểm thử tích hợp dùng DB đang cấu hình, không dùng DB local riêng.

## Từ dữ liệu đến đề hợp lệ

| ID | Kiểm chứng | Điều kiện đạt |
| --- | --- | --- |
| A01 | Nhập một file Frank đại diện | Đúng câu/lựa chọn/đáp án/giải thích theo mẫu chuẩn, không lẫn Answer Key thành câu |
| A02 | Bảng, hình, OMML và nhóm ngữ cảnh | Không mất hoặc gắn nhầm; đối chiếu nguồn bằng mắt các mẫu đại diện |
| A03 | Một file chứa nhiều đề | Giữ đề/phần/câu/ý, thời lượng và trọng số; số câu không lẫn giữa các đề |
| A04 | Thiếu đáp án và sai bước lời giải | Báo admin, lưu nguồn/issue; không âm thầm đoán/sửa hoặc đưa vào chấm chính thức |
| A05 | Nhập lặp và câu gần trùng | Không nhân bản do upload lại; không gộp nhầm câu đổi số, lựa chọn, hình hoặc đáp án |
| A06 | Bốn nhóm nội dung | Lọc đúng môn/ngôn ngữ; nhóm chưa có nguồn không giả có nội dung; đầy đủ nội dung là trạng thái riêng |
| A07 | Độ khó | Nhãn ước lượng không được mô tả là đã xác nhận; lọc/kiểm tra phân bổ theo quy tắc đã cấu hình |

## Tạo đề và làm bài

| ID | Kiểm chứng | Điều kiện đạt |
| --- | --- | --- |
| A10 | Làm nguyên đề gốc | Đủ nội dung, đúng thứ tự/cấu trúc/hình và điểm của nguồn |
| A11 | Tạo đề theo cấu hình | Đúng số câu/điểm, chương, dạng và độ khó; phân bổ thực tế kiểm tra được; không trùng hoặc phá nhóm |
| A12 | Kho thiếu câu | Báo điều kiện thiếu và phương án; không âm thầm đổi cấu hình |
| A13 | Xáo lựa chọn | Chấm đúng sau xáo nhờ stable ID; không xáo câu/lựa chọn có phụ thuộc nếu chưa xử lý được |
| A14 | Luyện tập | Sau gửi câu mới hiện đúng/sai và giải thích; câu AI có trạng thái đang chấm rõ |
| A15 | Thi thử và đồng hồ | Chưa kết thúc không có đáp án trong response; reload tiếp tục đúng giờ; hết giờ xử lý ở server |
| A16 | Lưu bài, nộp và lỗi mạng | Không mất câu đã xác nhận lưu; retry/nộp hai tab không tạo hai kết quả hoặc phí trùng |
| A17 | Xem kết quả | Sau nộp thấy đáp án/giải thích; điểm theo trọng số; phần pending không tính là sai 0 điểm |
| A18 | Lịch sử và chủ đề cần ôn | Lưu đúng người; hiển thị mẫu quan sát; phân biệt lần đầu/làm lại/đang chấm |

## AI và đồ thị

| ID | Kiểm chứng | Điều kiện đạt |
| --- | --- | --- |
| A20 | Câu mới được sinh và kiểm định | Đủ cấu trúc, đáp án/lời giải/rubric, nguồn và version; chỉ bản đạt được dùng |
| A21 | Câu sinh không hợp lệ | Bị loại khỏi tập chọn dù vẫn lưu; retry có trần; không bù bằng câu lỗi |
| A22 | Chấm tự luận | Đủ tiêu chí, điểm hợp lệ, nhận cách giải tương đương; có evidence và version |
| A23 | Chấm bài vẽ | Upload đúng ý, xem trước, đủ trang; rubric chấm ý nghĩa/điểm/nhãn; không chấm độ giống ảnh |
| A24 | Ảnh mờ/thiếu, API lỗi, rubric thiếu | Pending hoặc yêu cầu bổ sung có lý do; không suy ra 0 điểm |
| A25 | Đánh giá với giáo sư | Có bộ mẫu text/ảnh và báo cáo sai lệch/chi phí; ngưỡng O08 được chốt và đạt trước tuyên bố chất lượng |
| A26 | Chi phí và đồng thời | Usage ghi theo tác vụ, giới hạn có hiệu lực, lỗi không tạo retry vô hạn hoặc tác vụ trùng |
| A27 | Chỉ dẫn trong tài liệu/bài làm | Không làm thay nhiệm vụ chấm, tiết lộ đáp án/khóa hoặc cấp quyền |

S14 là nhóm “có thì tốt”; tiến độ A20/A21 và tỷ lệ sinh câu không được dùng để che việc A11 tạo đề từ kho chưa đạt. Nếu điều chỉnh phạm vi phát hành, phải có quyết định rõ thay vì bỏ tính năng âm thầm.

## Tài khoản và thanh toán

| ID | Kiểm chứng | Điều kiện đạt |
| --- | --- | --- |
| A30 | Đăng ký/đăng nhập/đăng xuất và khôi phục truy cập | Phiên và dữ liệu đúng người; quy trình auth được chọn hoạt động trên môi trường đích |
| A31 | Năm đề khách | Đúng catalog/chính sách đã chốt; retry/tiếp tục không tự tiêu hao thêm; giới hạn danh tính khách được mô tả đúng |
| A32 | Thành viên và gói trả phí | Quyền kiểm tra tại backend; không sửa client để mở đề/AI/admin |
| A33 | Thanh toán thành công | Đơn đúng giá; webhook xác thực, giao dịch khớp; cấp quyền đúng chu kỳ đã chốt |
| A34 | Webhook lặp/giả, sai tiền, đơn không khớp | Không cấp quyền sai hoặc lần hai; có đối soát và log |
| A35 | Hết hạn và gia hạn | Thời hạn/quyền nhất quán; dữ liệu học còn; không cộng hai lần từ cùng giao dịch |
| A36 | Tích hợp thật | Có bằng chứng luồng kiểm thử SePay và live được người dùng cho phép; không gọi mock là thanh toán production |

## Quản trị và vận hành

| ID | Kiểm chứng | Điều kiện đạt |
| --- | --- | --- |
| A40 | Upload/sửa nội dung/xem lỗi | Admin làm được; lỗi nhập có vị trí nguồn; sửa có version và audit |
| A41 | Báo lỗi câu/chấm lại | Gắn đúng câu/attempt; ngừng dùng câu; thay điểm có lịch sử và lý do |
| A42 | File và dữ liệu riêng tư | Người khác/khách không lấy được file nguồn, bài làm, rubric hay dữ liệu admin |
| A43 | UI và thiết bị | Luồng chính chạy ở 1440/768/390; công thức/hình rõ, bàn phím/focus, không tràn trang; làm gate skill đúng loại màn hình |
| A44 | Tải thử đại diện | Đợt 30–40 sinh viên có kế hoạch thử; đo mức đồng thời thực thay vì giả định 40 người đều gọi AI cùng lúc |
| A45 | Triển khai và phục hồi | HTTPS, cấu hình bí mật đúng, DB/file bền vững, sao lưu và thử phục hồi; không có đáp án/khóa trong frontend |

## Bộ hồ sơ phát hành

Ghi commit/build, môi trường, kết quả kiểm thử, các lỗi còn lại, trạng thái nghiệm thu giáo sư, số nội dung đủ điều kiện theo nhóm, hạn mức và chi phí thực đã đo. Không phát hành thanh toán thật khi quyền gói/chu kỳ chưa chốt, hoặc nội dung tự luận để chấm khi không có rubric đủ căn cứ.

Mọi ngoại lệ đối với yêu cầu bắt buộc phải được chủ sản phẩm quyết định và ghi DECISIONS. Nhập toàn bộ ngân hàng, đủ nội dung cả bốn nhóm và phần mềm chạy được là ba trạng thái khác nhau; báo cáo riêng.
