# B03 · Migration và dữ liệu bậc thang

Đọc khoảng 10 phút. Đến B02 schema do `synchronize` tự dựng. Bài này chuyển sang cách làm của dự án thật: **schema đổi bằng migration**, có thể chạy lên, lùi xuống, và áp dụng trên bảng đang có dữ liệu; cùng với bộ `seed` sinh dữ liệu theo **bậc thang quy mô** (`xs` 100 đơn, `s` 10 nghìn, `m` 1 triệu) cho các bài đo ở phần sau. Số đo lấy trên Postgres 18.6, TypeORM 1.1.2.

## Mục tiêu
- Dựng `data-source.ts` dùng chung cho Nest, CLI migration và script seed; tắt hẳn `synchronize`.
- Dùng `migration:generate / run / revert` đúng chỗ; biết `generate` chỉ là điểm xuất phát, phải đọc và sửa.
- Viết migration **an toàn trên bảng có dữ liệu**: thêm cột `NOT NULL`, đổi tên cột, tạo index không chặn ghi.
- Sinh dữ liệu giả **tất định**, nhất quán và nhanh bằng SQL hàng loạt.

## 1. Vì sao bỏ `synchronize`
`synchronize` so entity với DB rồi tự `ALTER`: tiện, nhưng (1) nó **xóa** cột/bảng không còn trong entity (B01 ex08), (2) không đổi tên được ràng buộc hay chỉ mục đã có (B01 bẫy 9), (3) không có lịch sử, nên không biết production đang ở phiên bản schema nào, và (4) không lùi được. Migration là các file TypeScript có thứ tự, mỗi file `up()` (áp dụng) và `down()` (hoàn tác); TypeORM ghi tên migration đã chạy vào bảng `migrations`.

```ts
// src/database/data-source.ts  (export mặc định cho CLI; buildDataSourceOptions dùng chung với DatabaseModule)
export default new DataSource({ type: 'postgres', url, entities: ORM_ENTITIES,
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')], synchronize: false, migrationsTransactionMode: 'each' });
```
```jsonc
// package.json
"migration:generate": "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:generate",
"migration:run":      "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:run",
"migration:revert":   "typeorm-ts-node-commonjs -d src/database/data-source.ts migration:revert",
"seed":               "ts-node scripts/seed.ts"
```
- Ngoài production ứng dụng tự chạy migration còn thiếu khi khởi động (`migrationsRun: true`) cho tiện dev/test. **Production không tự chạy**: nhiều bản ứng dụng khởi động cùng lúc sẽ đua nhau áp dụng; chạy `npm run migration:run` một lần như một bước riêng của deploy, trước khi bản mới nhận tải.
- Quy ước tên: `<timestamp 13 chữ số>-<Tên>.ts`, class kết thúc bằng timestamp. Hai người cùng tạo migration cùng lúc sẽ ra hai timestamp khác nhau; thứ tự chạy là thứ tự timestamp.

## 2. `migration:generate` là điểm xuất phát, không phải đáp án
`generate` so entity với DB đang nối rồi sinh SQL. Dùng đúng cho migration **khởi tạo** (so với DB trống, ra toàn bộ `CREATE TABLE`). Với thay đổi trên bảng đang có dữ liệu nó rất dễ sinh SQL nguy hiểm:
- đổi tên thuộc tính/cột → nó sinh `DROP COLUMN` rồi `ADD COLUMN` (**mất dữ liệu**), không phải `RENAME COLUMN`;
- thêm cột `NOT NULL` không `DEFAULT` → lỗi ngay khi bảng có dòng;
- đổi kiểu cột → `ALTER ... TYPE` có thể khóa và viết lại cả bảng.
Luôn đọc file sinh ra, và chạy `up` rồi `down` rồi `up` trên DB **có dữ liệu** trước khi commit. Không bao giờ sửa migration đã chạy ở môi trường nào đó: viết migration mới.

## 3. Ba thay đổi an toàn
**Thêm cột `NOT NULL`** (`AddProductWeight`): `ALTER TABLE products ADD weight_grams integer NOT NULL DEFAULT 0`. Thiếu `DEFAULT` thì bảng có dòng sẽ báo `23502`. Có `DEFAULT` hằng số thì Postgres ≥ 11 chỉ ghi vào catalog, **không viết lại bảng**, nên an toàn cả khi hàng triệu dòng. Ràng buộc `CHECK` thêm bằng `NOT VALID` rồi `VALIDATE CONSTRAINT`: bước đầu chỉ cần khóa ngắn, bước sau quét bảng mà vẫn cho đọc/ghi.

**Đổi tên cột** (`RenameUserFullName`): `ALTER TABLE users RENAME COLUMN full_name TO display_name` giữ nguyên dữ liệu (chỉ đổi catalog). Thuộc tính TypeScript giữ `fullName`, ánh xạ bằng `@Column({ name: 'display_name' })` nên API không đổi. Ở hệ thống thật, đổi tên thẳng làm bản ứng dụng cũ (còn chạy lúc deploy) lỗi: dùng **expand/contract** qua nhiều lần deploy (thêm cột mới, ghi cả hai, chuyển đọc, rồi bỏ cột cũ).

