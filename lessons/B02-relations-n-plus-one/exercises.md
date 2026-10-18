# B02 · Bài tập

Tiếp tục `shop-api` sau B01 và Q02. Bật DB: `docker compose -f env/docker-compose.yml up -d postgres`. Chấm: `bash lessons/check.sh lessons/B02-relations-n-plus-one NN|all`. **Bộ chấm bắt đầu từ DB trống** (xóa sạch schema `public` rồi để ứng dụng dựng lại); trên DB dev cũ của bạn, thêm khóa ngoại có thể làm ứng dụng không khởi động (xem README, bẫy 1), hãy `TRUNCATE` dữ liệu thử hoặc tạo danh mục `id = 1` trước.

Quy ước chung: khóa ngoại đặt tên `fk_<bảng>_<ý>`; ràng buộc `uq_*`/`ck_*` như B01; lỗi vẫn là problem+json (C06): danh mục không thấy khi tra cứu → `404 category-not-found`, tham chiếu danh mục không có → `422 invalid-category`, xóa bị chặn → `409 category-in-use`, slug trùng → `409 duplicate-slug`, nhãn không thấy → `404 tag-not-found`. Lỗi domain mới: thêm class vào `domain-errors.ts` và (nếu không phải 422) một dòng vào bản đồ status của filter. `categoryId` mặc định của sản phẩm vẫn là `1` (C02): DB trống thì phải tạo danh mục 1 trước, nếu không POST trả `422`.

**Pass:** 7/8 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 1-n: Category → Product
- Khóa ngoại `fk_products_category` (`products.category_id → categories.id`, `ON DELETE RESTRICT`) và index phủ cột `category_id`.
- `CategoriesModule` (`src/categories/`), import vào `AppModule`:
  - `POST /v1/categories` (`@AdminOnly`) `{ name (1..100), slug (^[a-z0-9]+(-[a-z0-9]+)*$, ≤100), parentId? }` → `201` + `Location: /v1/categories/:id`, thân `{ id, parentId, name, slug }`; slug trùng `409 duplicate-slug`; dữ liệu sai `400`.
  - `GET /v1/categories/:id` (`404 category-not-found`, id sai `400`), `DELETE /v1/categories/:id` (`@AdminOnly`, `204`; còn sản phẩm hoặc con → `409 category-in-use`, sản phẩm còn nguyên).
  - `GET /v1/categories/:id?include=products` → thêm `products: [{ id, sku, name, price }]` sắp theo `id`.
- `POST`/`PATCH /v1/products` với `categoryId` không tồn tại → `422 invalid-category` (không phải 500), DB không đổi.

### ex02 · Cây danh mục
- Khóa ngoại tự tham chiếu `fk_categories_parent` (`RESTRICT`) và `idx_categories_parent`.
- `parentId` không tồn tại → `422 invalid-category`. `?include=children` trả các con **trực tiếp** (sắp theo `id`, mỗi con `{ id, parentId, name, slug }`; lá có `[]`). Không include thì không có `children`/`products`. `include` lạ → `400`; `?include=a&include=b` cũng được.
- Xóa danh mục còn con → `409`; xóa con trước thì xóa được cha.

---

## 🟡 Kết hợp

### ex03 · n-n: Product ↔ Tag
- Bảng `tags (id, name varchar(30))`: `uq_tags_name`, `ck_tags_name` (`^[a-z0-9-]{1,30}$`). Bảng nối `product_tags` khóa chính ghép `(product_id, tag_id)`, hai khóa ngoại `fk_product_tags_product`, `fk_product_tags_tag`, đều `ON DELETE CASCADE`.
- `PUT /v1/products/:id/tags` (`@AdminOnly`) `{ tags: string[] }` (mỗi nhãn khớp mẫu trên, ≤ 20 nhãn, không trùng) → `200 { productId, tags }` sắp theo tên. **Thay thế** toàn bộ tập nhãn (`[]` = gỡ hết); nhãn mới tự được tạo, nhãn đã có dùng lại. Sai → `400`; sản phẩm không có → `404 product-not-found`.
- `GET /v1/tags` → `{ data: [{ name, productCount }] }` sắp theo tên, **một truy vấn**; `GET /v1/tags/:name/products` → `{ data: [{ id, sku, name, price }], meta: { total } }`; nhãn lạ `404 tag-not-found`; tên sai định dạng `400`.
- Xóa sản phẩm: dòng nối biến mất, nhãn và sản phẩm khác còn nguyên.

