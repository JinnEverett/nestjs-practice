# C01 · Bài tập

Code trong `shop-api/` (workspace root `D:\Learning\Nestjs\shop-api`), **không** trong `answers/`.
Chấm từng bài: `bash lessons/check.sh lessons/C01-cli-structure 01` … `04`, hoặc `all`. Đáp án: `solutions/` (overlay lên `shop-api`).
Bộ chấm chạy `tsc --noEmit` (strict) rồi Jest e2e trên `AppModule` của bạn; không cần khởi động server thủ công.

**Pass:** 4/4 bài, `shop-api` chạy được bằng `npm run start:dev` và trả lời `curl localhost:3000/ping`.

---

## Bài 0 · Dựng dự án (không chấm)
Làm theo README mục 1. Chạy `npm run start:dev`, mở `http://localhost:3000` (thấy `Hello World!`), rồi `npm run test:e2e` (xanh). Đọc `main.ts`, `app.module.ts`, `app.controller.ts`.

## 🟢 Cơ bản

### ex01 · Endpoint đầu tiên: `GET /ping`
- `PingController` ở `src/ping/ping.controller.ts` (route `ping`), đăng ký trong `AppModule`.
- `GET /ping` → `200`, JSON `{ "pong": true }`.
- Xóa phần mẫu: `GET /` không còn trả `Hello World!` (phải là `404`). Xóa `app.controller.ts`, `app.service.ts` và test mẫu liên quan, bỏ khỏi `AppModule`.

### ex02 · `configureApp`
- Tạo `src/app.setup.ts` export `configureApp(app: INestApplication): void`; `src/main.ts` phải gọi nó trước `listen`.
- Trong `configureApp`: tắt header `X-Powered-By` (Express) và bật `enableShutdownHooks()`.
- Route lạ trả `404` với body mặc định của Nest: `{ "message": "Cannot GET /khong-co", "error": "Not Found", "statusCode": 404 }`.

---

## 🟡 Kết hợp

### ex03 · Dependency injection với `ClockService`
- `src/clock/clock.service.ts`: `@Injectable() export class ClockService { now(): Date }` (trả `new Date()`).
- `src/clock/clock.module.ts`: `ClockModule` cung cấp **và export** `ClockService`.
- `PingController` nhận `ClockService` qua constructor; `GET /ping` giờ trả `{ "pong": true, "time": "<ISO 8601 của clock.now()>" }`.
- Controller **không** được gọi `new Date()` trực tiếp. Bộ chấm thay `ClockService` bằng bản giả có giờ cố định để kiểm.

### ex04 · Sinh resource bằng CLI
Chạy `nest g resource products` (chọn **REST API**, **Yes** cho CRUD entry points). Đăng ký `ProductsModule` trong `AppModule` (CLI thường tự làm).
Bộ chấm kiểm: tồn tại `src/products/{products.module,products.controller,products.service}.ts`, `src/products/dto/{create-product,update-product}.dto.ts`, `src/products/entities/product.entity.ts`; `GET /products`, `GET /products/1` trả `200`; `POST /products` trả `201`.

---

> 📏 Câu hỏi (không chấm): đo bằng `bench/bench.sh` một endpoint `GET /ping` ở `1,10,100` connection. Bạn kỳ vọng RPS khoảng bao nhiêu trên máy này? So với `bench/hello-server.js` (Node `http` thuần) thì Nest chậm hơn bao nhiêu phần trăm và vì sao? (Gợi ý: số middleware/pipeline Nest chạy cho mỗi request; chưa cần tối ưu, chỉ cần có con số làm mốc cho P04.)
