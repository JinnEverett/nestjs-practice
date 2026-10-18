# Báo cáo nhóm b (Tier B · Database)

Môi trường soạn và kiểm chứng: Windows 11, Node 24.15, NestJS 12, TypeORM 1.1.2, `pg` 8, Postgres **18.6** (container `nest-practice-pg`, cổng 5434), Docker Desktop (WSL2).
Lệnh kiểm: `bash lessons/check.sh lessons/<ID> all --solutions`.

## Trạng thái
| Module | Trạng thái | Kiểm chứng |
|---|---|---|
| B01 TypeORM cơ bản | 🧪 | 9 bài, **53/53 test xanh**; 10/10 phép thử đột biến trên đáp án đều bị check bắt; bài 📏 ex09 có số đo thật |
| Q02 (chạy lại với B01 thật) | 🧪 | **42/42 test xanh** (trước đây chỉ chạy với "B01 giả") |
| B02 Quan hệ và N+1 | 🧪 | 8 bài, **59/59 test xanh**; 11/11 phép thử đột biến bị check bắt; bài 📏 ex08 có số đo thật |
| B03–B09 | ⬜ | chưa soạn |

## B01: quyết định thiết kế
- **Ranh giới ORM/API:** entity TypeORM nằm ở `src/database/entities/*.orm-entity.ts` (`ProductEntity`…), tách khỏi lớp API `Product`/`Order` (có `@ApiProperty`). Repository ánh xạ giữa hai lớp. B06 sẽ bàn lại ranh giới này. Nhờ đó `ProductsRepository` (C03) **giữ nguyên interface** và `InMemoryProductsRepository` vẫn còn để so sánh/đo.
- **Chưa có khóa ngoại/quan hệ:** B01 chỉ có cột và ràng buộc trên từng bảng (PK, UNIQUE, CHECK, kiểu cột). FK và quan hệ thuộc B02. Lý do thực dụng: `ProductsService` mặc định `categoryId = 1`, mà mọi test (kể cả Q02 `TRUNCATE ... CASCADE`) chạy trên DB không có danh mục.
- **Ràng buộc ở hai tầng:** DTO chặn sớm (400), DB là chốt cuối. Thêm `@Max(MONEY_MAX)` / `@Max(INT4_MAX)` vào `CreateProductDto` để giá/tồn kho vượt cột trả `400` thay vì `500` (`openapi.json` xuất lại).
- **Race condition SKU:** `ProductsService.create` kiểm tra rồi chèn (C02). B01 giữ nguyên service và bắt lỗi `23505` ở repository đổi thành `DuplicateSkuError` (409): ràng buộc `UNIQUE` là người phân xử duy nhất. Đo: 20 POST đồng thời → 1 × 201, 19 × 409.
- **Thất bại nhanh:** `@nestjs/typeorm` mặc định thử lại 10 × 3 s (treo ≈ 30 s khi sai URL). Ngoài production đặt 3 × 0,5 s qua `databaseConfig`.
- **`synchronize`:** bật ngoài production, tắt ở production (có bài chứng minh `synchronize` xóa cột lạ). Từ B03 schema đi theo migration.

## Phát hiện khi kiểm chứng (đều đã xử lý)
1. **Q02 vỡ với B01 thật:** đáp án mẫu Q02 so `price` đọc bằng SQL với số, mà `numeric(12,0)` về dạng chuỗi (`'2000'`). Sửa đáp án (`price::int`) và thêm lưu ý vào đề Q02 ex03.
2. **Postgres 18:** mỗi cột `NOT NULL` có một dòng trong `pg_constraint` (loại `n`, tên tự sinh); helper liệt kê ràng buộc phải lọc `contype <> 'n'`. Đã ghi vào `CONTRACT.md`.
3. **`synchronize` không đổi tên ràng buộc:** gặp DB có `UQ_...` tên tự sinh trong khi entity khai báo `uq_products_sku`, khởi động lại không sửa. Check schema dùng `rebuildSchema` (`dropDatabase` + `synchronize`) để chấm trên schema mới tinh. Nguồn gốc của ràng buộc `UQ_...` đó tôi chưa xác định được (xuất hiện sau chuỗi phép thử đột biến); hành vi "không đổi tên" thì đã quan sát trực tiếp.
4. **Bài đo bị cache che:** `GET /v1/products` có `@CacheTtl(30)` (C08) nên lần đo đầu cho ≈ 1 700 req/s bất kể số dòng. Kịch bản `bench/scenarios/products-list.json` thêm tham số `maxPrice` ngẫu nhiên (ngoài khoảng giá, không đổi kết quả) để mọi request đều MISS.

