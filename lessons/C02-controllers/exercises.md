# C02 · Bài tập

Code trong `shop-api/`. Chấm từng bài: `bash lessons/check.sh lessons/C02-controllers 01` … `08` hoặc `all`. Giữ nguyên các file C01 tạo (`nest g resource products` sinh sẵn controller, service, dto, entity, module): sửa chúng, đừng tạo thư mục song song.

Quy ước chung (xem `lessons/_shop-api/CONTRACT.md`): tiền là **số nguyên VND**, ID là số nguyên, thời gian ISO 8601 UTC. Lưu trữ **trong bộ nhớ** (một `Map`/mảng trong service); DB chỉ đến ở B01. Chưa có `ValidationPipe`: validate tay theo yêu cầu từng bài. Lỗi dùng class mặc định của Nest (`NotFoundException`...); định dạng thân lỗi chưa được kiểm.

Mô hình `Product` trả về: `{ id, categoryId, sku, name, brand, price, stock, attributes, isActive, createdAt }`.

**Pass:** 7/8 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Versioning, tạo và đọc sản phẩm
- Bật URI versioning trong `configureApp` (`src/app.setup.ts`). **Không** đặt `defaultVersion`: `/ping` phải vẫn là `/ping`.
- `ProductsController` thuộc `v1`.
- `POST /v1/products` body `{ sku, name, price, categoryId?, brand?, stock?, attributes?, isActive? }`.
  - `201` + header `Location: /v1/products/<id>` + body là sản phẩm đầy đủ. Mặc định: `categoryId=1`, `brand=null`, `stock=0`, `attributes={}`, `isActive=true`. `name` được `trim`.
  - `sku` bắt buộc, dạng `^[A-Z0-9-]{3,20}$` (xem ex07 về chữ hoa). `name` 1..120 ký tự. `price` số nguyên `>= 0`. Sai bất kỳ điều nào → `400`.
- `GET /v1/products/:id` → `200`, kèm header `Cache-Control: public, max-age=60`; không tồn tại `404`; `id` không phải số nguyên `400`.
- `GET /v1/products` → `200 { data: Product[], meta: { page, limit, total } }` (chi tiết phân trang ở ex03).
- `/products` (không phiên bản) → `404`.

### ex02 · PATCH và DELETE
- `PATCH /v1/products/:id` cập nhật **một phần**. Trả `200` + sản phẩm sau cập nhật.
  - `brand: null`, `stock: 0`, `isActive: false` phải được áp dụng (đừng dùng `||`/`if (dto.x)`).
  - Không cho đổi `id`, `createdAt` dù client gửi.
  - Giá trị sai → `400`; không tồn tại → `404`; đổi `sku` trùng sản phẩm khác → `409`; gửi lại đúng `sku` của chính nó → `200`.
- `DELETE /v1/products/:id` → `204` không body; xóa lại → `404`.

---

## 🟡 Kết hợp

### ex03 · Phân trang và sắp xếp
Mở rộng `GET /v1/products`:
- `page` (nguyên `>= 1`, mặc định 1), `limit` (nguyên `1..100`, mặc định 20). Sai → `400` (kể cả `1.5`, `abc`, `0`).
- `sort`: `id | price | name | createdAt | stock`, thêm tiền tố `-` để giảm dần. Mặc định `id` tăng. Trường lạ (`password`) hoặc chỉ `-` → `400`.
- Gọi `sort` không được làm đổi thứ tự lưu trữ (lần gọi mặc định sau đó vẫn theo id).

### ex04 · Bộ lọc
- `brand`: so khớp **đầy đủ**, không phân biệt hoa thường; sản phẩm `brand=null` không khớp bộ lọc nào.
- `minPrice`, `maxPrice`: số nguyên, **bao gồm biên**. `0` là giá trị hợp lệ. `minPrice > maxPrice` hoặc không phải số nguyên → `400`.
- `q`: tìm trong `name`, không phân biệt hoa thường, nguyên văn (ký tự như `(` hay `.*` không có nghĩa đặc biệt).
- Bộ lọc kết hợp được với phân trang/sort; `meta.total` đếm **sau** khi lọc.

### ex05 · Redirect và thứ tự route
- `GET /v1/p/:sku` → `302` với `Location: /v1/products/<id>` (SKU không phân biệt hoa thường). SKU không có → `404`, không có header `Location`. (Gợi ý: một controller riêng, `path: 'p'`.)
- `GET /v1/products/count` → `200 { count }` (số sản phẩm hiện có). Không để `:id` nuốt route này.

### ex06 · v2 và wildcard
- `GET /v2/products` trả `{ items: Product[], pagination: { page, limit, total, pages } }` với `pages = ceil(total / limit)`; dùng **cùng** bộ lọc/sort/phân trang với v1 và **cùng service**. v1 giữ nguyên hình dạng cũ. `/v2/products/:id` không tồn tại → `404`.
- `ALL /v1/legacy/**` (mọi method, mọi độ sâu) → `410 Gone`. Lưu ý cú pháp wildcard của Nest 12.

---

## 🔴 Thực tế

### ex07 · "Cùng một SKU mà tạo được hai sản phẩm"
Team kho báo: nhân viên nhập `ao-001`, người khác nhập `AO-001`, hệ thống có hai sản phẩm trùng SKU và in nhãn sai.
- SKU được `trim` và đổi sang **chữ hoa** trước khi kiểm tra/lưu/trả về. Trùng (sau chuẩn hóa) → `409`.
- Quy tắc áp dụng ở mọi nơi dùng SKU (`POST`, `PATCH`, `/v1/p/:sku`).
- Xóa rồi tạo lại cùng SKU được phép; `id` **không bao giờ tái sử dụng**.
- SKU 20 ký tự hợp lệ, 21 ký tự → `400`.

### ex08 · "Lướt trang bị lặp sản phẩm"
Team mobile báo: sắp theo giá, cuộn qua 3 trang thì thấy cùng sản phẩm hai lần và có sản phẩm biến mất.
- Khi giá trị sắp xếp bằng nhau, phân xử bằng `id` **tăng dần**, kể cả khi `sort=-price`.
- Đi hết các trang của `sort=price` và `sort=-price` (limit 3) phải ra đúng tập sản phẩm, không trùng, không sót, và lặp lại giống hệt giữa các lần gọi.

---

> 📏 Câu hỏi (không chấm): `GET /v1/products?sort=-price&limit=100` khi kho có 1 triệu dòng sẽ tốn bao nhiêu thời gian và bộ nhớ với cách làm trong bài này (lọc, copy, sort toàn bộ trước khi cắt trang)? Vì sao DB và `ORDER BY ... LIMIT` (B04) giải quyết tốt hơn? Chỉ cần suy luận độ phức tạp, chưa cần đo.
