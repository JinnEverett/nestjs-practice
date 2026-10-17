# C12 · Upload và streaming

Đọc khoảng 11 phút. Hai bài toán nhìn khác nhau nhưng cùng một nguyên tắc: **dữ liệu lớn không được nằm trọn trong RAM, và dữ liệu từ ngoài vào không được tin**. Bạn sẽ nhận ảnh sản phẩm bằng Multer, trả ảnh bằng `StreamableFile`, và xuất CSV hàng loạt bằng stream (kiến thức `Readable`, backpressure, `pipeline` từ N03). Không cần cài thêm gói chạy (Multer đã đi cùng `@nestjs/platform-express`); chỉ cần `npm i -D @types/multer` cho kiểu `Express.Multer.File`.

## Mục tiêu
- Nhận `multipart/form-data` bằng `FileInterceptor`, đặt giới hạn (`fileSize`, `files`, `fields`) và biết lỗi nào ra status nào.
- Kiểm tra file theo **nội dung** (magic bytes), không theo `Content-Type`/đuôi file do client khai.
- Lưu file an toàn: tên do server đặt, không file mồ côi, thay thế không rò.
- Trả file/stream bằng `StreamableFile` với header đúng (`Content-Length`, `ETag`, `nosniff`).
- Xuất CSV lớn bằng `Readable.from(asyncGenerator)` và chặn CSV injection.

## 1. Nhận file với Multer
```ts
@Post()
@UseInterceptors(FileInterceptor('file', {
  storage: memoryStorage(),                         // giữ trong RAM (giới hạn nhỏ) HOẶC diskStorage
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
}))
upload(@UploadedFile(new ParseFilePipe({ fileIsRequired: true })) file: Express.Multer.File) { /* ... */ }
```
- Multer vượt giới hạn → `MulterError`, Nest đổi thành: `LIMIT_FILE_SIZE` → `413`, các lỗi còn lại (`LIMIT_UNEXPECTED_FILE`, `LIMIT_FILE_COUNT`, `LIMIT_FIELD_COUNT`...) → `400`.
- **Giới hạn ở tầng Multer** (cắt giữa chừng khi vượt) tốt hơn kiểm sau: kiểm sau nghĩa là đã nhận trọn file. `ParseFilePipe` + `MaxFileSizeValidator` kiểm file đã vào RAM.
- `memoryStorage` hợp lý khi trần nhỏ; ghi đĩa thì sinh file trước khi bạn kịp kiểm sản phẩm có tồn tại không, dễ để lại **file mồ côi** khi sau đó lỗi. Với `diskStorage` bạn phải tự dọn.
- Mọi thứ chạy sau guard (guard trước interceptor), nên `@AdminOnly()` chặn trước khi Multer đọc thân.

## 2. Đừng tin file client gửi
| Client khai | Vì sao không tin | Cách đúng |
|---|---|---|
| `Content-Type: image/png` | đặt tay được | đọc **magic bytes** đầu file |
| tên `anh.png` | chỉ là chuỗi, có thể là `../../etc/passwd` | tên do server đặt (`<productId>.png`), không dùng tên client |
| kích thước | có thể nói dối | `limits.fileSize` đếm byte thật |
| loại "ảnh" | SVG chứa `<script>`, polyglot | allowlist tối thiểu: JPEG, PNG, WebP |

Magic bytes: JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A`, WebP `RIFF....WEBP`. Trả file với `X-Content-Type-Options: nosniff` và `Content-Type` do **bạn** quyết, không để trình duyệt đoán.

## 3. Trả file bằng `StreamableFile`
```ts
return new StreamableFile(createReadStream(path), { type: 'image/png', length: size, disposition: 'inline' });
```
Nest gắn header từ options, `pipe` stream vào response (có backpressure). Không `readFile` rồi `res.send(buffer)`: 1.000 người tải ảnh 2MB cùng lúc là 2GB RAM. Thêm `ETag` (ở đây: kích thước + `mtime`) và trả `304` khi `If-None-Match` khớp. Với `@Res({ passthrough: true })` bạn vẫn đặt header nhưng để Nest gửi body.
Interceptor cache của C08 **không** dùng được cho stream (không clone/serialize được); đó là lý do route này không có `@CacheTtl`.

## 4. Xuất dữ liệu lớn bằng stream
```ts
async function* rows() {
  yield '﻿' + csvLine(HEADER);                      // BOM: Excel nhận UTF-8 tiếng Việt
  for (let page = 1; ; page++) { /* lấy từng trang 100 dòng */ for (const p of data) yield csvLine(p); }
}
return new StreamableFile(Readable.from(rows()), { type: 'text/csv; charset=utf-8', disposition: 'attachment; filename="products-20261017.csv"' });
```
- Không có `Content-Length` vì chưa biết tổng: phản hồi `Transfer-Encoding: chunked`. Bộ nhớ ~ một trang, không phụ thuộc số dòng.
- Đặt `@Timeout(...)` riêng cho route này; timeout mặc định 5 giây của C08 sẽ cắt nó.
- **RFC 4180**: ô chứa `,` `"` hoặc xuống dòng phải bao trong `"..."` và nhân đôi `"`. Dòng kết thúc `\r\n`.
- **CSV injection**: Excel/Sheets coi ô bắt đầu bằng `= + - @` là công thức. Tên sản phẩm `=HYPERLINK("http://evil",...)` do người dùng nhập sẽ chạy khi nhân viên mở file. Chuỗi như vậy phải được thêm `'` ở đầu. (Số âm là *số*, không phải chuỗi, không thêm `'`.)

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Dùng `file.originalname` làm tên file | path traversal, ghi đè file khác | tên do server đặt |
| Tin `file.mimetype` | upload HTML/script giả ảnh → XSS | magic bytes |
| `diskStorage` rồi mới kiểm tra | file mồ côi khi lỗi | `memoryStorage` + giới hạn nhỏ, hoặc dọn khi lỗi |
| Không đặt `limits` | một request ăn hết RAM/đĩa | `fileSize`, `files`, `fields`, `parts` |
| `readFileSync` + `res.send` | RAM tăng theo số người tải | stream |
| Header `Content-Length` sai với stream | client treo hoặc cắt cụt | đặt đúng hoặc bỏ để chunked |
| Cache stream bằng interceptor | lỗi `structuredClone`, hết RAM | không cache stream |
| Xuất CSV không escape | công thức chạy trên máy kế toán | `csvCell` |

## Dùng ở đâu trong `shop-api`
R03 thay lưu đĩa bằng S3/MinIO với presigned URL và xử lý ảnh qua queue (P03), `UPLOAD_DIR` là điểm thay. B04 làm cho export dùng cursor/`QueryRunner.stream` thay vì phân trang offset. A06 ôn lại giới hạn body và upload như một phần OWASP. `bench` ở P05 đo xuất CSV 1M dòng.