## Số đo (ex09, `bench.sh products-list --conns 10 --duration 8 --runs 3`)
| số dòng | in-memory req/s | Postgres req/s | in-memory p50 ms | Postgres p50 ms |
|---|---|---|---|---|
| 1 000 | 790 | 52 | 11 | 185 |
| 10 000 | 130 | 5 | 76 | 1 557 |
| 100 000 | 9 | 0 (timeout) | 1 087 | > 10 000 (timeout) |

Máy dev Windows, client và server cùng máy: xu hướng, không phải số tuyệt đối. Nguyên nhân: `findAll()` kéo cả bảng rồi lọc/sắp xếp/phân trang bằng JavaScript; B04 sửa.

## Hạ tầng thêm
- `lessons/_shop-api/testkit/_db.ts` (`DB_URL, dataSourceOf, userTables, resetDatabase, rebuildSchema, pgErrorCode, withEnv`) và `_src.ts` (`stripComments`); đăng ký ở `CONTRACT.md` mục 7, thêm mục **6c** (bề mặt B01).
- `bench/scenarios/products-list.json`.
- Phép thử đột biến (mutation) trên đáp án: phá từng yêu cầu (bỏ retry, bỏ transformer, bỏ UNIQUE/CHECK, không map 23505, `synchronize` luôn bật, `timestamp` không múi giờ, bỏ CHECK email/quantity, bỏ `@Max`) và xác nhận check tương ứng đỏ. Script nằm ngoài repo (một lần dùng).

## Hạn chế
- Chưa chạy B01 qua `answers` (code của người học trong `shop-api/`): thư mục `shop-api/` chưa tồn tại ở workspace này; mọi kiểm chứng chạy qua `--solutions`.
- Số đo ex09 là một máy, trung vị 3 lần, nhiễu cỡ ±10%.

---

# B02: Quan hệ và N+1

## Quyết định thiết kế
- **Phạm vi:** quan hệ phía danh mục/sản phẩm/nhãn có API thật (`/v1/categories`, `PUT /v1/products/:id/tags`, `/v1/tags`, `?include=` trên chi tiết sản phẩm). Phía đơn hàng (`orders`, `order_items`, `payments`, `users`, `user_profiles`) chỉ có **schema và khóa ngoại** (kiểm bằng SQL và metadata ORM) vì đơn hàng vẫn ở RAM đến B05. `include=items` của CONTRACT cũ chuyển sang B05.
- **Khóa ngoại thật cho `products.category_id`:** giữ mặc định `categoryId ?? 1` của C02 (không phải sửa spec Q01) nên DB trống phải có danh mục 1, nếu không POST → `422 invalid-category`. Hệ quả cho người học: test Q02 cũ cần tạo danh mục 1 trước. Ghi trong `CONTRACT.md` 6d và đề B02.
- **`categoryNotFound` tách đôi:** tra cứu theo id không thấy → `404 category-not-found`; tham chiếu từ dữ liệu khác → `422 invalid-category`.
- **Đủ bốn kiểu quan hệ:** n-1/1-n (`products → categories`), tự tham chiếu (`categories.parent`), 1-1 (`user_profiles`, khóa chính chính là khóa ngoại), n-n (`products ↔ tags`).
- **Xóa:** `RESTRICT` cho lịch sử/chứng từ, `CASCADE` cho dòng phụ thuộc (`order_items`, `product_tags`, `user_profiles`).
- **`PUT /v1/products/:id/tags`** khóa dòng sản phẩm (`FOR UPDATE`) trước khi thay tập nhãn và tạo nhãn bằng `INSERT ... ON CONFLICT DO NOTHING`.

