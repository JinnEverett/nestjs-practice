# B01 · TypeORM cơ bản: từ RAM sang Postgres

Đọc khoảng 10 phút. Từ đây `shop-api` có **dữ liệu thật**: sản phẩm không còn mất khi tắt ứng dụng. Mọi số đo trong bài lấy trên Postgres 18.6 (container `nest-practice-pg`, cổng 5434), Node 24, NestJS 12, TypeORM 1.1.

## Mục tiêu
- Nối Postgres bằng `TypeOrmModule.forRootAsync` qua `@nestjs/config`, thất bại nhanh khi cấu hình sai.
- Chọn **kiểu cột đúng**: tiền (`numeric`), thời gian (`timestamptz`), thuộc tính tự do (`jsonb`), độ dài chuỗi.
- Đặt ràng buộc ở **DB** (UNIQUE, CHECK), không chỉ ở DTO, và hiểu vì sao cả hai tầng đều cần.
- Thay `InMemoryProductsRepository` bằng bản TypeORM mà **không đổi interface** (C03), xử lý race condition SKU bằng ràng buộc UNIQUE.
- Biết vì sao `synchronize` chỉ dành cho phát triển, và đọc được SQL mà ORM sinh ra.

## 1. Bật Postgres và nối vào Nest
```bash
docker compose -f env/docker-compose.yml up -d postgres      # cổng 5434; DB shop_dev (chạy tay), shop_test (check)
npm i @nestjs/typeorm typeorm pg
```
```ts
// src/database/database.module.ts
TypeOrmModule.forRootAsync({
  inject: [databaseConfig.KEY],                       // cấu hình đi qua @nestjs/config (C09), không đọc process.env rải rác
  useFactory: (db: ConfigType<typeof databaseConfig>) => ({
    type: 'postgres', url: db.url, entities: [...],
    synchronize: db.synchronize, logging: db.logging,
    retryAttempts: db.retryAttempts, retryDelay: db.retryDelay,
  }),
}),
```
- `DataSource` được đăng ký **toàn cục**: `constructor(private ds: DataSource)` ở đâu cũng được; `@InjectRepository(Entity)` cho từng bảng (cần `TypeOrmModule.forFeature([Entity])` ở module dùng nó).
- **Bẫy treo 30 giây:** mặc định `@nestjs/typeorm` thử lại 10 lần cách 3 giây. Sai địa chỉ DB thì ứng dụng "đứng im" nửa phút trước khi báo lỗi. Ngoài production đặt 3 lần × 0,5 giây (lỗi cấu hình hiện ra ngay); production chờ lâu hơn vì DB có thể đang khởi động cùng lúc.
- `synchronize: true` tự ALTER schema cho khớp entity: **có thể xóa cột/bảng**. Chỉ ngoài production (ex08); từ B03 schema đi theo migration.

## 2. Entity và kiểu cột
| Dữ liệu | Kiểu Postgres | Đừng dùng | Vì sao |
|---|---|---|---|
| tiền VND (số nguyên) | `numeric(12,0)` + transformer | `float`/`real`/`double` | số thực nhị phân không biểu diễn đúng 0,1; tiền không được "gần đúng" |
| thời điểm | `timestamptz` | `timestamp` (không múi giờ) | `timestamptz` lưu thời điểm tuyệt đối; `timestamp` hiểu theo múi giờ của máy đọc, lệch giờ khi đổi môi trường |
| thuộc tính tự do | `jsonb` | `json`, chuỗi | `jsonb` có thể đánh index và truy vấn |
| mã/tên | `varchar(n)` | `text` không giới hạn | độ dài là một ràng buộc; DB từ chối 121 ký tự cho cột `varchar(120)` |
| id | `integer` sinh tự động | uuid (chưa cần) | id số nguyên theo CONTRACT |

```ts
@Entity({ name: 'products' })                         // tên bảng và cột đặt TƯỜNG MINH, snake_case
@Unique('uq_products_sku', ['sku'])
@Check('ck_products_price', '"price" >= 0')
export class ProductEntity {
  @PrimaryGeneratedColumn({ type: 'integer' }) id!: number;
  @Column({ type: 'numeric', precision: 12, scale: 0, transformer: moneyTransformer }) price!: number;
  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' }) createdAt!: Date;
}
```
**`numeric` về dạng chuỗi.** Driver `pg` trả `numeric` và `bigint` là **chuỗi** (để không mất chính xác). Không có transformer thì `price` trong response thành `"199000"` thay vì `199000`. Transformer ở đây cũng **ném lỗi** nếu giá trị vượt số nguyên an toàn của JS (không làm tròn âm thầm).

