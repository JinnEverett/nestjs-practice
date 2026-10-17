# N04 · Bài tập

Viết vào `answers/exNN.js` (ES module), chỉ dùng module có sẵn của Node (`node:http`, `node:crypto`, `fetch` toàn cục).
Chấm: `bash lessons/check.sh lessons/N04-http 01`. Đáp án: `solutions/`.
Các bài sau dùng lại bài trước (`import … from './ex01.js'`), nên làm theo thứ tự.

**Pass:** 7/8 bài, dùng ≤ 2 hint. Test dựng server thật ở cổng ngẫu nhiên và gọi bằng `fetch`.

---

## 🟢 Cơ bản

### ex01 · `HttpError` và `sendJson`
- `class HttpError extends Error`: constructor `(status, message, { cause, expose } = {})`; có `name = 'HttpError'`, `status`, `expose` (mặc định `status < 500`), và `cause` nếu được truyền.
- `sendJson(res, status, body, headers = {})`: ghi `Content-Type: application/json; charset=utf-8`, `Content-Length` đúng **số byte**, rồi `end`. `headers` thêm vào (được phép ghi đè `Content-Type`). Nếu `body === undefined` → không có `Content-Type`, `Content-Length: 0`, không body.

### ex02 · `readBody` và `parseJsonBody`
- `readBody(req, { limit = 1048576 } = {})` → chuỗi UTF-8. Quá `limit` byte → ném `HttpError(413, 'Payload Too Large')`, **dừng đọc ngay khi vượt** (kể cả khi body gửi dạng chunked không có `Content-Length`; nếu `Content-Length` khai báo đã vượt thì ném luôn, chưa đọc).
- `parseJsonBody(req, opts)`:
  - body rỗng → `undefined`
  - có body mà `Content-Type` không phải `application/json` (bỏ qua phần `; charset=…`, không phân biệt hoa thường) → `HttpError(415, 'Unsupported Media Type')`
  - JSON sai cú pháp → `HttpError(400, 'Invalid JSON')` (có `cause`)

### ex03 · `createRouter()` thuần (không IO)
`router.add(method, pattern, handler)` (trả `router` để nối chuỗi) và `router.match(method, pathname)`:
- pattern có tham số `:name` (`/orders/:id/items/:itemId`). Một tham số khớp **một** segment (không chứa `/`).
- Khớp → `{ handler, params }`; `params` đã `decodeURIComponent` (chuỗi sai mã hóa như `%E0%A4%A` → ném `HttpError(400, 'Bad Request')`).
- Không route nào khớp path → `{ notFound: true }`.
- Có route khớp path nhưng sai method → `{ methodNotAllowed: true, allow: [...] }` (method viết hoa, sắp xếp, không trùng).
- Bỏ qua `/` cuối của path (`/orders/` ≡ `/orders`); gốc `/` vẫn hợp lệ; phân biệt hoa thường; method không phân biệt hoa thường.
- Route khai báo trước được ưu tiên (`/orders/new` đặt trước `/orders/:id` thì `new` không bị coi là id).

---

## 🟡 Kết hợp

### ex04 · `createApp(router, options)` → `http.Server`
Trả `http.Server` (chưa `listen`) dùng `router` ở ex03. Mỗi request:
1. Tách `pathname` và `query` từ `req.url` (`query` là object; khóa lặp lại → mảng).
2. `router.match`; `notFound` → 404 `{"error":"Not Found"}`; `methodNotAllowed` → 405 `{"error":"Method Not Allowed"}` kèm header `Allow`.
3. Với `POST/PUT/PATCH`: `body = await parseJsonBody(req, { limit: options.bodyLimit })`.
4. Gọi `handler({ req, res, params, query, body })`; kết quả: `undefined` → `204`; `reply(status, body, headers)` (export thêm từ ex04) → dùng như đã chỉ định; giá trị khác → `200` JSON.
5. Lỗi: `HttpError` có `expose` → `status` + `{"error": message}`; mọi lỗi khác (kể cả `HttpError` không `expose`) → `500` + `{"error":"Internal Server Error"}` (không lộ message thật), đồng thời gọi `options.onError?.(err)`. Handler async bị reject cũng phải được bắt.
6. Nếu header đã gửi mà lỗi xảy ra → `res.destroy()` thay vì ghi thêm.

