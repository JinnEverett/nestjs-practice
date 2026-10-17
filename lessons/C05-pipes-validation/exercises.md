# C05 · Bài tập

Tiếp tục `shop-api` sau C04. Cài thêm: `npm i class-validator class-transformer`. `@nestjs/mapped-types` đã có từ C01. Chấm: `bash lessons/check.sh lessons/C05-pipes-validation NN|all`.

Từ module này mọi route nhận dữ liệu đi qua `ValidationPipe` toàn cục (đăng ký trong `configureApp`): `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. Lỗi validation là `400` với thân mặc định của Nest `{ statusCode, error, message: string[] }`; mỗi phần tử của `message` nêu **tên field** bị lỗi. Giữ nguyên các lỗi `404/409/422` đến từ service.

Một số hành vi cũ đổi vì whitelist (ví dụ gửi thêm `id` khi PATCH trước đây bị bỏ qua, giờ là `400`). Đó là chủ ý.

**Pass:** 7/8 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · `ValidationPipe` toàn cục + `CreateProductDto`
Chuyển luật của `POST /v1/products` (C02 ex01, ex07) sang DTO (`src/products/dto/create-product.dto.ts`):
- `sku`: trim + chữ hoa rồi khớp `^[A-Z0-9-]{3,20}$`. `name`: trim, 1..120 ký tự, là chuỗi. `price`: số nguyên `>= 0` (chuỗi `"100"` là sai). `categoryId?`: nguyên `>= 1`. `brand?`: chuỗi tối đa 80 ký tự hoặc `null`. `stock?`: nguyên `>= 0`. `attributes?`: object (không phải mảng). `isActive?`: boolean thật.
- Thiếu field bắt buộc: `message` liệt kê **tất cả** field lỗi, không dừng ở lỗi đầu. Field lạ → `400` và nêu tên field lạ.

### ex02 · DTO cho query của `GET /v1/products`
`src/products/dto/list-products-query.dto.ts`, dùng cho cả `/v1/products` và `/v2/products`:
- `page` (nguyên `>= 1`, mặc định 1), `limit` (nguyên `1..100`, mặc định 20), `sort` (`id|price|name|createdAt|stock`, tiền tố `-` tùy chọn, mặc định `id`), `brand`, `minPrice`, `maxPrice` (nguyên `>= 0`), `q`.
- Giá trị sai (`page=abc`, `page=1.5`, `limit=101`, `sort=password`, `page=1&page=2`...) → `400`. Tham số lạ (`?color=red`) → `400`.
- Controller không còn tự parse chuỗi: nhận DTO đã chuyển kiểu (`meta.page` là số).

---

## 🟡 Kết hợp

### ex03 · DTO lồng cho đơn hàng
`CreateOrderDto` + `CreateOrderItemDto` (`src/orders/dto/create-order.dto.ts`):
- `items`: mảng 1..50 phần tử, mỗi phần tử `{ productId: nguyên >= 1, quantity: nguyên 1..100 }`, **không** được có field khác (`unitPrice`...). Lỗi trong phần tử nêu đường dẫn: `items.1.quantity ...`.
- `discountCode?`: chuỗi `^[A-Za-z0-9-]{1,20}$` hoặc `null`. Chuỗi rỗng → `400`. Mã đúng định dạng nhưng không tồn tại vẫn là `422` (do service).
- `items` không phải mảng, phần tử không phải object (`5`, `null`) → `400`.

### ex04 · PATCH với `PartialType`
`UpdateProductDto extends PartialType(CreateProductDto)`:
- Chỉ field có mặt mới bị kiểm, luật y như Create. Body `{}` → `200` không đổi gì.
- Gửi `null` cho field không cho phép null (`price`, `stock`, `isActive`, `categoryId`, `name`, `sku`, `attributes`) → `400` và dữ liệu không đổi; `brand: null` hợp lệ.
- `id`, `createdAt` trong body → `400`. `PATCH` id không tồn tại với body hợp lệ vẫn `404`.

### ex05 · Pipe tự viết
- `src/common/pipes/parse-id.pipe.ts` export `ParseIdPipe`: nhận `string | number`, trả số nguyên dương **an toàn** (`Number.isSafeInteger`). Từ chối `0`, số âm, số lẻ, chuỗi có khoảng trắng/dấu/`1e3`/`0x10`/số 0 đứng đầu, số vượt `2^53`, rỗng. Ném `BadRequestException` có chứa tên tham số (`metadata.data`).
- `src/common/pipes/parse-sku.pipe.ts` export `ParseSkuPipe`: trim + chữ hoa rồi kiểm `^[A-Z0-9-]{3,20}$`.
- Dùng `ParseIdPipe` cho mọi `:id` của products và orders; `ParseSkuPipe` cho `GET /v1/p/:sku` (sku sai định dạng → `400`, đúng nhưng không có → `404`).

### ex06 · Validator tùy biến
- Luật `minPrice <= maxPrice` của query (C02 ex04) được thực hiện bằng một **validator tùy biến** đặt trong `src/common/validators/` (dùng `registerDecorator` hoặc `@ValidatorConstraint`).
- Vi phạm → `400`, `message` nhắc `minPrice`. Bằng nhau, chỉ một vế, `minPrice=0` → hợp lệ.

---

## 🔴 Thực tế

### ex07 · "Lọc ngừng bán lại ra hàng đang bán"
Team mobile báo: bật bộ lọc "đã ngừng bán" nhưng danh sách toàn hàng đang bán. Sản phẩm có field `isActive`; thêm bộ lọc `isActive` cho `GET /v1/products` (kể cả v2).
- `?isActive=true|false` lọc đúng; vắng mặt thì không lọc. Giá trị khác (`abc`, `1`, `0`, rỗng, `TRUE`) → `400`.
- Body **không** tự ép kiểu: `price: "100000"`, `isActive: "false"`, `stock: "5"` → `400`. `isActive: false` trong body được giữ là `false`.

### ex08 · "Khách tự đặt trạng thái đơn"
Pentest nội bộ báo: gửi `{"status":"paid","totalAmount":1,"userId":2}` khi đặt hàng thì hệ thống không báo lỗi; kèm `__proto__` thì không biết chuyện gì xảy ra.
- Đặt hàng với field ngoài `items`/`discountCode` (`userId`, `status`, `totalAmount`, `shippingFee`, `id`, `createdAt`) → `400`, tồn kho không đổi. Tạo sản phẩm với `id`/`createdAt` → `400`.
- Body chứa `__proto__` hoặc `constructor.prototype`: không `500`, `Object.prototype` không bị thêm thuộc tính.
- JSON hỏng hoặc body không phải object (`[]`, `"x"`, `5`, `null`) → `400`. Thân lỗi chỉ gồm `statusCode`, `error`, `message`, không có stack.

---

> 📏 Câu hỏi (không chấm): `ValidationPipe` với `class-transformer` tạo instance DTO và duyệt decorator cho **mỗi** request. Với `POST /v1/orders` chứa 50 dòng hàng, bạn đoán thời gian validate chiếm bao nhiêu phần trăm tổng thời gian xử lý? Đo bằng `console.time` quanh `pipe.transform(...)` (hoặc `bench`), rồi so với `JSON.parse` của cùng body.
