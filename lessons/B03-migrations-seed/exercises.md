# B03 · Bài tập

Tiếp tục `shop-api` sau B02. Bật DB: `docker compose -f env/docker-compose.yml up -d postgres`. Chấm: `bash lessons/check.sh lessons/B03-migrations-seed NN|all`. Bộ chấm **xóa sạch schema `public` của DB test** trước khi chạy và chạy các lệnh `npm run ...` của bạn như thật, nên mỗi bài chạy lâu hơn các bài trước (mỗi lệnh khởi động ts-node vài giây).

Cài thêm: `ts-node` (đã có từ `nest new`). Thêm vào `package.json` các script `migration:generate`, `migration:run`, `migration:revert`, `migration:show`, `seed` như README. Thay `synchronize` bằng migration trong `databaseConfig`/`DatabaseModule`. **Mỗi thay đổi một migration, đúng thứ tự đề bài** (bộ chấm lùi từng bước nên cần thứ tự này): ① khởi tạo, ② thêm cột, ③ index, ④ đổi tên cột.

**Pass:** 7/8 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Hạ tầng migration
- `src/database/data-source.ts` export **mặc định** một `DataSource` (postgres, `synchronize: false`, `migrations` trỏ vào `src/database/migrations/`). Dùng chung cấu hình giữa `DatabaseModule` và CLI (một hàm dựng tùy chọn, không chép hai nơi).
- Script npm `migration:generate`, `migration:run`, `migration:revert`, `seed` (CLI dùng `-d src/database/data-source.ts`).
- Migration ① **khởi tạo** sinh bằng `migration:generate` trên DB **trống** (đủ 9 bảng: sáu bảng B01, `tags`, `product_tags`, `user_profiles`, cùng khóa ngoại/index/ràng buộc của B02). Giữ file đó nguyên văn (đổi timestamp cho dễ đọc cũng được).
- `npm run migration:run` trên DB trống tạo schema; chạy lại báo "No migrations are pending". Ngoài production ứng dụng tự áp dụng migration còn thiếu khi khởi động (`migrationsRun`); ở production thì **không**. Quyết định này nằm ở `databaseConfig`.

### ex02 · Lùi được, và schema khớp entity
- Mỗi migration có `down()` đúng: lùi từng bước từ trên xuống tới hết, DB không còn bảng nào (trừ `migrations`); lên → xuống → lên cho cùng kết quả.
- Sau khi chạy hết migration, `dataSource.driver.createSchemaBuilder().log()` **không còn câu lệnh nào** (migration `generate` mới sẽ rỗng).
- `npm run migration:revert` lùi đúng một migration; tên migration theo quy ước TypeORM (timestamp 13 chữ số, tăng dần, không trùng).

---

## 🟡 Kết hợp

### ex03 · Thêm cột NOT NULL vào bảng đang có dữ liệu
Migration ②: thêm `products.weight_grams integer NOT NULL DEFAULT 0` (entity: thuộc tính `weightGrams`) và `CHECK` có tên `ck_products_weight` (`weight_grams >= 0`) đã được **validate**. Bộ chấm lùi về migration ①, chèn 2000 sản phẩm theo schema cũ, rồi chạy tiếp: không lỗi, mọi dòng có `weight_grams = 0`, dữ liệu cũ nguyên vẹn; lùi migration này không đụng dữ liệu khác.

### ex04 · Index không chặn ghi
Migration ③: thay `idx_orders_user (user_id)` bằng `idx_orders_user_created (user_id, created_at)` bằng `CREATE INDEX CONCURRENTLY` (tạo mới trước, bỏ cũ sau); migration đặt `transaction = false` và cấu hình cho phép điều đó. Entity khai báo index mới (thay index cũ). Lưu ý: TypeORM bọc việc **lùi** trong transaction dù migration khai `transaction = false`, nên `down()` này chỉ lùi được với `-t none`; bộ chấm lùi bằng `transaction: 'none'`. Bộ chấm: index mới tồn tại, **hợp lệ**, truy vấn "đơn của một người dùng, mới nhất trước" dùng nó, khóa ngoại `orders.user_id` vẫn có index, `down()` khôi phục index cũ.