### ex05 · `applyCors(req, res, options)`
`options`: `{ origins: string[], methods = ['GET','POST','PUT','PATCH','DELETE'], headers = ['Content-Type','Authorization'], maxAge = 600 }`. Trả `true` nếu request đã được xử lý hoàn toàn (preflight), ngược lại `false` (để handler tiếp tục).
- Không có `Origin` → `false`, không đặt header nào.
- `Origin` nằm trong `origins` (hoặc `origins` chứa `'*'`): đặt `Access-Control-Allow-Origin` = origin của request (hoặc `*` khi cấu hình `'*'`), và `Vary: Origin` (khi echo origin).
- `Origin` không được phép → không đặt `Allow-Origin` nào; preflight từ origin lạ vẫn trả `204` nhưng **không** có `Allow-Origin` (trình duyệt tự chặn).
- Preflight = `OPTIONS` có `Access-Control-Request-Method`: trả `204`, đặt `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Max-Age` (chuỗi số), rồi `end`, return `true`.

### ex06 · `conditionalJson(req, res, body)` — ETag
- `payload = JSON.stringify(body)`; `ETag` = `"` + sha1 hex của payload + `"`.
- `If-None-Match` khớp (danh sách phân cách bằng dấu phẩy, bỏ tiền tố `W/`, hoặc `*`) → `304`, có `ETag`, **không body**.
- Ngược lại `200` với `ETag`, `Cache-Control: no-cache`, JSON đúng `Content-Length` (byte).
- Chỉ áp dụng cho `GET`/`HEAD`: các method khác luôn `200` (kể cả có `If-None-Match`). `HEAD` trả header, không body.

---

## 🔴 Thực tế

### ex07 · `fetchJson(url, options)` — client chịu lỗi
App Nest của bạn gọi dịch vụ giao hàng bên ngoài hay chập chờn. Viết client:
- `options`: `{ method, headers, body (object → JSON), timeoutMs = 2000, retries = 2, backoffMs = 20 }`.
- Trả JSON đã parse khi `2xx`. `204` → `undefined`.
- Mỗi lần thử có timeout `timeoutMs` (dùng `AbortSignal.timeout`); hết hạn → lỗi `Error` có `name = 'TimeoutError'`.
- Thử lại (tối đa `retries` lần thêm) khi lỗi mạng, timeout, hoặc `502/503/504`, chờ `backoffMs * 2 ** lầnThử` giữa các lần. **Không** thử lại với `4xx` và `500` (nhiều khả năng lỗi logic, thử lại chỉ làm tệ hơn). Với `POST`/`PATCH` chỉ thử lại khi caller truyền `idempotent: true`.
- Lỗi cuối cùng ném `HttpError`-like `Error` có `status` (nếu có response) và `body` (text) để debug.

### ex08 · `createRateLimiter({ limit, windowMs, now, trustProxy })`
Giới hạn kiểu fixed-window theo client.
- Trả hàm `check(req, res)` → `true` nếu **bị chặn** (đã gửi `429` `{"error":"Too Many Requests"}` kèm `Retry-After` là số giây còn lại của cửa sổ, làm tròn lên); `false` nếu cho qua.
- Mọi response (cho qua hoặc chặn) có `X-RateLimit-Limit`, `X-RateLimit-Remaining` (không âm).
- Định danh client: `req.socket.remoteAddress`; nếu `trustProxy` thì ưu tiên phần tử **đầu** của `X-Forwarded-For`.
- `now` là hàm trả mili giây (mặc định `Date.now`) để test điều khiển thời gian. Hết `windowMs` kể từ request đầu của client thì cửa sổ mới.
- Không rò bộ nhớ: dọn các client có cửa sổ đã hết hạn. Hàm `check.size()` trả số client đang được nhớ (test: sau khi qua cửa sổ và có request mới, các client cũ phải bị dọn).

> 📏 Câu hỏi quy mô (không chấm): `ex08` lưu một entry mỗi IP. Nếu bị tấn công từ 5 triệu IP khác nhau trong 1 phút thì RAM của rate limiter là bao nhiêu? Trong cluster 4 instance, giới hạn thực tế của mỗi client là bao nhiêu? Giải pháp sẽ học ở B07/P09 (Redis).
