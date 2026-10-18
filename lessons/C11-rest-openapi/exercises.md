# C11 · Bài tập

Tiếp tục `shop-api` sau C10. Cài: `npm i @nestjs/swagger`. Chấm: `bash lessons/check.sh lessons/C11-rest-openapi NN|all`. Bộ chấm đọc **`/docs-json`** của ứng dụng bạn và kiểm cấu trúc OpenAPI, nên mọi thứ bạn cần phải *thực sự có mặt trong đặc tả*.

Lưu ý: bộ chấm chạy dưới `ts-jest`, nơi **CLI plugin của Swagger không chạy**. Hãy khai báo tường minh bằng `@ApiProperty`... (có thể bật thêm plugin trong `nest-cli.json` cho `nest build`).

**Pass:** 7/8 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Swagger UI và `/docs-json`
- Trong `configureApp`: `SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs-json' })`. `/docs` trả HTML của Swagger UI; `/docs-json` là OpenAPI 3.x JSON; **không** có tiền tố `/v1`.
- `info`: `title = "Shop API"`, `version = "1.0.0"`, `description` mô tả ngắn (nhắc lỗi là problem+json). Khai báo ba tag: `products`, `orders`, `system`.
- Đặc tả ổn định giữa các lần gọi (không nhúng thời gian/ngẫu nhiên).

### ex02 · Đường dẫn, tag, mô tả
Các thao tác công khai phải có mặt, mỗi cái có `summary` (> 3 ký tự) và **đúng một** tag:
`GET /ping`; `GET|POST /v1/products`; `GET /v1/products/count`; `GET|PATCH|DELETE /v1/products/{id}`; `GET /v2/products`; `GET /v1/p/{sku}`; `POST /v1/orders`; `GET /v1/orders/{id}`.
- Route nội bộ/ngừng hoạt động **không** xuất hiện: `_trace`, `_scope`, `_reports`, `legacy`, `docs`. Không có path thừa.
- `operationId` duy nhất, ổn định, chỉ gồm chữ/số/`_` (gợi ý: `operationIdFactory` ghép tên controller và method).

---

## 🟡 Kết hợp

### ex03 · Schema của DTO và tham số
- `CreateProductDto`, `UpdateProductDto`, `Product`, `Order`, `OrderItem`, `CreateOrderDto`, `CreateOrderItemDto` có `properties` đầy đủ với kiểu và ràng buộc khớp validator: `sku` `pattern ^[A-Z0-9-]{3,20}$`, `name` `minLength 1`/`maxLength 120`, `price` `minimum 0`, `brand` `nullable`, `status` có `enum` 6 trạng thái, `items` `minItems 1`/`maxItems 50`, `quantity` `1..100`; `example` cho sku/name/price.
- `required` của `CreateProductDto` đúng `[sku, name, price]`. **`UpdateProductDto` không có trường nào bắt buộc** nhưng giữ nguyên ràng buộc (dùng `PartialType` của `@nestjs/swagger`).
- `GET /v1/products` mô tả đủ 8 tham số query (`page, limit, sort, brand, minPrice, maxPrice, q, isActive`), tất cả `required: false`, `page`/`limit` có `minimum`/`maximum`/`default`, `sort` có `pattern`. Tham số path `id` kiểu số và bắt buộc.

### ex04 · Hợp đồng lỗi và bảo mật
- Component `ProblemDetailsDto` (`type, title, status, detail, instance` bắt buộc; `errors` tùy chọn là mảng `{ field, message }`).
- Mỗi thao tác khai báo response lỗi tương ứng (ví dụ `POST /v1/orders`: `201, 400, 401, 409, 422`; `GET /v1/products/{id}`: `200, 400, 404`). **Mọi** response 4xx/5xx dùng `content: application/problem+json` trỏ `#/components/schemas/ProblemDetailsDto`. Khai báo `500` cho mọi route có lỗi.
- Security scheme `ApiKey` (`apiKey`, `in: header`, `name: X-Api-Key`); **chỉ** bốn thao tác ghi có `security: ApiKey`. Gợi ý: gộp `ApiSecurity` và response 401 vào `@AdminOnly()` từ C08.
- Schema thành công: `POST /v1/products` 201 → `Product`, `POST /v1/orders` 201 và `GET /v1/orders/{id}` 200 → `Order`; `DELETE` 204 không có nội dung.

