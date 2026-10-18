# Q02 · Bài tập

Làm sau **B01** (cần Postgres). Bật DB: `docker compose -f env/docker-compose.yml up -d postgres`. Test dùng `DATABASE_URL` (mặc định `postgres://postgres:postgres@localhost:5434/shop_test`, xem `CONTRACT.md` mục 5) và ứng dụng tự tạo schema ở môi trường test. Chấm: `bash lessons/check.sh lessons/Q02-e2e-db NN|all`.

Khác các module trước, đây là bài viết **bộ test e2e của chính bạn** trong `shop-api/test/` (không dùng helper của bộ chấm, vì thư mục `test/_checks/` bị xóa sau khi chấm). Bộ chấm chạy các tệp bạn viết bằng Jest, nhiều lần, theo nhiều cách, và dùng cả DB tạm riêng cho từng tiến trình. Tệp phải dựng ứng dụng bằng bề mặt ổn định: `AppModule` và `configureApp` (`src/app.setup.ts`).

**Pass:** 5/6 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · `cleanDatabase(app)`
`test/support/clean-db.ts` export `cleanDatabase(app: INestApplication): Promise<void>`.
- Xóa dữ liệu **mọi bảng** của schema `public` bằng **một** câu lệnh `TRUNCATE ... RESTART IDENTITY CASCADE`; danh sách bảng lấy **động** (bảng thêm sau, bảng có chữ hoa, bảng con có khóa ngoại đều được dọn).
- Id về lại 1 sau khi dọn (cả bảng `products` và serial của bảng khác).
- **Không** đụng bảng `migrations`/`typeorm_metadata`. Gọi lại nhiều lần và gọi song song không lỗi.

### ex02 · Factory dữ liệu thử
`test/factories.ts` export:
- `makeProduct(overrides?)`: trả thân hợp lệ cho `POST /v1/products`: `sku` khớp `^[A-Z0-9-]{3,20}$` và **không bao giờ trùng** (5000 lần gọi → 5000 SKU), `name`, `price` nguyên `>= 0`; `overrides` ghi đè từng trường; mỗi lần trả object mới.
- `createProduct(app, overrides?)`: gọi API tạo sản phẩm (có `X-Api-Key` admin: `process.env.ADMIN_API_KEY ?? 'dev-admin-key'`), trả body đã tạo (có `id`). 30 lần gọi song song không đụng SKU. Khi API không trả `201`, **ném lỗi** có chứa status và thân lỗi để chẩn đoán.

---

## 🟡 Kết hợp

### ex03 · Bộ e2e cho Products
`test/products.e2e-spec.ts` (dựng ứng dụng bằng `Test.createTestingModule({ imports: [AppModule] })` + `configureApp`):
- Ít nhất **14 test**, xanh. Phủ `POST`, `GET` (danh sách và chi tiết), `PATCH`, `DELETE` với các mã `200, 201, 204, 400, 401, 404, 409`.
- Mỗi test bắt đầu từ DB sạch (`cleanDatabase` trong `beforeEach`); dữ liệu dựng bằng factory; **có test kiểm trạng thái trong DB** (qua `DataSource`, `.query(...)`... ) chứ không chỉ nhìn phản hồi, gồm cả ca lỗi "DB không đổi".
- Không id cứng trong URL (`/v1/products/1`), không `setTimeout`/`sleep`, mỗi test có assertion.

### ex04 · Ổn định
Với **cùng** `test/products.e2e-spec.ts` bộ chấm kiểm:
- Chạy 3 lần liên tiếp trên một DB mà **không dọn tay** giữa các lần.
- Thứ tự ngẫu nhiên (`--randomize`, 3 seed).
- Hai tiến trình chạy **đồng thời**, mỗi tiến trình một database riêng qua `DATABASE_URL`.
- Một database hoàn toàn mới (chưa có bảng): ứng dụng tự tạo schema ở môi trường test.

---

## 🔴 Thực tế

### ex05 · "E2E đỏ ở CI, xanh ở máy dev"
Sao chép `starter/test/flaky-db.e2e-spec.ts` vào `shop-api/test/`. Bộ test xanh lần chạy đầu trên DB mới của tác giả và đỏ gần như mọi lần sau đó ở CI. Sửa **chính tệp đó** (giữ ≥ 5 test):
- Bỏ id cứng (`/v1/products/1`, `expect(id).toBe(1)`), bỏ `let created` truyền dữ liệu giữa các test, bỏ `setTimeout` chờ vô nghĩa, dựng trạng thái trong từng test, `cleanDatabase` trong `beforeEach`.
- Bộ chấm chạy: seed ngẫu nhiên, từng test riêng lẻ (`-t`), chạy hai lần trên cùng DB, và hai bản song song trên hai DB.

---

## 📏 Đo

### ex06 · Ba chiến lược giữ DB sạch
Đo trên bộ `products.e2e-spec.ts` của bạn: (a) `TRUNCATE` mỗi test, (b) `DELETE` từng bảng (hoặc rollback nếu bạn làm được), (c) tạo database mới cho mỗi test. Viết `lessons/Q02-e2e-db/answers/ex06.md`: **Dự đoán** trước, bảng `| chiến lược | số test | tổng ms | ms/test |` với ba dòng, rồi mục **Chọn** (≥ 500 ký tự) giải thích đánh đổi tốc độ / cô lập / độ chân thực và vì sao rollback không áp dụng được khi test đi qua HTTP.

---

> Câu hỏi mở (không chấm): ứng dụng có `GetCacheInterceptor` (C08) giữ cache trong bộ nhớ. Sau `cleanDatabase`, một test chèn dòng bằng SQL trực tiếp rồi gọi `GET /v1/products/:id`. Bạn đoán kết quả gì và vì sao? Cách nào làm test không phụ thuộc cache (gợi ý: khởi tạo ứng dụng lại cho mỗi file, hoặc đi qua API để cache được xóa)? Hãy thử.
