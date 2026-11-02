# Luồng sử dụng và trạng thái giao diện

Ngày cập nhật: 02/11/2026. Tài liệu định nghĩa hành vi để xây UI; chưa có mockup hoặc màn hình đã triển khai. Áp dụng taste-skill theo loại màn hình, không áp thiết kế landing page cho không gian làm bài.

## Catalog và truy cập

Người học chọn môn/ngôn ngữ, xem đề được phép dùng và thông tin thời lượng, phạm vi, dạng câu. Nút chính là bắt đầu luyện hoặc thi thử. Nhóm chưa có nội dung phải nói rõ chưa có đề, không hiện đề giả hoặc tự dịch từ nhóm khác.

Khách có năm đề được cấu hình; theo dõi quyền/lượt tại backend theo cơ chế nhận diện đã chốt. Khi hết lượt, hiển thị trạng thái và lựa chọn đăng ký/gói phù hợp. Đăng ký không tự tạo quyền trả phí. Cách tính lượt và quyền thành viên miễn phí còn mở; UI không quảng bá quyền chưa có quyết định.

## Luyện tập

1. Chọn đề gốc hoặc đề mới và chế độ luyện.
2. Xem đầy đủ stem, đoạn chung, hình/bảng/công thức và các ý trả lời.
3. Trắc nghiệm chọn đáp án; tự luận nhập văn bản; ý đồ thị đính kèm bài vẽ.
4. Gửi câu trả lời. Câu đóng chấm ngay; tự luận/ảnh có trạng thái đang chấm và tự cập nhật.
5. Hiện kết quả, điểm tiêu chí khi có và giải thích đúng câu. Giữ câu trả lời đã gửi khi lỗi mạng; không trừ hạn mức AI hai lần vì retry cùng tác vụ.

Gợi ý trước trả lời chưa thuộc phần bắt buộc. Theo dõi lượt đầu, việc xem lời giải và làm lại như các sự kiện riêng; không dùng điểm đã xem đáp án để mô tả năng lực lần đầu.

## Thi thử

1. Xem cấu trúc, thời lượng và điểm; bắt đầu tạo Attempt có hạn chót server.
2. Điều hướng câu/ý, đánh dấu xem lại, xem trạng thái đã lưu. Không có đáp án/giải thích trước khi kết thúc.
3. Reload/quay lại tiếp tục đúng lượt và giờ còn lại. Báo mất kết nối, trạng thái lưu chưa đồng bộ; không hứa lưu thành công khi backend chưa xác nhận.
4. Xác nhận nộp có số câu bỏ trống. Nộp hoặc hết giờ khóa việc sửa bài theo quy tắc server. Hai yêu cầu nộp đồng thời chỉ tạo một kết quả.
5. Hiện câu đúng/sai, đáp án và giải thích sau kết thúc. Nếu tự luận/ảnh đang chấm, phân biệt điểm đã có với điểm cuối đang chờ.
6. Trang kết quả cập nhật khi AI xong; mở xem lại từng câu và gửi báo lỗi.

## Tạo đề mới

Chọn môn/ngôn ngữ, một hoặc nhiều chương/phạm vi toàn bộ nhóm, số câu, độ khó và tỷ lệ dạng bài. Hiện điều kiện không đáp ứng được trước khi người học chờ tác vụ AI. Bộ phân bổ tạo đề có kiểm tra độ phủ, tránh trùng và giữ nhóm ngữ cảnh.

Đề đang được tạo có tiến trình thực, trạng thái lỗi cục bộ và cách thử lại. Không có progress phần trăm bịa. Không báo thành công khi thiếu câu hoặc khi chỉ có bản nháp. Cấu hình tỷ lệ AI do chính sách sản phẩm quyết định; người học không được sửa trường ẩn để vượt hạn mức.

## Tải bài vẽ

Mỗi ý cần đồ thị có vùng đính kèm riêng, phần ghi chú và hướng dẫn định dạng/dung lượng thực đang áp dụng. Định hướng hỗ trợ ảnh JPG/PNG/WebP và PDF; giới hạn và xử lý định dạng khác chốt ở O07. Không yêu cầu tải tài liệu giáo trình.

Xem trước, xoay/thay/xóa file trước nộp; gắn đúng câu/ý, lưu riêng tư. Với PDF, chọn/đọc đúng trang theo pipeline; không bỏ trang không thông báo. Thông báo file mờ, thiếu nhãn/trang hoặc không đọc được phải cụ thể. Tác vụ chấm nhận ảnh thực, không suy diễn rằng hình đúng chỉ vì phần văn bản mô tả đúng.

Giao diện kết quả gồm điểm từng tiêu chí và nhận xét về trục, đường, giao điểm, số liệu/vùng diện tích khi đề yêu cầu. Không dùng độ giống pixel làm tiêu chuẩn. Bài làm khác cách trình bày nhưng tương đương phải được xem xét theo rubric.

## Tiến trình học

Hiển thị đề đã làm, điểm cuối/đang chờ, thời gian và kết quả theo chủ đề. Mỗi nhận định phần kiến thức cần ôn kèm số câu quan sát. Chưa đủ dữ liệu thì hiện chưa đủ dữ liệu, không bịa biểu đồ tăng trưởng. Phân biệt lần đầu với làm lại và nội dung chưa chấm.

## Thanh toán

Trang gói chỉ hiện quyền và hạn mức đã chốt. Tạo đơn có giá/thời hạn snapshot, hướng dẫn chuyển khoản/checkout theo tích hợp SePay được chọn. Trang chờ thanh toán đọc trạng thái backend; nút “đã chuyển” không tự cấp gói. Khi webhook hợp lệ được đối soát, cập nhật quyền; lỗi/sai tiền có trạng thái và hỗ trợ admin xử lý.

## Quản trị

Các màn hình cần: danh sách nguồn và kết quả nhập; ngân hàng câu với lọc/ảnh nguồn; sửa câu/đáp án/rubric có phiên bản; vấn đề nội dung; cấu hình tạo đề/đề miễn phí; người dùng/quyền; đơn hàng/giao dịch; AI jobs/chi phí; báo lỗi sinh viên; lịch sử thay đổi.

Admin tải tài liệu thấy trạng thái nhập và lỗi ngay theo tiến độ. Câu cần xử lý có vị trí nguồn, lỗi cụ thể và hành động kiểm tra/sửa/ngừng dùng. Không bắt admin chờ cả bank xong mới biết file đầu bị lỗi. Các sửa đổi không âm thầm thay đổi lượt thi đã phát hành.

## Yêu cầu thiết kế

Ưu tiên nội dung học và hành động hiện tại. Màn làm bài có stem dễ đọc, công thức đúng, hình có thể phóng to, câu trả lời không bị che bởi thanh cố định. Không dùng hiệu ứng xuất hiện làm chậm nội dung thi. Trên điện thoại, điều hướng câu và đồng hồ gọn; bảng/hình rộng cuộn/phóng trong vùng riêng, không làm cả trang tràn ngang.

Theo skill, chọn hướng thiết kế bằng công cụ draw trước khi dựng UI; kiểm tra 1440, 768, 390 px cùng trạng thái trống, tải, lỗi, focus và thao tác bàn phím. Không mượn logo NEU trong tài liệu làm logo sản phẩm hoặc tự gắn thông điệp bảo chứng của trường/giáo sư lên trang bán hàng.
