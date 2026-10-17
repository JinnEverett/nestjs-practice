# N05 · Bài tập

Viết vào `answers/exNN.js` (ES module), dùng `express` (đã cài ở `lessons/`) và module có sẵn của Node. Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/N05-express 01`. Đáp án: `solutions/`.
Một số bài dùng lại bài trước (`import … from './ex01.js'`).

**Pass:** 7/8 bài (🔮 đúng), dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · `createApp()` — nền
`export function createApp()` trả `express()` app (chưa `listen`):
- `GET /health` → `200 {"status":"ok"}`
- `POST /echo` → `201` và trả lại đúng body JSON nhận được. Body tối đa `10kb`. Không có body → `400 {"error":"Body required"}`.
- Route lạ → `404 {"error":"Not Found"}` (JSON, không phải HTML mặc định của Express).
- JSON sai cú pháp → `400 {"error":"Invalid JSON"}`; body quá lớn → `413 {"error":"Payload Too Large"}`; lỗi khác → `500 {"error":"Internal Server Error"}`. Tự thêm route `GET /boom` ném lỗi (cả đồng bộ lẫn trong handler `async`) để kiểm.

### ex02 · 🔮 Chuỗi middleware, `next('route')`, `next(err)`
Đọc `starter/ex02.js`, ghi output (mỗi dòng một mục, đúng thứ tự) vào `answers/ex02.txt`.

### ex03 · `requestId()` và `accessLog(sink)`
- `requestId()`: gán `req.id` và header phản hồi `X-Request-Id`. Nếu client gửi `X-Request-Id` hợp lệ (chuỗi `[A-Za-z0-9_-]{8,64}`) thì dùng lại, ngược lại sinh `crypto.randomUUID()`.
- `accessLog(sink)`: sau khi response **kết thúc** (`finish`; cả khi client ngắt giữa chừng thì `close`) gọi `sink({ id, method, url, status, ms })` đúng **một lần** cho mỗi request; `ms` là số (đo bằng `process.hrtime.bigint()` hoặc `performance.now()`).
- Cả hai trả về middleware `(req, res, next)`.

---

## 🟡 Kết hợp

### ex04 · `ordersRouter(store)` — Router + `router.param`
`store` có `list()`, `get(id)`, `create(data)`, `update(id, patch)`, `remove(id)` (id là số nguyên; `get/update/remove` trả `undefined`/`false` nếu không có).
Router gắn ở `/orders`:
- `GET /` → mảng; `GET /:id` → object; `POST /` → `201` + `Location: /orders/<id>`; `PATCH /:id` → object đã cập nhật; `DELETE /:id` → `204`.
- `router.param('id', …)`: `id` không phải số nguyên dương → `400 {"error":"Invalid id"}` cho **mọi** route có `:id`. Không tồn tại → `404 {"error":"Order not found"}`.
- Trả lời lỗi bằng cách ném/forward lỗi tới error handler của app (trong test app có error handler dùng `err.status`/`err.message` khi `err.expose`).

### ex05 · `errorHandler({ onError })`
Error middleware (4 tham số):
- `err.expose === true` hoặc (`err.status` 4xx và `err.type` có dạng `entity.*` của body-parser) → trả `err.status` + `{"error": <message chuẩn>}`: `entity.parse.failed` → `Invalid JSON`; `entity.too.large` → `Payload Too Large`; còn lại `err.message`.
- Mọi lỗi khác → `500 {"error":"Internal Server Error"}` và gọi `onError(err, req)`.
- `res.headersSent` → không ghi gì, `next(err)`.
- Trả `{"error": …}` kèm `X-Request-Id` nếu `req.id` có.
Cùng với `notFound()` (trả 404 JSON) — export cả hai.

### ex06 · `requireApiKey(keys)` và `requireRole(role)`
- `requireApiKey(keys)`: `keys` là `{ [key]: { name, roles: [...] } }`. Đọc header `X-Api-Key`; hợp lệ → `res.locals.user = { name, roles }` rồi `next()`; thiếu/sai → `401 {"error":"Unauthorized"}` kèm `WWW-Authenticate: ApiKey`. So sánh bằng `timingSafeEqual` trên SHA-256 của khóa (không dùng `===` / `in` để tra trực tiếp từ input người dùng).
- `requireRole(role)`: sau `requireApiKey`; không có role → `403 {"error":"Forbidden"}`.
- Khóa lạ như `__proto__` hay `constructor` không được làm hỏng/bypass.

---

## 🔴 Thực tế

### ex07 · `validate(schema)` — whitelist + kiểm kiểu
`schema` mô tả `body` (và tùy chọn `query`): `{ body: { name: { type: 'string', min: 1, max: 50 }, qty: { type: 'int', min: 1 }, note: { type: 'string', optional: true } } }`. Kiểu: `string`, `int`, `number`, `boolean`.
- Hợp lệ → thay `req.body` bằng object **chỉ chứa field trong schema** (field lạ như `isAdmin` bị loại), `next()`.
- Sai → `400 {"error":"Validation failed","details":[{"path":"body.qty","message":"..."}]}` (liệt kê **mọi** lỗi, thứ tự theo schema; message ngắn tiếng Anh tùy bạn nhưng phải có chuỗi nêu field).
- `string`: không tự ép kiểu (số `5` không phải string); `min/max` là độ dài. `int/number`: phải là số hữu hạn (chuỗi `"5"` bị từ chối); `int` phải nguyên; `min/max` là giá trị.
- Field thiếu và không `optional` → lỗi `required`. `req.body` không phải object → `400`.

### ex08 · `startServer(app, { port, shutdownTimeoutMs })` — graceful shutdown
Trả Promise của `{ server, port, close() }` (đã listen; `port: 0` = cổng ngẫu nhiên).
`close()` → Promise:
1. Ngừng nhận kết nối mới ngay.
2. Response được gửi **sau thời điểm này** có header `Connection: close`.
3. Chờ các request đang chạy hoàn tất (không cắt giữa chừng).
4. Đóng các kết nối keep-alive đang rảnh để `server.close()` hoàn tất.
5. Quá `shutdownTimeoutMs` mà còn request treo → đóng cứng (`closeAllConnections()`) rồi resolve với `{ forced: true }`; ngược lại `{ forced: false }`.
- Gọi `close()` nhiều lần trả cùng một kết quả.

> 📏 Câu hỏi quy mô (không chấm): chuỗi 10 middleware, mỗi cái thêm 0.05ms CPU. Ở 100 connection, RPS tối đa của một instance (một core) bị chặn bởi gì? Thêm một `JSON.stringify` 200KB mỗi request thì sao?
