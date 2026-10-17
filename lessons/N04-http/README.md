# N04 · HTTP thuần với `node:http`

Đọc khoảng 12 phút. Nest (Express/Fastify bên dưới) chỉ là lớp tiện lợi trên cái bạn sắp tự viết. Hiểu lớp này thì lỗi như "413", "CORS preflight", "304", "Content-Length sai làm client treo" không còn bí ẩn.

## Mục tiêu: sau buổi này bạn làm được
- Viết server bằng `http.createServer`, đọc `req` (method, url, header, body), ghi `res` (status, header, body) đúng chuẩn.
- Chọn **status code** đúng; dùng header `Content-Type`, `Content-Length`, `ETag`, `Retry-After`, `Allow`.
- Giải thích CORS (preflight), caching có điều kiện (ETag/304), rate limit (429).
- Tự viết router có path param và lớp xử lý lỗi — chính là thứ Nest làm cho bạn.

---

## 1. Request/response là stream
```js
import http from 'node:http';
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');   // req.url chỉ là "/path?x=1"
  if (req.method === 'POST' && url.pathname === '/echo') {
    let body = '';
    for await (const chunk of req) body += chunk;      // req là Readable
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ got: body }));
  } else {
    res.writeHead(404).end();
  }
}).listen(3000);
```
- Tên header trong `req.headers` luôn **chữ thường**.
- `res.writeHead` rồi `res.end`; gọi `end` hai lần hoặc ghi sau `end` là lỗi. `headersSent` cho biết đã lỡ gửi header chưa.
- Body JSON là **byte**: `Content-Length` phải là `Buffer.byteLength(str)`, **không** phải `str.length` (tiếng Việt!).

## 2. Status code hay dùng
| Mã | Khi nào |
|---|---|
| 200 / 201 / 204 | OK / tạo mới (kèm `Location`) / thành công không có body |
| 304 | `If-None-Match` khớp `ETag` — client dùng bản cache |
| 400 / 401 / 403 | sai dữ liệu / chưa đăng nhập / không đủ quyền |
| 404 / 405 | không có route / có route nhưng sai method (kèm `Allow`) |
| 409 / 413 / 415 | xung đột trạng thái / body quá lớn / sai `Content-Type` |
| 422 | đúng cú pháp nhưng sai nghiệp vụ (tùy quy ước) |
| 429 | quá rate limit (kèm `Retry-After`) |
| 500 / 502 / 503 / 504 | lỗi server / upstream hỏng / quá tải / upstream timeout |

Quy tắc: lỗi 4xx là do client (message có thể hiện cho client); lỗi 5xx là do ta → **không lộ chi tiết** (stack, SQL) ra response, chỉ log.

## 3. CORS
Trình duyệt chặn JS ở `https://app.example` gọi `https://api.example` trừ khi API cho phép. Request "không đơn giản" (JSON, header `Authorization`, method `PUT/DELETE`) kích hoạt **preflight**: trình duyệt gửi `OPTIONS` kèm `Origin` và `Access-Control-Request-Method` trước; server trả `204` + `Access-Control-Allow-Origin/Methods/Headers`. CORS là cơ chế của **trình duyệt**; `curl` không bị chặn — nó không thay thế xác thực. Nếu trả `Allow-Origin` theo origin của request thì phải thêm `Vary: Origin` (để cache không trộn lẫn).

## 4. Caching có điều kiện
Server gửi `ETag: "abc"`; lần sau client gửi `If-None-Match: "abc"`; nếu dữ liệu chưa đổi → `304 Not Modified` **không có body** (tiết kiệm băng thông, vẫn phải tính ETag trên server).

## 5. Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| `Content-Length: str.length` | tiếng Việt bị cắt, client treo | `Buffer.byteLength` |
| Quên `res.end()` trong nhánh lỗi | request treo tới timeout | luôn có đường kết thúc |
| Không giới hạn kích thước body | một request 2GB làm sập RAM | giới hạn + 413 |
| `JSON.parse` không try/catch | 500 thay vì 400, có thể crash | bắt và trả 400 |
| Trả `err.message` của lỗi 500 | lộ chi tiết nội bộ | message chung chung |
| Quên `Vary: Origin` | cache CDN trộn CORS | thêm header |
| Rate limit theo `remoteAddress` sau reverse proxy | mọi người chung một IP | tin `X-Forwarded-For` đúng cách (hop cuối của proxy tin cậy) |

## Bên trong Nest dùng cái này ở đâu
- `@Controller('orders') @Get(':id')` = bảng route bạn sẽ viết ở ex03; `@Param`, `@Query`, `@Body` = `params`, `query`, `body` ở ex04.
- `HttpException` + exception filter (C06) = `HttpError` + lớp bắt lỗi ở ex04. `ValidationPipe` trả 400, `ThrottlerGuard` trả 429, `enableCors()` = ex05, `ETag` mặc định của Express = ex06.
- Giới hạn body của Nest/Express (`bodyParser` limit mặc định 100KB cho JSON) = ex02.
