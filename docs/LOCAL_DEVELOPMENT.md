# Chạy Ôn MiMacro trên máy

Ứng dụng dùng Next.js 16.4.2, React 19.2, TypeScript và Node.js 24. Database là cụm PostgreSQL riêng của dự án, không dùng DB cá nhân cũ hoặc DB công ty. Phiên bản local đã có trên máy: PostgreSQL 15.14.

## Khởi tạo

Chạy các lệnh theo thứ tự trong thư mục dự án:

```sh
npm ci
npm run db:init
npm run db:start
npm run db:migrate
```

`db:init` tạo `.local/postgres`, mật khẩu ngẫu nhiên và `.env.local` có quyền đọc hạn chế. Không ghi đè cấu hình kết nối khác. `db:start` chỉ mở tại `127.0.0.1:55438`, không mở ra mạng LAN; tạo database `mimacro` trong cụm này. Có thể đặt `POSTGRES_BIN` khi PostgreSQL nằm ở đường dẫn khác; mặc định là Homebrew PostgreSQL 15 của máy hiện tại. Cần môi trường cho phép PostgreSQL tạo shared memory và ứng dụng kết nối loopback.

Không commit `.env.local`, `.local`, dữ liệu nhập hoặc ảnh bài làm. Không đặt khóa OpenRouter trong biến `NEXT_PUBLIC_*`. Bản hiện tại không có lời gọi AI có phí.

## Nhập dữ liệu mẫu

```sh
python3 scripts/extract-frank.py
npm run db:import
```

Bộ đọc dùng thư viện chuẩn Python, đọc 10 đường dẫn Frank trong `data/audits/sample-bank-audit.json`. Các nguồn phải tồn tại trên máy. Không sửa file nguồn. Output riêng tư là `data/imports/frank.json` và `.local/storage/media`. Nếu đường dẫn nguồn thay đổi, dùng manifest đúng máy trước khi chạy; chưa có giao diện admin upload trong mốc đầu.

Bộ đọc giữ văn bản, bảng cơ bản, ảnh, superscript/subscript và tách Answer Key. Các kiểm tra cấu trúc phải đạt trước import. Hai câu 195 thuộc hai nguồn chương 3 được giữ trạng thái `needs_review` do vấn đề lời giải nguồn đã phát hiện; không âm thầm sửa. Lệnh import hiện không ghi đè câu đã có cùng ID. Đây không phải công cụ nhập mọi dạng DOCX/PDF bất kỳ; parser CLC và upload quản trị còn trong backlog.

Kết quả đợt mẫu: 10 nguồn, 1.741 câu lưu, 1.739 câu đủ điều kiện theo kiểm tra hiện tại, 2 câu chờ xử lý và 43 file media duy nhất. Kiểm tra cấu trúc không thay thế nghiệm thu học thuật. Không có chi phí OpenRouter cho việc trích xuất này.

## Chạy ứng dụng

Phát triển:

```sh
npm run dev
```

Hoặc kiểm tra production local, dừng dev trước:

```sh
npm run build
npm start
```

Mở [http://127.0.0.1:3006](http://127.0.0.1:3006). Dùng đúng địa chỉ này để khớp APP_ORIGIN. Các script gọi trực tiếp binary bằng Node vì tên thư mục dự án có dấu `:`, gây tách sai PATH nếu chỉ chạy `next`/`tsc` trong npm script.

Không cần tài khoản để thử luồng local hiện tại. Có đăng ký/đăng nhập để lưu những lượt làm tiếp theo theo tài khoản. Chưa áp chính sách năm đề khách, quyền gói trả phí hoặc tự gộp lịch sử khách; các quyết định này vẫn ở DECISIONS. Không mở bản phát triển hiện tại như dịch vụ thu phí/public đã hoàn tất.

Đề gốc giữ thứ tự; nguồn có câu đang chờ kiểm tra chưa mở nguyên bộ. Tạo đề mới chọn các câu hợp lệ, chia đều số câu theo chương, loại trùng chính xác theo nội dung/lựa chọn/media và xáo lựa chọn bằng stable ID. Phân nhóm biến thể gần nghĩa và độ khó chưa hoàn tất; UI nói rõ độ khó chưa phân loại. Dạng đã chạy là trắc nghiệm, không giả có tự luận/đồ thị AI.

## Xác minh

```sh
npm run verify
npm run smoke
```

`verify` chạy unit/data tests, TypeScript và build. Cần chạy extractor trước test dữ liệu. `smoke` cần app production đang chạy và DB riêng; tạo phiên, lượt làm và tài khoản kiểm thử mới, không gọi API có phí và không xóa dữ liệu người dùng. Nó dùng Chrome trên máy và Playwright của bundled runtime; đặt `PLAYWRIGHT_MODULE` nếu dùng nơi khác. Kết quả ở `.local/reports/smoke.json`, ảnh kiểm tra ở `.taste-skill/inspect`. Tài khoản smoke có tiền tố `smoke_`, mật khẩu ngẫu nhiên không xuất log.

Kiểm tra UI theo skill:

```sh
node .agents/skills/taste-skill/scripts/lint.mjs --app src
node .agents/skills/taste-skill/scripts/inspect.mjs http://127.0.0.1:3006 --app --out .taste-skill/inspect/catalog-gate
```

Kiểm tra ảnh sau lệnh; kết quả meter không thay thế xem giao diện. Không chạy build thay thế `.next` trong khi production server đang dùng thư mục đó; dừng server trước, build lại rồi start. Giữ build active, database và chứng cứ kiểm thử.

## Dừng và chuyển database

Dừng web bằng Ctrl+C trong terminal chạy web. Dừng đúng cụm local bằng:

```sh
npm run db:stop
```

Khi có cấu hình công ty: kiểm tra phiên bản/quyền/TLS/network; tạo DB/schema riêng; sao lưu bằng pg_dump và khôi phục bằng pg_restore trong môi trường được phép; kiểm tra migration/checksum, số bản ghi, đăng nhập, lịch sử và điểm; chuyển kho media/file riêng tư; sau cùng đổi DATABASE_URL và PRIVATE_STORAGE_DIR/adapter. Không chỉ đổi URL rồi coi dữ liệu đã được chuyển. Không chạy restore vào DB dùng chung hoặc ghi đè dữ liệu công ty khi chưa xác định đích cụ thể.