## Phát hiện khi kiểm chứng
1. **`ON DELETE RESTRICT` ném SQLSTATE `23001`, không phải `23503`.** Bản đầu chỉ bắt `23503` nên xóa danh mục còn sản phẩm trả 500. Đã sửa đáp án, check (ex01, ex02, ex04) và ghi vào README/CONTRACT.
2. **Thêm khóa ngoại lên bảng có dữ liệu "mồ côi" làm app không khởi động** (`synchronize` thất bại). Check dùng `freshDatabase()` (xóa sạch schema bằng kết nối riêng trước khi dựng app); README ghi thành bẫy số 1, vì người học nâng từ B01 trên DB dev cũ sẽ gặp đúng lỗi này.
3. **Check ban đầu quá lỏng ở hai chỗ** (đột biến sống sót): (a) chưa có test xóa sản phẩm đã vào `order_items` qua API; (b) race khi thay tập nhãn cùng sản phẩm chưa đủ chồng lấn. Đã siết (thêm test API; 40 PUT đồng thời với hai tập 20 nhãn chồng lấn) và chạy lại: cả hai đột biến bị bắt.
4. `Relation<T>` + `import type` là bắt buộc khi hai entity import vòng tròn dưới `isolatedModules` + `emitDecoratorMetadata` (lỗi TS1272).

## Số đo (ex08, trong tiến trình, DB cùng máy, trung vị 20 lần)
| số danh mục | truy vấn ngây thơ | truy vấn relations | ms ngây thơ | ms relations |
|---|---|---|---|---|
| 10 | 11 | 1 | 3,2 | 1,4 |
| 100 | 101 | 1 | 19,9 | 2,9 |
| 1000 | 1001 | 1 | 203,0 | 23,8 |

`relationLoadStrategy: 'query'` ở 1000 danh mục mất 2036 ms (3 truy vấn), chưa tìm ra nguyên nhân. Tích Descartes: 20 gốc × (30 con, 30 sản phẩm): JOIN trả 18 000 dòng (79,7 ms), tách riêng 1 220 dòng nhưng 5 truy vấn (136,5 ms).

## Hạn chế
- Chưa chạy qua `answers` (workspace chưa có `shop-api/`).
- Q02 ở trạng thái B02 không còn xanh nếu không tạo danh mục 1 (bình thường theo quy ước "module sau có thể phá check module trước"); Q02 vẫn xanh ở trạng thái ngay sau nó.
- **Đính chính:** bản đầu của B02 (README/đề/CONTRACT/báo cáo) nói sai rằng `product_tags.tag_id` thiếu index và TypeORM không tự thêm. Migration sinh tự động ở B03 cho thấy TypeORM tạo `IDX_…` cho cả `product_id` và `tag_id`; đã sửa mọi chỗ và bỏ ngoại lệ khỏi check ex04.

---

# B03: Migration và dữ liệu bậc thang

## Quyết định thiết kế
- **Một `DataSource` cho ba nơi:** `buildDataSourceOptions` dùng chung cho `DatabaseModule`, CLI migration (`data-source.ts` export mặc định) và `scripts/seed.ts`; `ORM_ENTITIES` tách ra `orm-entities.ts`. `synchronize` tắt hẳn.
- **Ngoài production ứng dụng tự chạy migration (`migrationsRun`), production thì không** (deploy chạy `npm run migration:run` một lần).
- **Bốn migration, một thay đổi mỗi cái:** ① khởi tạo (sinh thật bằng `migration:generate` trên DB trống), ② thêm `products.weight_grams NOT NULL DEFAULT 0` + CHECK `NOT VALID` rồi `VALIDATE`, ③ thay `idx_orders_user` bằng index ghép bằng `CREATE INDEX CONCURRENTLY` (`transaction = false`), ④ `RENAME COLUMN users.full_name → display_name`.
- **Seed:** toàn bộ `INSERT ... SELECT ... generate_series` trong một transaction, "ngẫu nhiên" từ `hashtextextended(chỉ số || muối, seed)` nên tất định; in `checksum=` và `time=`; `m` cần `--yes`. Tổng tiền mỗi đơn tuân đúng công thức CONTRACT, kèm quy tắc ship/`WELCOME10`/`FREESHIP`.
- **Hạ tầng:** `assemble.mjs` gộp `solutions/NPM_SCRIPTS` vào `package.json > scripts` (tên khác `SCRIPTS` vì trùng thư mục `scripts/` trên Windows). Testkit: `rebuildSchema` dùng migration khi có.

