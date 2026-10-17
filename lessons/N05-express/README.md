# N05 · Express (nền của Nest)

Đọc khoảng 10 phút. Mặc định `@nestjs/platform-express` chạy trên Express. Guard, pipe, interceptor, filter của Nest đều được "dịch" thành middleware Express phía dưới. Hiểu Express 5 là hiểu mô hình request của Nest.

## Mục tiêu: sau buổi này bạn làm được
- Giải thích **chuỗi middleware**, `next()`, `next('route')`, `next(err)` và thứ tự khai báo.
- Viết middleware (id request, log, xác thực, validate) và error middleware 4 tham số.
- Tách ứng dụng thành `Router` + `router.param`.
- Dừng server **êm** (graceful shutdown) không làm rơi request đang chạy.
- So sánh Express với Fastify (adapter thay thế trong P04).

---

## 1. Mô hình middleware
```js
import express from 'express';
const app = express();
app.use(express.json({ limit: '100kb' }));          // parse body → req.body
app.use((req, res, next) => { req.startedAt = Date.now(); next(); });
app.get('/orders/:id', (req, res) => res.json({ id: req.params.id }));
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));          // không route nào khớp
app.use((err, req, res, next) => res.status(err.status ?? 500).json({ error: 'x' })); // 4 tham số = error handler
```
- Mỗi middleware nhận `(req, res, next)`; hoặc **kết thúc** response, hoặc gọi `next()`.
- `next(err)` nhảy thẳng tới error handler kế tiếp. `next('route')` bỏ qua các handler còn lại của *route hiện tại*.
- **Thứ tự khai báo = thứ tự chạy.** 404 và error handler đặt **cuối cùng**.
- Express **5**: handler `async` bị reject thì lỗi tự chuyển vào `next(err)` (Express 4 thì treo/crash). `req.body` là `undefined` nếu không có parser nào khớp. Cú pháp path đổi (path-to-regexp 8): wildcard là `/files/*splat`, tham số tùy chọn là `/users{/:id}`.

## 2. Router
```js
const orders = express.Router();
orders.param('id', (req, res, next, id) => { /* validate một lần cho mọi route có :id */ next(); });
orders.get('/', list).post('/', create).get('/:id', one);
app.use('/orders', orders);      // mount: orders thấy đường dẫn đã bỏ "/orders"
```
Đây chính là `@Controller('orders')`: nhóm route dưới một tiền tố.

## 3. Xử lý lỗi
Error middleware có **4 tham số** (Express nhận dạng theo `fn.length`). Nguyên tắc giống N04: lỗi 4xx có `expose` thì hiện message; mọi thứ còn lại → 500 chung chung và **log** lỗi thật. Nếu `res.headersSent`, đừng ghi thêm, gọi `next(err)` để Express đóng kết nối. Lỗi parse JSON của `express.json()` có `err.status === 400` và `err.type === 'entity.parse.failed'`; quá lớn: `413`/`entity.too.large`.

## 4. Bảo mật tối thiểu trong middleware
- So sánh secret (API key, token) bằng `crypto.timingSafeEqual`. Hàm này ném lỗi nếu hai buffer khác độ dài, nên băm cả hai bằng SHA-256 trước (luôn 32 byte) rồi mới so sánh.
- **Whitelist** field của body (loại field lạ) — chống mass assignment (`isAdmin: true`). `ValidationPipe({ whitelist: true })` của Nest làm đúng việc này.
- Đừng tin `req.ip` / `X-Forwarded-For` khi chưa cấu hình `app.set('trust proxy', …)`.

## 5. Graceful shutdown
`server.close()` ngừng nhận kết nối **mới**, nhưng kết nối keep-alive đang rảnh vẫn giữ server sống; request đang chạy phải được chờ xong. Quy trình: ngừng nhận → đặt `Connection: close` cho response còn lại → chờ in-flight (có timeout) → `closeIdleConnections()` → thoát. Nest làm việc này qua `enableShutdownHooks()` + `app.close()` (P02).

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Quên `next()` | request treo | luôn kết thúc hoặc `next()` |
| Gọi cả `res.send()` lẫn `next()` | "headers already sent" | `return res.send()` |
| 404/error handler đặt trước route | route không bao giờ tới | đặt cuối |
| Tin `req.body` có dữ liệu | `undefined` khi thiếu `content-type` | kiểm tra, validate |
| Dùng `===` so API key | timing attack | `timingSafeEqual` |
| `app.use(express.json())` không `limit` | mặc định 100kb; tăng bừa → DoS | đặt limit có chủ ý |
| Handler Express 4 `try/catch → next(e)` copy sang | thừa; vẫn chạy | Express 5 tự bắt |

## Bên trong Nest dùng cái này ở đâu
- `NestFactory.create(AppModule)` tạo `express()`; middleware Nest (`configure(consumer)`) = `app.use` có điều kiện route; global prefix = mount Router.
- `ExceptionFilter` ≈ error middleware; `ValidationPipe` ≈ ex07; `@UseGuards` ≈ ex06. Nest *không* dùng `next()` giữa guard/pipe/interceptor (chúng có pipeline riêng) — chỉ lớp middleware mới là Express thuần.
- `@nestjs/platform-fastify` thay Express bằng Fastify (nhanh hơn ~2× ở hello-world), nhưng thư viện middleware kiểu Express phải có bản tương thích.
