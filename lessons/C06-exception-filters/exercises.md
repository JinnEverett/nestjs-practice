# C06 · Bài tập

Tiếp tục `shop-api` sau C05. Chấm: `bash lessons/check.sh lessons/C06-exception-filters NN|all`. Một số bài gắn thêm controller thử nghiệm vào `AppModule` của bạn để ép ra các loại lỗi.

Định dạng đích (xem `CONTRACT.md` mục 4): `Content-Type: application/problem+json`, thân `{ type, title, status, detail, instance, errors?, ...extension }` với `type = "urn:shop:error:<code>"`. `title` là cụm trạng thái chuẩn HTTP (`Not Found`, `Conflict`, `Internal Server Error`...). Mã `<code>` mặc định theo status:

| status | code | status | code |
|---|---|---|---|
| 400 | `bad-request` | 410 | `gone` |
| 401 | `unauthorized` | 413 | `payload-too-large` |
| 403 | `forbidden` | 415 | `unsupported-media-type` |
| 404 | `not-found` | 422 | `unprocessable-entity` |
| 405 | `method-not-allowed` | 429 | `too-many-requests` |
| 409 | `conflict` | ≥ 500 | `internal` |

Status khác (ví dụ 418) dùng code `error`. Riêng validation dùng `validation` (mục ex02) và các lỗi domain dùng code của chúng (ex03).

**Pass:** 5/6 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Filter toàn cục problem+json
- `src/common/filters/all-exceptions.filter.ts` export `AllExceptionsFilter` với `@Catch()`; đăng ký bằng `APP_FILTER` trong `AppModule`.
- Mọi lỗi (route lạ, `NotFoundException`, `BadRequestException`, 422...) trả đúng định dạng đích. `detail` là thông điệp gốc (route lạ: `Cannot GET /khong-co`). `instance` là path của request.
- Phản hồi thành công không đổi (`application/json`).

### ex02 · Lỗi validation có cấu trúc
- Cấu hình `exceptionFactory` của `ValidationPipe` trong `configureApp` để lỗi validation thành `400`, `type = urn:shop:error:validation`, `errors: [{ field, message }]`.
- `field` có đường dẫn lồng (`items.1.quantity`); liệt kê **mọi** lỗi; mỗi phần tử chỉ có đúng hai khóa `field`, `message`. Không đưa giá trị người dùng gửi vào bất cứ đâu trong phản hồi.
- Lỗi của pipe tham số (`ParseIdPipe`) vẫn là `bad-request` và **không** có `errors`.

---

## 🟡 Kết hợp

### ex03 · Lỗi domain
`src/common/errors/domain-errors.ts` export:
- `abstract class DomainError extends Error` có `code: string` và `extensions: Record<string, unknown>`; `name` = tên lớp con.
- `ProductNotFoundError(productId)` → code `product-not-found`, `extensions = { productId }`.
- `OutOfStockError(productId, requested, available)` → `out-of-stock`, `extensions = { productId, requested, available }`.
- `DuplicateSkuError(sku)` → `duplicate-sku`, `extensions = { sku }`.
- Chúng **không** phải `HttpException`. Service ném chúng (sản phẩm không có → `ProductNotFoundError`; trùng SKU lúc tạo/đổi → `DuplicateSkuError`; không đủ tồn kho khi đặt → `OutOfStockError`); filter map: 404 / 409 / 409 và đưa `extensions` ra thành các thành phần ở gốc phản hồi.
- Xóa sản phẩm đã nằm trong đơn vẫn là `409` với `type = urn:shop:error:conflict`.
- Cập nhật spec của Q01 cho khớp (`rejects.toBeInstanceOf(...)`) nếu bạn đã viết chúng theo status.

### ex04 · 500, lỗi lạ, và không lộ thông tin
- `Error` thường → `500`, `type = urn:shop:error:internal`, `title = Internal Server Error`, `detail` chung chung (không chứa message gốc, stack, hay đường dẫn file). Chi tiết (message + stack) được **log** phía server bằng `Logger.error`.
- `throw 'chuỗi'` và `throw null` → vẫn `500` đúng định dạng, server không chết.
- `HttpException` có status 5xx (vd. `503`): giữ status và `title` của nó, `type = internal`, **ẩn** `detail` gốc.
- `HttpException` 4xx có response dạng object với `message` là mảng: `detail` là các phần tử nối bằng `"; "`.

### ex05 · Lỗi từ tầng HTTP
- JSON hỏng → `400 bad-request`; body quá giới hạn mặc định (~100kb) → `413 payload-too-large`; cả hai là problem+json. (Đây là lỗi `http-errors` của `body-parser`, không phải `HttpException`.)
- `instance` **không** chứa query string.
- Gọi sai method trên route có sẵn (`PUT /v1/orders`) → `404 not-found` (Nest không phân biệt 405).

---

## 🔴 Thực tế

### ex06 · "App mobile phải đoán lỗi từ câu chữ"
Mobile đang so chuỗi `message` để biết "hết hàng" hay "trùng SKU", và vỡ mỗi lần backend sửa câu chữ.
- Ba loại `409` phải phân biệt được bằng `type`: `out-of-stock`, `duplicate-sku`, `conflict`.
- Đơn nhiều dòng không đủ hàng: báo **dòng đầu tiên (theo thứ tự gửi, sau khi gộp trùng) không đủ**, với `requested` là **tổng** đã gộp; tồn kho không dòng nào đổi.
- `title` ổn định theo status; `detail` của "không có sản phẩm" là đúng chuỗi `Không có sản phẩm #<id>`; cùng lỗi gọi hai lần cho kết quả y hệt.

---

> 📏 Câu hỏi (không chấm): filter chạy ở **mọi** request lỗi. Nếu 30% request của client bị 4xx do gửi sai, filter của bạn có làm tăng p99 không? Dự đoán, rồi đo `GET /v1/products/0` (400) với `bench` ở `1,10` connection và so với `GET /ping`.