## Phát hiện khi kiểm chứng (đều đã xử lý và ghi vào README/CONTRACT)
1. **`transaction = false` bị từ chối khi chế độ toàn cục là `all` (mặc định)**: `ForbiddenTransactionModeOverrideError`. Cần `migrationsTransactionMode: 'each'`.
2. **Bất đối xứng khi lùi:** `undoLastMigration` luôn bọc trong transaction (bỏ qua `transaction = false`), nên `down()` có `CONCURRENTLY` lỗi `cannot run inside a transaction block`; chỉ lùi được với `-t none` (`ds.undoLastMigration({ transaction: 'none' })`).
3. **Entity `default: () => "'{}'::jsonb"` làm `generate` sinh `SET DEFAULT` thừa mãi mãi** (phát hiện nhờ `createSchemaBuilder().log()`); đổi thành `"'{}'"`. Bắt đầu từ B01 entity đã sai điểm này (B01/B02 dùng `synchronize` nên không lộ).
4. **TypeORM tự tạo index cho cả hai cột của bảng nối `product_tags`** (làm lộ lỗi trong B02, đã đính chính).
5. **Không đặt tên file `SCRIPTS`** cạnh thư mục `scripts/` (Windows không phân biệt hoa/thường).
6. `ADD COLUMN NOT NULL` không `DEFAULT` lỗi `23502` khi bảng có dòng; có `DEFAULT` hằng số thì Postgres ≥ 11 không viết lại bảng.

## Số đo (ex08, một lần chạy mỗi ô, DB cùng máy)
| số dòng | save() từng dòng (ms) | insert() lô 1000 (ms) | INSERT…SELECT (ms) |
|---|---|---|---|
| 1 000 | 5 755 | 251 | 28 |
| 10 000 | 57 066 | 2 040 | 237 |
| 100 000 | 509 734 | 15 900 | 2 005 |

`insert()` một lần 10 000 dòng: `bind message has 24464 parameter formats but 0 parameters` (vượt 65 535 tham số). Lần chạy 100 000 dòng đầu tiên bị hỏng vì hai tiến trình đo chạy chồng lên cùng một DB; số trên là lần chạy sạch.

## Hạn chế
- `--scale m` (1 triệu đơn) **chưa được sinh/kiểm chứng thật** (ổ C ít chỗ trống theo tracker, và ước tính vài trăm MB đến hơn 1 GB); chỉ kiểm cơ chế `--yes` và tỉ lệ dữ liệu ở `xs` và 20 000 đơn. Thời gian cho `m` chưa đo.
- Chưa chạy qua `answers` (workspace chưa có `shop-api/`).
- `shop_xs` bị ghi đè dữ liệu mỗi khi chạy ex06 (đó là mục đích của DB này).

## Trạng thái kiểm chứng B03 (trung thực)
- Từng bài chạy riêng đều xanh: ex01 6, ex02 5, ex03 4, ex04 6, ex05 4, ex06 8, ex07 3, ex08 4 test.
- **Chưa chạy `all` một lượt** sau hai chỉnh sửa cuối: (a) entity `attributes` đổi `default` thành `"'{}'"` (ex02, ex03, ex04, ex05 chạy trước thay đổi này, chỉ ex02 chạy lại sau đó; ex06–ex08 chạy sau); (b) ex04 siết chỉ xét thân `up()` (biểu thức đã kiểm riêng bằng script nhưng test chưa chạy lại).
- Phép thử đột biến: 10 đột biến đầu bị bắt (bỏ `migrationsTransactionMode: 'each'`, production tự chạy migration, bật `synchronize`, thêm cột NOT NULL không DEFAULT, `down()` rỗng, CHECK không VALIDATE, giữ index cũ, đổi tên cột bằng DROP+ADD, entity bỏ ánh xạ `display_name`); 1 đột biến (index không `CONCURRENTLY` trong `up()`) sống sót nên đã siết ex04; **5 đột biến của `seed.ts` chưa chạy** vì tác vụ bị hệ thống dừng khi máy thiếu RAM. Việc còn lại: chạy lại `all`, rồi 5 đột biến seed (không tất định, bỏ giảm giá khỏi tổng, quên `setval`, không `TRUNCATE`, `m` không cần `--yes`) và đột biến ex04 mới.