### ex04 · 1-1 và khóa ngoại phía đơn hàng
- `user_profiles (user_id integer PK, phone varchar(20) NULL, address varchar(255) NULL, updated_at timestamptz)` với `fk_user_profiles_user` (`CASCADE`). Metadata ORM phải thể hiện quan hệ **one-to-one**, bên sở hữu là `UserProfile`, join qua `user_id`.
- Khóa ngoại có tên: `fk_orders_user` (`RESTRICT`), `fk_order_items_order` (`CASCADE`), `fk_order_items_product` (`RESTRICT`), `fk_payments_order` (`RESTRICT`). Sai tham chiếu → `23503`; xóa dòng còn bị tham chiếu (`RESTRICT`) → **`23001`**.
- **Mọi khóa ngoại phải có index** với cột đầu là cột khóa ngoại (kể cả hai cột của bảng nối `product_tags`, mà TypeORM tự tạo). Gợi ý: `UNIQUE (order_id, product_id)` đã phủ `order_id`.
- `DELETE /v1/products/:id` cho sản phẩm đã nằm trong `order_items` → `409` problem+json (không phải 500, sản phẩm còn nguyên).

### ex05 · `?include=` trên chi tiết sản phẩm
`GET /v1/products/:id?include=category,tags` (cả hai tùy chọn): thêm `category: { id, name, slug }` và/hoặc `tags: string[]` (sắp theo tên; sản phẩm chưa có nhãn → `[]`).
- Không include: response **không có** hai khóa này và tốn đúng **1 truy vấn không JOIN**.
- Include cả hai: ≤ 2 truy vấn, **không tăng theo số nhãn**. Giá trị lạ (kể cả `Category` viết hoa) → `400`; `?include=` rỗng = không có; id lạ vẫn `404`, id sai `400`.
- Sau khi đổi nhãn, đọc lại phải thấy dữ liệu mới (cache GET của C08 bị xóa khi có ghi).

---

## 🔴 Thực tế

### ex06 · "Trang danh mục mở chậm dần"
Team báo trang danh mục nhanh lúc có 10 mục, chậm hẳn khi có vài trăm. Đếm truy vấn của `GET /v1/categories?include=products` và `?include=children,products`:
- `GET /v1/categories` → `{ data: [...] }` sắp theo `id`; với `include=products` mỗi danh mục có `products` (sắp theo `id`), kể cả `[]` khi trống (LEFT JOIN, không làm mất dòng).
- Số truy vấn **≤ 2 và bằng nhau** ở 10 và 60 danh mục (không N+1). Không include: đúng 1 truy vấn, không JOIN. Gợi ý: bộ chấm đếm bằng `countQueries` của testkit; bạn có thể dùng chính nó trong test của mình.

### ex07 · "Hai người cùng gắn nhãn" (race condition)
Thỉnh thoảng gắn nhãn trả `500` hoặc để lại trạng thái lạ. Làm cho:
- 20 `POST /v1/categories` đồng thời cùng slug: đúng 1 × `201`, 19 × `409 duplicate-slug`, không `5xx`.
- 10 sản phẩm cùng được gắn nhãn **mới** `race-tag` đồng thời: tất cả `200`, `tags` chỉ có 1 dòng `race-tag`, `product_tags` có 10 dòng.
- 40 `PUT` đồng thời trên **cùng một** sản phẩm với hai tập 20 nhãn chồng lấn: không `5xx`, trạng thái cuối đúng bằng **một** trong hai tập (không trộn).
- `PUT` lặp lại cùng tập không sinh dòng nối thừa.

---

## 📏 ex08 · N+1 tốn bao nhiêu khi số danh mục tăng?
Viết `lessons/B02-relations-n-plus-one/answers/ex08.md`:
1. Mục **Dự đoán** (viết trước): thời gian và số truy vấn của hai cách lấy "danh mục kèm sản phẩm" (vòng lặp `find` từng danh mục so với `relations`) ở 10, 100, 1000 danh mục.
2. Đo (trong test hoặc script của bạn, đếm truy vấn bằng `countQueries`), lấy trung vị nhiều lần. Bảng `| số danh mục | truy vấn ngây thơ | truy vấn relations | ms ngây thơ | ms relations |` (ít nhất ba mức; mỗi dòng ≥ 3 con số; số truy vấn của `relations` không đổi).
3. Mục **Kết luận** (≥ 400 ký tự): gọi tên N+1, nguyên nhân, cách sửa, và **cái giá của JOIN nhiều quan hệ to-many** (tích Descartes).

Bộ chấm chỉ kiểm cấu trúc và độ dài, không kiểm con số.
