# C07 · Bài tập

Tiếp tục `shop-api` sau C06. Chấm: `bash lessons/check.sh lessons/C07-middleware-guards NN|all`. Bài kiểm bằng cách bắt `Logger` của Nest (`jest.spyOn(Logger.prototype, 'log' | 'warn' | 'error')`): hãy dùng `Logger` của `@nestjs/common` chứ không phải `console.log`.

**Pass:** 6/7 bài, ≤ 2 hint.

Khóa API: header `X-Api-Key` so với biến môi trường `ADMIN_API_KEY`; khi **không** đặt biến và `NODE_ENV !== 'production'` thì dùng khóa mặc định `dev-admin-key`. Bộ chấm đọc biến trước khi tạo ứng dụng.

---

## 🟢 Cơ bản

### ex01 · `RequestIdMiddleware`
- `src/common/middleware/request-id.middleware.ts` export `RequestIdMiddleware` (class, `NestMiddleware`), áp dụng cho **mọi** route, kể cả route không tồn tại, trong `AppModule.configure`.
- Mọi response (200, 404, 400, 401, 500) có header `X-Request-Id` là UUID.
- Client gửi `X-Request-Id` hợp lệ (`^[A-Za-z0-9._-]{8,64}$`) thì dùng lại; ngược lại (quá ngắn/dài, khoảng trắng, ký tự lạ) sinh UUID mới.
- Id cuối cùng cũng được đặt vào `req.headers['x-request-id']` để các lớp sau đọc.

### ex02 · Middleware ghi log HTTP (dạng hàm)
- `src/common/middleware/http-logger.middleware.ts` export hàm `httpLogger(req, res, next)`. Mỗi request ghi **đúng một dòng** khi response kết thúc, bằng `Logger` của Nest (context bất kỳ): `<METHOD> <path> <status> <ms>ms requestId=<id>`.
- Level: `log` cho `< 400`, `warn` cho `4xx`, `error` cho `5xx`.
- `path` **không** chứa query string. `/ping` không được log.
- Chạy sau `RequestIdMiddleware` để có id.

---

## 🟡 Kết hợp

### ex03 · `ApiKeyGuard`
- `src/common/guards/api-key.guard.ts` export `ApiKeyGuard`. Thiếu hoặc sai khóa → `401` (lỗi qua filter C06: `type = urn:shop:error:unauthorized`). Khóa đúng → qua.
- So khớp bằng `crypto.timingSafeEqual` (không `===`), không ném 500 khi khóa client gửi dài/ngắn khác khóa thật.
- Cấu hình: `ADMIN_API_KEY`; không đặt và dev → `dev-admin-key`; **production** mà không đặt → từ chối **mọi** route ghi (kể cả khi gửi `dev-admin-key`).
- Header khóa nhiều giá trị gộp (`k, k`), khác hoa thường, bị cắt ký tự → `401`.

### ex04 · Guard đặt đúng chỗ
Gắn `@UseGuards(ApiKeyGuard)` vào các route **ghi** và chỉ chúng: `POST/PATCH/DELETE /v1/products...` và `POST /v1/orders`.
- Mọi `GET` (kể cả `/v1/orders/:id`, `/v1/p/:sku`, `/v2/products`, `/ping`) vẫn công khai. Route lạ vẫn `404`. `/v1/legacy/**` mọi method vẫn `410`.
- Thứ tự: guard chạy **trước** pipe và trước khi tìm tài nguyên. Không khóa + body rác → `401`, không có `errors`, không lộ luật validate. `PATCH/DELETE` id không tồn tại không khóa → `401`; có khóa → `404`. Có khóa nhưng body sai → `400 validation`.

### ex05 · Middleware theo route
- Mọi response của `/v1/orders` và `/v1/orders/**` (mọi method, kể cả 401/400/404) có `Cache-Control: no-store`.
- Không ảnh hưởng route khác: `GET /v1/products/:id` vẫn `public, max-age=60`; `/v1/products` và `/ping` không có `Cache-Control`; `/v1/orders-archive` và `/v2/orders/1` không có header này.
- Gợi ý: `consumer.apply(...).forRoutes(OrdersController)`.

---

## 🔴 Thực tế

### ex06 · "Khóa API nằm trong log"
Đợt kiểm toán: tìm thấy `sk-live-...` trong hệ thống log tập trung vì có người gọi `GET /v1/products?apiKey=sk-live-...`, và log ghi cả URL.
- Không bất cứ dòng log nào của Nest (mọi level) chứa khóa: khóa đúng, khóa sai, khóa gửi trong query/q.
- Khóa không xuất hiện trong body hay header của phản hồi lỗi.
- 20 request song song (một nửa khóa đúng) cho kết quả đúng từng cái (`201`/`401` xen kẽ), tạo đúng 10 sản phẩm.
- Khóa client dài 1 hay 500 ký tự hoặc khác khóa thật 1 ký tự → `401`, không bao giờ `500`.

### ex07 · "Log của hai request trộn vào nhau"
Debug sự cố: tìm theo `requestId` ra dòng log của request khác. Nguyên nhân: id lưu ở biến dùng chung.
- 30 request song song, mỗi request gửi id riêng: mỗi response trả đúng id đã gửi, và dòng log của request đó chứa **đúng** id đó (không chứa id của request khác).
- Id giả mạo dài 200 ký tự không xuất hiện trong header phản hồi hay trong log; request không gửi id có id sinh ra khớp giữa header và log.

---

> 📏 Câu hỏi (không chấm): thêm hai middleware và một guard vào mỗi request thì RPS của `GET /v1/products/1` giảm bao nhiêu so với trước C07? Dự đoán %, rồi đo bằng `bench` ở `1,10` connection (trước/sau bằng cách tạm tắt `consumer.apply(...)`). Phần nào trong chuỗi tốn nhất: `randomUUID()`, `res.on('finish')`, hay `Logger` ghi stdout?
