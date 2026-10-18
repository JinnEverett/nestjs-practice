# B01 · Bài tập

Tiếp tục `shop-api` sau Q04 (làm **B01 trước Q02**). Cài: `npm i @nestjs/typeorm typeorm pg`. Bật DB: `docker compose -f env/docker-compose.yml up -d postgres` (cổng 5434; bộ chấm dùng DB `shop_test`, `DATABASE_URL` mặc định theo `CONTRACT.md` mục 5). Chấm: `bash lessons/check.sh lessons/B01-typeorm-basics NN|all`.

Quy ước chung: bảng và cột **đặt tên tường minh**, snake_case số nhiều (`products`, `order_items`, `created_at`); ràng buộc đặt tên `uq_<bảng>_<cột>` (UNIQUE) và `ck_<bảng>_<ý>` (CHECK); mọi lỗi API vẫn là problem+json (C06). Bộ chấm đọc **schema thật** từ `information_schema`/`pg_constraint`, nên cách bạn viết entity thế nào cũng được miễn schema đúng. Chưa cần khóa ngoại/quan hệ (B02).

**Pass:** 7/9 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Nối Postgres
- `src/database/database.module.ts` export `DatabaseModule`, import vào `AppModule`. Dùng `TypeOrmModule.forRootAsync` với cấu hình từ `databaseConfig` (`src/config/database.config.ts`, C09), **không** đọc `process.env` trong module này.
- `DataSource` đã khởi tạo, `type = 'postgres'`, nối đúng database trong `DATABASE_URL`. Ngoài production, schema tự tạo (`synchronize`); `GET /v1/products` trên DB trống trả `200` với `data: []`.
- **Thất bại nhanh:** sai địa chỉ DB (ví dụ `127.0.0.1:1`) thì `createTestApp()` bị từ chối trong **dưới 10 giây** (mặc định của thư viện treo ≈ 30 giây). Thêm biến `DB_LOGGING` (boolean, mặc định `false`) vào `Env` và `.env.example`.

### ex02 · Bảng `products`
Entity cho đúng schema sau (`information_schema` phải khớp từng cột):

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `integer` | khóa chính, tự tăng |
| `category_id` | `integer` | `NOT NULL`, mặc định `1` |
| `sku` | `varchar(20)` | `NOT NULL`, UNIQUE tên `uq_products_sku` |
| `name` | `varchar(120)` | `NOT NULL` |
| `brand` | `varchar(80)` | cho phép NULL |
| `price` | `numeric(12,0)` | `NOT NULL` |
| `stock` | `integer` | `NOT NULL`, mặc định `0` |
| `attributes` | `jsonb` | `NOT NULL`, mặc định `{}` |
| `is_active` | `boolean` | `NOT NULL`, mặc định `true` |
| `created_at` | `timestamptz` | `NOT NULL`, mặc định bây giờ |

CHECK có tên: `ck_products_sku_format` (`sku ~ '^[A-Z0-9-]{3,20}$'`), `ck_products_price` (`price >= 0`), `ck_products_stock` (`stock >= 0`). Ghi SQL thẳng cũng bị từ chối với đúng mã: trùng SKU `23505`, vi phạm CHECK `23514`, `numeric(12,0)` tràn `22003`, chuỗi quá dài `22001`.

### ex03 · `categories` và `users`
- `categories`: `id`, `parent_id` (`integer`, NULL được), `name` `varchar(100)`, `slug` `varchar(100)` UNIQUE `uq_categories_slug`.
- `users`: `id`, `email` `varchar(254)`, `full_name` `varchar(120)`, `role` `varchar(20)` mặc định `customer`, `created_at` `timestamptz`. UNIQUE `uq_users_email`; CHECK `ck_users_email_lower` (`email = lower(email)`: `Binh@Example.com` bị từ chối), `ck_users_role` (`customer` hoặc `admin`). **Chưa** có cột mật khẩu (A01).

---

## 🟡 Kết hợp

### ex04 · `orders`, `order_items`, `payments`
- `orders`: `id`, `user_id` `integer`, `status` `varchar(20)` mặc định `pending`, `shipping_fee` / `discount_amount` / `total_amount` đều `numeric(12,0)` (hai cột đầu mặc định `0`), `discount_code` `varchar(40)` NULL được, `created_at`, `updated_at` (`timestamptz`). CHECK `ck_orders_status` (6 trạng thái trong `CONTRACT.md` mục 3) và `ck_orders_amounts` (ba khoản tiền không âm).
- `order_items`: `id`, `order_id`, `product_id`, `quantity` (`integer`, > 0), `unit_price` `numeric(12,0)` (≥ 0). UNIQUE `(order_id, product_id)` tên `uq_order_items_order_product`; CHECK `ck_order_items_quantity`, `ck_order_items_unit_price`.
- `payments`: `id`, `order_id`, `method` (`card|ewallet|bank_transfer|cod`), `status` (`succeeded|failed|refunded`), `amount` `numeric(12,0)` (≥ 0), `created_at`. CHECK `ck_payments_method`, `ck_payments_status`, `ck_payments_amount`. **Không** UNIQUE theo `order_id` (một đơn có thể thanh toán nhiều lần).
- Mọi bảng có khóa chính; mọi ràng buộc ngoài PK đặt tên `uq_*`/`ck_*`.