### ex05 · Đổi tên cột mà không mất dữ liệu
Migration ④: `users.full_name` → `display_name` bằng `RENAME COLUMN`. Thuộc tính `fullName` của entity giữ nguyên, ánh xạ vào cột mới. Bộ chấm chèn 500 người dùng theo schema cũ, chạy lên rồi lùi, và so băm giá trị ở cả hai chiều; id của dòng không đổi.

### ex06 · Seed bậc thang
`scripts/seed.ts` chạy bằng `npm run seed -- --scale xs|s|m` (DB `shop_<scale>` cùng máy chủ với `DATABASE_URL`, tạo nếu chưa có) hoặc `--orders N` (DB trong `DATABASE_URL`), `--seed S` (mặc định 42). `m` bắt buộc kèm `--yes`.
- Tỉ lệ: N đơn, `max(10, N/10)` người dùng, `max(50, N/5)` sản phẩm, 20 danh mục (5 gốc, 15 con, mỗi con thuộc một gốc), mỗi đơn **đúng 3 dòng hàng với 3 sản phẩm khác nhau**.
- `totalAmount = Σ(unitPrice × quantity) + shippingFee − discountAmount` cho **mọi** đơn. Phí ship 30 000, miễn khi tiền hàng ≥ 500 000 hoặc mã `FREESHIP`; `WELCOME10` chỉ khi tiền hàng ≥ 200 000, giảm `min(100 000, 10%)`; có cả hai loại mã trong dữ liệu.
- Thanh toán: đơn `paid/shipped/delivered/refunded` có đúng 1 khoản `succeeded` bằng tổng; `refunded` thêm 1 khoản `refunded`; `pending` không có.
- **Tất định và chạy lại được:** cùng tham số cho cùng dữ liệu (in `checksum=<md5>` trong output), `--seed` khác cho dữ liệu khác, không nhân đôi dòng, sequence theo kịp (INSERT kế tiếp không đụng khóa).
- Tham số sai (scale lạ, thiếu tham số, `--orders` không hợp lệ, `m` không có `--yes`) thoát với mã khác 0 và thông báo bắt đầu bằng `seed:`.

---

## 🔴 Thực tế

### ex07 · "Seed chạy cả buổi sáng"
Đồng nghiệp chạy `seed --orders 20000` và đi pha cà phê ba lần chưa xong. 20 000 đơn (60 000 dòng hàng, 4 000 sản phẩm, 2 000 người dùng) phải xong **dưới 40 giây** kể cả thời gian khởi động ts-node, và script in `time=<giây>s`. Ứng dụng khởi động được trên dữ liệu vừa seed và phục vụ API trên đó (cây danh mục 5 × 3, 4 000 sản phẩm).

---

## 📏 ex08 · Ba cách nạp dữ liệu
Viết `lessons/B03-migrations-seed/answers/ex08.md`:
1. Mục **Dự đoán** (viết trước): thời gian nạp N sản phẩm bằng (a) `repository.save()` từng dòng, (b) `repository.insert()` theo lô 1000, (c) `INSERT ... SELECT ... FROM generate_series(...)`, ở N = 1 nghìn, 10 nghìn, 100 nghìn.
2. Đo. Bảng `| số dòng | save() từng dòng (ms) | insert() lô 1000 (ms) | INSERT…SELECT (ms) |` (ít nhất ba mức; có thể ước lượng mức lớn nhất cho `save()` nếu bạn không chờ nổi, nhưng hãy nói rõ). Thử `insert()` **một lần** 10 nghìn dòng và ghi lại lỗi.
3. **Kết luận** (≥ 400 ký tự): vì sao ba cách chênh nhau (vòng khứ hồi, ánh xạ entity, giới hạn 65 535 tham số của một câu lệnh), và khi nào dùng cách nào (seed/nhập liệu lớn so với ghi thường ngày).

Bộ chấm chỉ kiểm cấu trúc và độ dài, không kiểm con số.
