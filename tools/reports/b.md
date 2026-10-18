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
- Bảng nối `product_tags` thiếu index cho `tag_id`; để B03 (migration).