**`numeric(12,0)` làm tròn im lặng:** `1999.5` được lưu thành `2000` không báo lỗi. DTO (`@IsInt()`) phải chặn số lẻ trước khi xuống DB. Tương tự giá `10^12` làm DB báo `numeric field overflow` (mã `22003`): API phải trả `400` (thêm `@Max`), không để thành `500`.

## 3. Ràng buộc ở DB: tầng phòng thủ cuối
DTO chặn sớm và cho thông báo đẹp; **DB là chốt cuối** vì còn đường ghi khác không đi qua DTO (script, job nhập liệu, người chạy SQL tay, và race condition).
| Ràng buộc | Mã lỗi Postgres | Ví dụ |
|---|---|---|
| `UNIQUE` | `23505` | `uq_products_sku`, `uq_users_email` |
| `CHECK` | `23514` | `ck_products_price`, email phải chữ thường |
| `NOT NULL` | `23502` | cột bắt buộc |
| tràn kiểu | `22003`, `22001` | số quá lớn, chuỗi quá dài |
Đặt **tên ràng buộc tường minh** (`uq_`, `ck_`): thông báo lỗi và migration sau này đọc được. Ghi chú Postgres 18: mỗi cột `NOT NULL` cũng có một dòng trong `pg_constraint` (tên tự sinh), nhớ lọc khi liệt kê ràng buộc.

## 4. Repository thật, và race condition
`ProductsRepository` (C03) giữ nguyên interface; chỉ đổi lớp cài đặt trong `ProductsModule` (`useClass: TypeOrmProductsRepository`). Hàm `toProduct` chuyển dòng DB sang hình dạng API (thời gian `Date` → ISO UTC).

**Kiểm tra rồi chèn không đủ.** `ProductsService.create` gọi `findBySku` rồi `insert`: hai request cùng lúc cùng thấy "chưa có" rồi cả hai chèn. Chỉ ràng buộc `UNIQUE` phân xử được. Repository bắt `QueryFailedError` có `driverError.code === '23505'` và đổi thành `DuplicateSkuError` (409). Đo: 20 POST đồng thời cùng SKU → đúng 1 cái `201`, 19 cái `409`, DB một dòng (ex07).

## 5. Xem SQL mà ORM sinh
`DB_LOGGING=true` (hoặc `logging: ['query']`) ghi mọi câu lệnh. Đọc nó là kỹ năng: `findAll()` hiện ra là `SELECT ... FROM products ORDER BY id` **không có `LIMIT`**, nghĩa là mỗi `GET /v1/products` kéo cả bảng. Đo ở ex09: 1 nghìn dòng đã chậm 15× so với in-memory, 100 nghìn dòng thì timeout. B04 sửa bằng QueryBuilder; B02 thêm quan hệ và phát hiện N+1.

## Dùng ở đâu trong `shop-api`
`DatabaseModule` (import vào `AppModule`), `src/database/entities/*.orm-entity.ts` (sáu bảng), `TypeOrmProductsRepository` thay bản in-memory. Đơn hàng vẫn tạm trong RAM đến B05 (transaction); khóa ngoại và quan hệ thêm ở B02.

## Bẫy hay gặp
1. `float` cho tiền; hoặc quên `numeric` trả chuỗi.
2. `timestamp` không múi giờ rồi đổi múi giờ máy.
3. `synchronize: true` ở production.
4. Chỉ kiểm tra trùng ở service, không có `UNIQUE`: race condition.
5. Để lỗi DB (`22003`, `23505`) lọt ra thành `500` thay vì `400/409`.
6. Rải `process.env` thay vì cấu hình kiểu hóa; không thất bại nhanh khi sai URL (treo 30 giây).
7. Đo hiệu năng khi GET đang bị cache (`@CacheTtl`): con số đẹp nhưng vô nghĩa.
8. Tên ràng buộc tự sinh (`UQ_8a1b...`): khó đọc log và khó viết migration.
9. Tin `synchronize` sẽ "sửa" mọi thứ. Đã gặp: DB còn ràng buộc `UQ_c44a…` (tên tự sinh) trong khi entity khai báo `uq_products_sku`; sau khởi động lại **không có gì đổi**, vì `synchronize` so khớp ràng buộc theo cột chứ không đổi tên. Đổi tên/kiểu/ràng buộc đã tồn tại cần xóa schema dev dựng lại, hoặc migration (B03). Bộ chấm vì thế dựng lại schema từ entity trước khi kiểm.