### ex05 · Repository thật
- `ProductsModule` dùng repository TypeORM cho `PRODUCTS_REPOSITORY` (giữ token và `interface ProductsRepository` của C03); không còn `InMemoryProductsRepository`.
- API CRUD (C02) chạy trên Postgres: `POST` tạo `201` + `Location`, dòng thật xuất hiện trong `products`; `PATCH` đổi đúng cột (kể cả `{}`), `DELETE` xóa dòng; id không tồn tại `404`. Lọc/sắp xếp/phân trang cũ vẫn đúng.
- **Dữ liệu còn sau khi khởi động lại** ứng dụng (đóng `app`, tạo `app` mới trên cùng DB).
- Sau `TRUNCATE ... RESTART IDENTITY` id bắt đầu lại từ `1`.

### ex06 · Tiền và thời gian
- `price` trong response luôn là **number** (tạo, chi tiết, danh sách). Giá `9 999 999 999` và `999 999 999 999` đi và về nguyên vẹn.
- **Bẫy:** giá `10^12`, `stock` hoặc `categoryId` vượt `2 147 483 647`, và giá lẻ `1999.5` phải bị chặn `400` problem+json ở tầng API (cả `POST` lẫn `PATCH`), **không** để DB tràn số thành `500` hay làm tròn âm thầm. Gợi ý: hằng số giới hạn đặt cạnh transformer.
- `createdAt` là ISO 8601 UTC (`...Z`) khớp thời điểm thật trong DB, và **không lệch** khi tiến trình Node chạy ở múi giờ khác (`TZ=Asia/Ho_Chi_Minh`).

---

## 🔴 Thực tế

### ex07 · "Hai khách cùng đăng một SKU"
Team báo thỉnh thoảng có `500` khi nhiều người nhập sản phẩm cùng lúc, và có lúc DB còn hai dòng cùng SKU. Làm cho:
- 20 `POST` đồng thời cùng SKU: đúng **1** cái `201`, **19** cái `409` (`urn:shop:error:duplicate-sku`, problem+json), không `5xx`, DB đúng 1 dòng.
- 30 `POST` xen kẽ 3 SKU: đúng 3 cái `201`, 27 cái `409`.
- 8 `PATCH` đồng thời đổi 8 sản phẩm khác nhau sang **cùng** SKU mới: đúng 1 cái `200`, 7 cái `409`.

### ex08 · "Deploy xong thì mất một cột"
DBA thêm tay một cột vào `products` ở production, lần deploy sau cột biến mất cùng dữ liệu của nó. Giải thích và sửa:
- Ngoài production: `synchronize` bật, và khởi động lại **xóa** cột lạ (bộ chấm chứng minh điều này).
- `NODE_ENV=production`: `DataSource.options.synchronize === false`, cột lạ **còn nguyên** sau khi ứng dụng khởi động, ứng dụng vẫn phục vụ.
- Quyết định bật/tắt nằm ở `databaseConfig`, không rải điều kiện `NODE_ENV` trong `database.module.ts`.

---

## 📏 ex09 · Bao nhiêu dòng thì `GET /v1/products` bắt đầu "nặng"?
Viết `lessons/B01-typeorm-basics/answers/ex09.md`:
1. Mục **Dự đoán** (viết trước): req/s của `GET /v1/products?limit=20&sort=-price` với bản in-memory và bản Postgres ở 1 nghìn, 10 nghìn, 100 nghìn dòng.
2. Dựng dữ liệu (`INSERT ... SELECT ... FROM generate_series(...)`), rồi đo bằng `bash bench/bench.sh products-list --conns 10 --duration 8 --runs 3` (kịch bản `bench/scenarios/products-list.json`; nó thêm tham số ngẫu nhiên vào URL để `GetCacheInterceptor` không trả bản cache: **giải thích vì sao cần điều đó**).
3. Bảng `| số dòng | in-memory req/s | Postgres req/s | ... |` (ít nhất ba mức, mỗi dòng có ≥ 2 con số), rồi mục **Kết luận** (≥ 400 ký tự): nguyên nhân (chỉ ra `findAll` kéo cả bảng) và hướng sửa (`WHERE`/`ORDER BY`/`LIMIT` ở DB: B04).

Bộ chấm chỉ kiểm cấu trúc và độ dài, không kiểm con số.
