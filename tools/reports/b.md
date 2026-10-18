# Báo cáo nhóm b (Tier B · Database)

Môi trường soạn và kiểm chứng: Windows 11, Node 24.15, NestJS 12, TypeORM 1.1.2, `pg` 8, Postgres **18.6** (container `nest-practice-pg`, cổng 5434), Docker Desktop (WSL2).
Lệnh kiểm: `bash lessons/check.sh lessons/<ID> all --solutions`.

## Trạng thái
| Module | Trạng thái | Kiểm chứng |
|---|---|---|
| B01 TypeORM cơ bản | 🧪 | 9 bài, **53/53 test xanh**; 10/10 phép thử đột biến trên đáp án đều bị check bắt; bài 📏 ex09 có số đo thật |
| Q02 (chạy lại với B01 thật) | 🧪 | **42/42 test xanh** (trước đây chỉ chạy với "B01 giả") |
| B02–B09 | ⬜ | chưa soạn |

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
