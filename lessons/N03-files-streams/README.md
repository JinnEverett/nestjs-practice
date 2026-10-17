# N03 · File, Buffer và stream

Đọc khoảng 12 phút. Endpoint "export đơn hàng ra CSV" hay "upload ảnh" là nơi API Nest chết vì **hết RAM**: đọc cả file vào bộ nhớ rồi mới xử lý. Stream là cách xử lý dữ liệu lớn bằng bộ nhớ gần như không đổi.

## Mục tiêu: sau buổi này bạn làm được
- Dùng `fs/promises`, `path` đúng cách; phân biệt `Buffer` (byte) và `string` (ký tự).
- Viết/đọc dữ liệu theo khung độ dài (length-prefix) bằng `Buffer`.
- Dùng `Readable`, `Writable`, `Transform`, `stream.pipeline`; hiểu **backpressure**.
- Xử lý file hàng trăm MB với RAM vài chục MB và **đo** được điều đó.

---

## 1. `fs/promises` và `path`
```js
import { readFile, writeFile, stat, open } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
const text = await readFile(join(import.meta.dirname, 'a.json'), 'utf8');
```
- Lỗi có `err.code`: `ENOENT` (không tồn tại), `EACCES`, `EEXIST`. Bắt theo `code`, đừng so chuỗi message.
- `*Sync` chỉ dùng lúc khởi động, không dùng trong request (chặn event loop — N01).
- Ghép đường dẫn bằng `path.join`, không nối chuỗi. Với đường dẫn từ người dùng: `resolve` rồi kiểm tra còn nằm trong thư mục gốc (chống `../../etc/passwd`).

## 2. Buffer
`Buffer` là mảng byte. `'Đơn'.length === 3` nhưng `Buffer.byteLength('Đơn') === 5` (UTF-8: `Đ`, `ơ` mỗi ký tự 2 byte).
```js
const b = Buffer.from('Đơn hàng', 'utf8');
const head = Buffer.alloc(4); head.writeUInt32BE(b.length, 0);   // length-prefix
Buffer.concat([head, b]);
buf.subarray(4, 4 + len).toString('utf8');   // subarray KHÔNG copy (chia sẻ bộ nhớ)
```
Bẫy: cắt một chuỗi UTF-8 ở giữa ký tự rồi `toString()` ra ký tự hỏng `�`. Khi nối nhiều chunk, gom `Buffer` lại rồi mới decode (hoặc dùng `StringDecoder`).

## 3. Stream
Bốn loại: `Readable` (nguồn), `Writable` (đích), `Duplex`, `Transform` (vào → biến đổi → ra). Dữ liệu chảy theo **chunk** (mặc định 64KB với file).
```js
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
await pipeline(createReadStream('big.log'), createGzip(), createWriteStream('big.log.gz'));
```
- Luôn dùng `pipeline` (hoặc `stream/promises`), **không** `a.pipe(b).pipe(c)`: `pipe` không đóng/dọn các stream khi một khâu lỗi → rò file descriptor.
- `Readable.from(iterable | asyncIterable)` biến generator thành stream.
- `for await (const chunk of readable)` đọc stream như vòng lặp.
- `objectMode: true` để chunk là object thay vì byte.

## 4. Backpressure
`writable.write(chunk)` trả `false` khi buffer nội bộ đầy (`writableHighWaterMark`). Người ghi phải **dừng** cho tới sự kiện `'drain'`:
```js
for (const c of chunks) {
  if (!out.write(c)) await once(out, 'drain');
}
```
Bỏ qua backpressure → buffer phình → RAM tăng đúng bằng lượng dữ liệu chưa tiêu thụ (khách tải chậm + file lớn = OOM). `pipeline` tự xử lý việc này.

## 5. Đo bộ nhớ
`process.memoryUsage().rss` (toàn tiến trình, gồm Buffer ngoài heap) lấy mẫu mỗi vài ms khi chạy. So sánh `readFile` cả file với stream: 150MB file → vài trăm MB RSS vs vài chục MB.

## Bẫy hay gặp
| Bẫy | Sai | Đúng |
|---|---|---|
| Đọc cả file | `(await readFile(p, 'utf8')).split('\n')` | `readline`/stream |
| Quên xử lý `error` | `createReadStream(p).on('data', …)` | `pipeline` / `for await` trong `try` |
| `.pipe()` chuỗi | rò fd khi lỗi | `pipeline` |
| Bỏ qua `write()` trả `false` | RAM tăng | chờ `drain` |
| `chunk.toString()` từng chunk | hỏng ký tự đa byte ở biên chunk | `StringDecoder` / gom Buffer |
| `JSON.stringify(rows)` cho 1M dòng | chặn loop + RAM | NDJSON / CSV stream |

## Bên trong Nest dùng cái này ở đâu
- `StreamableFile` (C12) trả stream cho response; Multer ghi file upload bằng stream.
- Request/Response của Express/Fastify **là** stream: `req` là Readable, `res` là Writable → backpressure khi client đọc chậm.
- Export báo cáo, import CSV hàng loạt (R-tier), ghi log ra file: đều là pipeline.