**Tạo index không chặn ghi** (`OrdersUserCreatedIndex`): `CREATE INDEX` thường khóa ghi suốt thời gian xây. `CREATE INDEX CONCURRENTLY` không khóa ghi nhưng **không chạy được trong transaction**, nên migration đặt `transaction = false`, và TypeORM chỉ cho phép điều đó khi `migrationsTransactionMode` là `each` hoặc `none` (mặc định `all` bị từ chối: `ForbiddenTransactionModeOverrideError`). Cái giá: nếu lỗi giữa chừng nó không tự rollback và có thể để lại index `INVALID`; viết `IF NOT EXISTS`/`IF EXISTS` để chạy lại được. Tạo index mới **trước** khi bỏ index cũ. **Bất đối xứng khi lùi:** `transaction = false` chỉ có tác dụng lúc chạy lên; `migration:revert` luôn bọc việc lùi trong transaction (kể cả khi migration tự khai `transaction = false`), nên `down()` có `CONCURRENTLY` lỗi `cannot run inside a transaction block`. Lùi migration này bằng `npm run migration:revert -- -t none` (hoặc `ds.undoLastMigration({ transaction: 'none' })`).

Một điểm cần nhớ: schema do migration quản lý nên entity phải **khớp** schema sau khi chạy hết migration; `createSchemaBuilder().log()` trả về rỗng là dấu hiệu đúng (ex02).

## 4. Seed: bậc thang quy mô
| Scale | Đơn hàng | Dùng cho |
|---|---|---|
| `xs` | 100 | dry-run bằng tay, debug (DB `shop_xs`) |
| `s` | 10 000 | O(n²) vẫn chạy được (DB `shop_s`) |
| `m` | 1 000 000 | mặc định cho giới hạn thời gian/đo tải (DB `shop_m`); cần `--yes` vì tốn nhiều đĩa |

`npm run seed -- --scale xs|s|m` (hoặc `--orders N`, `--seed S`). Tỉ lệ cố định: người dùng = N/10, sản phẩm = N/5 (tối thiểu 10 và 50), 20 danh mục (5 gốc + 15 con), mỗi đơn đúng 3 dòng hàng với 3 sản phẩm khác nhau, tổng tiền mỗi đơn đúng công thức hợp đồng, thanh toán theo trạng thái.
- **Tất định:** "ngẫu nhiên" lấy từ băm của chỉ số dòng và hạt giống (`hashtextextended(g::text || 'muối', seed)`), không phải `random()`. Cùng tham số cho đúng cùng dữ liệu; hai người dùng cùng một bậc thang thì số đo so sánh được.
- **Chạy lại được:** `TRUNCATE ... RESTART IDENTITY CASCADE` rồi nạp, trong một transaction; xong thì `setval` các sequence (đã chèn id tường minh) và `ANALYZE`.
- **Nhanh:** toàn bộ bằng `INSERT ... SELECT ... FROM generate_series(...)`, không vòng lặp ở Node. Đã đo trên sản phẩm (ex08): `save()` từng dòng 5,8 s cho 1 nghìn dòng và 57 s cho 10 nghìn dòng (≈ 5,7 ms/dòng, vì mỗi `save` là nhiều vòng khứ hồi), `insert()` theo lô 1000 dòng chỉ 0,25 s và 2,0 s, còn `INSERT ... SELECT` 28 ms và 237 ms. `insert()` một lần 10 nghìn dòng còn thất bại vì **vượt 65 535 tham số** của một câu lệnh (báo lỗi khó hiểu `bind message has 24464 parameter formats but 0 parameters`).

## Dùng ở đâu trong `shop-api`
`src/database/data-source.ts`, `src/database/migrations/`, `scripts/seed.ts`, các script npm. Mọi bài đo từ đây (B04 keyset, B05 đồng thời, Tier P) dùng `shop_xs/s/m`.

## Bẫy hay gặp
1. Giữ `synchronize: true` "cho tiện" song song với migration: hai nguồn sự thật, schema trôi.
2. Tin `migration:generate` khi đổi tên cột: mất dữ liệu.
3. Sửa migration đã chạy ở nơi khác.
4. `CREATE INDEX` thường trên bảng lớn đang có ghi (chặn ghi); hoặc `CONCURRENTLY` nhưng quên `transaction = false`.
5. `migration:revert` chưa từng được thử, đến lúc cần mới thấy `down()` rỗng hoặc hỏng.
6. Để ứng dụng production tự chạy migration khi khởi động.
7. Seed bằng vòng lặp `save()`: cả buổi sáng; hoặc một câu INSERT quá lớn vượt 65 535 tham số.
8. Dữ liệu seed ngẫu nhiên không tất định: lần đo trước và sau không so sánh được.
9. Quên `setval` sau khi chèn id tường minh: INSERT kế tiếp đụng khóa chính.