### ex05 · Envelope phân trang
- `src/common/swagger/api-paginated-response.decorator.ts` export `ApiPaginatedResponse(Model)`.
- Component `PaginationMetaDto { page, limit, total }` (cả ba bắt buộc).
- `GET /v1/products` 200 là `{ data: Product[], meta: PaginationMetaDto }` (cả hai bắt buộc). `GET /v2/products` 200 là một schema riêng `{ items, pagination: { page, limit, total, pages } }`.
- Thân phản hồi thật khớp tài liệu (đúng các khóa đã công bố).

### ex06 · Header `Link` (và điều kiện GET)
Với các phản hồi danh sách `{ data, meta }` (GET) thêm `Link: <url>; rel="first|prev|next|last"` (RFC 8288):
- URL là path + query hiện tại với `page`, `limit` thay thế; giữ nguyên bộ lọc/sắp xếp. `last = max(1, ceil(total/limit))`; trang đầu không có `prev`, trang cuối không có `next`; `page` vượt quá trang cuối thì `prev` không vượt `last`.
- Có cả khi phản hồi lấy từ cache `HIT` (đặt interceptor **ngoài** cache). Route không phải danh sách không có `Link`.
- Điều kiện GET: `ETag` + `If-None-Match` khớp → `304` không body (có sẵn, bộ chấm chỉ xác nhận bạn không làm hỏng nó).

### ex07 · Khai tử `GET /v1/products/count`
- `src/common/decorators/deprecated.decorator.ts` export `ApiDeprecated({ since, sunset, successor?, summary })`.
- Áp dụng cho `GET /v1/products/count`: phản hồi vẫn `{ count }` nhưng kèm `Deprecation: @1790812800` (2026-10-01T00:00:00Z), `Sunset: Thu, 01 Apr 2027 00:00:00 GMT`, `Link: </v1/products?limit=1>; rel="successor-version"`. Header phải có cả ở lần gọi sau.
- Trong OpenAPI, **chỉ** thao tác đó có `deprecated: true`, `summary` chứa chữ "DEPRECATED". Route khác không có header `Deprecation`/`Sunset`.

---

## 🔴 Thực tế

### ex08 · "Đối tác đổi tên field mà không ai biết"
Đối tác tích hợp báo app của họ gãy sau đợt deploy: một PR "dọn dẹp" đổi `categoryId` thành `category_id` và không ai để ý vì không test nào kiểm contract.
- Xuất đặc tả ra **`openapi.json`** ở gốc `shop-api` (thụt lề 2 khoảng trắng, kết thúc bằng xuống dòng) bằng một script (ví dụ `scripts/export-openapi.ts` chạy bằng `ts-node`, hoặc script npm `docs:export`) và **commit** file này.
- Nội dung `openapi.json` phải khớp **đúng** với `/docs-json` hiện tại. Đổi API mà không xuất lại thì bài này đỏ.
- Contract không chứa bí mật hay đường dẫn nội bộ (`dev-admin-key`, `_trace`, `localhost`...).
- Hãy thử: đổi tên một field trong `Product`, chạy bài ex08, rồi xuất lại contract và đọc `git diff openapi.json`.

---

> 📏 Câu hỏi (không chấm): `SwaggerModule.createDocument` quét toàn bộ metadata mỗi lần gọi. `GET /docs-json` chỉ tính một lần ở khởi động hay mỗi request? Dự đoán, rồi kiểm bằng cách đếm thời gian của 100 lần gọi liên tiếp. Với `bench` ở 100 connection, `/docs-json` so với `/v1/products/1` khác nhau bao nhiêu? Vì sao đặc tả không nên nằm sau API key trong môi trường dev, nhưng cần được cân nhắc ở production (xem A06)?
