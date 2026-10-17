# J09 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J09-error-handling 01`. Đáp án: `solutions/`.
Các bài ex03, ex05, ex06, ex08, ex09 `import` các lớp lỗi từ `./ex02.js` của bạn → làm ex02 trước.

**Pass:** 8/10 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 try / catch / finally
Đọc `starter/ex01.js`, ghi 11 dòng output vào `answers/ex01.txt`.

### ex02 · Cây custom error
Export 4 class:
- `AppError extends Error`: `constructor(message, { code = 'INTERNAL_ERROR', statusCode = 500, details, cause } = {})`. Có `code`, `statusCode`, `details`; `cause` được giữ (`err.cause`); `name` tự bằng tên class thật (lớp con không phải gán lại). `toJSON()` → `{ name, code, message }` kèm `details` nếu có.
- `NotFoundError extends AppError`: `constructor(message = 'Not found', options = {})` → `NOT_FOUND`, 404
- `ValidationError extends AppError`: `constructor(details = [], message = 'Validation failed', options = {})` → `VALIDATION_ERROR`, 400, `details`
- `ConflictError extends AppError`: `constructor(message = 'Conflict', options = {})` → `CONFLICT`, 409

### ex03 · Lỗi → HTTP response
`export function toErrorResponse(error)` → `{ statusCode, body }`:
- `AppError` (và lớp con): `statusCode` của nó; `body = { code, message }` thêm `details` nếu có
- Mọi thứ khác (Error thường, chuỗi, `null`…): `500`, `body = { code: 'INTERNAL_ERROR', message: 'Internal server error' }` — **không** lộ message gốc

### ex04 · `ensureError` và `attempt`
- `ensureError(value)`: `Error` → trả nguyên; còn lại → `new Error('Non-error thrown: <mô tả>', { cause: value })`
- `attempt(fn, ...args)` → `[null, kếtQuả]` nếu thành công, `[error, undefined]` nếu `fn` ném (error đã qua `ensureError`)

---

## 🟡 Kết hợp

### ex05 · Validate input, gom mọi lỗi
`export function parseOrderInput(input)` — `input` là body JSON đã parse. Kiểm **tất cả** rồi mới ném một `ValidationError` với `details = [{ field, message }]`:
- `input` không phải object thường → một lỗi duy nhất, `field: 'body'`
- `customerId`: số nguyên dương
- `items`: mảng 1–50 phần tử; mỗi phần tử: `productId` số nguyên dương (`field: 'items[0].productId'`), `qty` số nguyên 1–99 (`field: 'items[0].qty'`)
- `note` (tùy chọn): chuỗi ≤ 500 ký tự sau trim
Hợp lệ → trả object **đã chuẩn hóa**, chỉ gồm `{ customerId, items: [{ productId, qty }], note }` (`note` đã trim; rỗng/thiếu → `undefined`). Field lạ bị bỏ.

### ex06 · 🐞 Đừng nuốt lỗi
`starter/ex06.js` bắt mọi lỗi rồi `return null`. Viết lại `export function loadUserProfile(id, repo)`:
- `repo.findById(id)` trả `null` → ném `NotFoundError('User <id> not found')`
- `repo.findById` **ném lỗi** → ném `AppError('Cannot load profile', { code: 'PROFILE_LOAD_FAILED', statusCode: 503, cause: <lỗi gốc> })`
- thành công → `{ id, name }`
- không `console.log`, không trả `null`

### ex07 · Chạy hết rồi báo lỗi gộp
`export function runAll(tasks)` — `tasks` là mảng hàm đồng bộ. Chạy **tất cả** (lỗi ở task này không dừng task sau):
- tất cả thành công → mảng kết quả theo thứ tự
- có lỗi → ném `AggregateError` với `errors` (các lỗi đã qua `ensureError`, theo thứ tự task), `message = '<số lỗi>/<tổng> tasks failed'`, và thuộc tính `results` (mảng kết quả, ô của task lỗi là `undefined`)

### ex08 · Parse body request
`export function parseJsonBody(raw, { maxBytes = 1_000_000 } = {})` (`raw` là chuỗi):
- quá `maxBytes` **byte UTF-8** → `AppError('Payload too large', { code: 'PAYLOAD_TOO_LARGE', statusCode: 413 })`
- JSON sai → `ValidationError([{ field: 'body', message: 'Invalid JSON' }], 'Invalid JSON', { cause: <SyntaxError gốc> })`
- JSON hợp lệ nhưng không phải object thường (mảng, số, `null`…) → `ValidationError` với `field: 'body'`
- hợp lệ → object

---

## 🔴 Thực tế

### ex09 · Error handler toàn cục
`export function createErrorHandler({ logger, isProduction = true })` trả về `handle(error, ctx = {})` → `{ statusCode, body }`:
- Map giống ex03
- `ctx.requestId` có → thêm `requestId` vào `body`
- Lỗi ≥ 500 trong production: message luôn là `'Internal server error'` (kể cả `AppError` 503), giữ `code`
- Không production và lỗi ≥ 500: thêm `body.stack`
- Log: ≥ 500 → `logger.error({ err, requestId })` (`err` là Error, đã qua `ensureError`); 4xx → `logger.warn({ code, message, requestId })`. Mỗi lỗi log đúng **một** lần.

### ex10 · 🔮 Error object
Đọc `starter/ex10.js`, ghi 9 dòng output vào `answers/ex10.txt`.
