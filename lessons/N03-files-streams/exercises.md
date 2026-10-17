# N03 · Bài tập

Viết vào `answers/exNN.js` (ES module), chỉ dùng module có sẵn của Node.
Chấm: `bash lessons/check.sh lessons/N03-files-streams 01`. Đáp án: `solutions/`.

**Pass:** 7/8 bài + ex03 và ex08 đạt ngưỡng bộ nhớ, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · `readJson(path, ...fallback)`
Đọc và parse một file JSON bằng `fs/promises`.
- File không tồn tại (`ENOENT`): nếu **có truyền** đối số thứ hai (kể cả `null`) → trả giá trị đó; không truyền → ném lại lỗi gốc.
- Lỗi khác (`EACCES`, đường dẫn là thư mục…) luôn ném lại nguyên lỗi.
- JSON sai cú pháp → ném `Error` có message `Invalid JSON in <path>` và `cause` là lỗi parse gốc.
- File bắt đầu bằng BOM (`﻿`) vẫn parse được.

### ex02 · Khung độ dài: `encodeFrame`, `decodeFrames`
Giao thức đơn giản trên TCP: mỗi tin nhắn = 4 byte độ dài (UInt32 big-endian, tính bằng **byte** UTF-8) + nội dung.
- `encodeFrame(text)` → `Buffer`.
- `decodeFrames(buf)` → `{ messages: string[], rest: Buffer }`: giải mã mọi khung **hoàn chỉnh** ở đầu `buf`; phần còn lại (khung dang dở, kể cả thiếu cả 4 byte header) trả trong `rest` để nối với dữ liệu đến sau. Khung rỗng (độ dài 0) hợp lệ.

### ex03 · `countLines(path)` cho file lớn
Đếm số dòng của file mà **không** đọc cả file vào bộ nhớ: số ký tự `\n`, cộng 1 nếu file không rỗng và byte cuối không phải `\n`. File rỗng → 0.
Test tạo file ~80MB và đo RSS tăng thêm khi chạy (phải < 60MB).

---

## 🟡 Kết hợp

### ex04 · `createCsvParser()` — Transform
Trả `Transform` nhận **chuỗi/Buffer chia chunk tùy ý** (có thể cắt giữa dòng, giữa trường có dấu ngoặc kép, giữa ký tự UTF-8 nhiều byte) và phát ra **object** (`readableObjectMode`).
- Dòng đầu là header; mỗi dòng sau thành `{ header: value }` (mọi value là chuỗi).
- Hỗ trợ trường trong `"…"` chứa dấu phẩy, xuống dòng, và `""` là một dấu ngoặc kép. Hỗ trợ `\n` và `\r\n`.
- Bỏ qua dòng trống. Dòng cuối không có xuống dòng vẫn được phát (khi stream kết thúc).
- Dòng thiếu trường → điền `''`; dòng thừa trường → stream phát lỗi `Row <số thứ tự dòng dữ liệu, từ 1> has more fields than header`.

### ex05 · `gzipFile(src, dest)` và `gunzipFile(src, dest)`
Dùng `stream/promises.pipeline` + `zlib`.
- Trả Promise resolve khi ghi xong hoàn toàn.
- Lỗi (không có `src`, file gzip hỏng…) → Promise reject với lỗi gốc, và **file `dest` đang ghi dở bị xóa** (không để file rác).

### ex06 · `writeAll(writable, chunks)` tôn trọng backpressure
`chunks` là iterable (đồng bộ) các `Buffer/string`. Ghi tất cả vào `writable`, **chờ `drain`** mỗi khi `write()` trả `false`, rồi `end()` và resolve khi `finish`.
- Lỗi của `writable` (event `error`) → reject với lỗi đó, không treo.
- Test dùng Writable có `highWaterMark` nhỏ và `_write` chậm; lượng dữ liệu chờ trong buffer không được vượt quá `highWaterMark` + 1 chunk.

---

## 🔴 Thực tế

### ex07 · Export đơn hàng ra CSV bằng stream
PM cần endpoint tải CSV tất cả đơn, vài triệu dòng. Viết `exportOrdersCsv(rows, out)`:
- `rows`: iterable hoặc async iterable của `{ id, user, total, note }`; `out`: Writable (trong Nest sẽ là `res`).
- Ghi header `id,user,total,note\n`, mỗi dòng kết thúc `\n`. `total` định dạng đúng 2 chữ số thập phân (`12.5` → `12.50`). Trường chứa `,` `"` `\n` `\r` được bao `"…"` và nhân đôi `"`. `note` có thể `null/undefined` → trống.
- Dùng `pipeline` + `Readable.from`; resolve khi `out` xong; lỗi ở `rows` (generator ném) hoặc ở `out` → reject và dọn dẹp.
- Test với 300 000 dòng và sink chậm: buffer chờ của sink không được vượt 1MB.

### ex08 · `tail(path, n)` — n dòng cuối của file log
Đọc **từ cuối file** lùi dần từng khối 64KB bằng `fs.promises.open` + `read`, dừng khi đủ `n` dòng. Không đọc cả file.
- Trả `string[]` theo thứ tự trong file; bỏ `\r` cuối dòng (CRLF); `n=0` → `[]`; `n` lớn hơn số dòng → tất cả dòng; file rỗng → `[]`.
- Dòng cuối có hay không có `\n` ở cuối đều cho cùng kết quả.
- Một dòng dài hơn khối (200KB) và ký tự UTF-8 nhiều byte nằm đúng biên khối đều phải đúng.
- Test dùng file ~150MB: RSS tăng thêm phải < 50MB.

> 📏 Câu hỏi quy mô (không chấm): export 5 triệu đơn, mỗi dòng ~80 byte, qua mạng 10 MB/s. Nếu bạn gom hết vào một mảng/string rồi mới gửi, RSS đỉnh khoảng bao nhiêu? Với stream thì sao? Thời gian gửi xong có khác không?
