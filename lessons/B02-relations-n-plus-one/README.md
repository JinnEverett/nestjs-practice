# B02 · Quan hệ và N+1

Đọc khoảng 10 phút. B01 cho bạn sáu bảng rời nhau. Bài này nối chúng bằng **khóa ngoại** và **quan hệ TypeORM**, rồi đi vào cái bẫy hiệu năng số một của ORM: **N+1**. Số đo lấy trên Postgres 18.6, TypeORM 1.1.2.

## Mục tiêu
- Khai báo đủ bốn kiểu quan hệ (1-n, n-1 tự tham chiếu, 1-1, n-n) và hiểu **bên sở hữu** nắm `@JoinColumn`/`@JoinTable`.
- Chọn hành vi xóa (`RESTRICT` / `CASCADE`) có chủ đích; biết mã lỗi Postgres tương ứng và đổi nó thành 404/409/422, không phải 500.
- Nạp quan hệ **khi được yêu cầu** (`?include=`), không hơn; phát hiện và sửa N+1 bằng cách đếm truy vấn.
- Biết JOIN không miễn phí (tích Descartes) và Postgres **không tự tạo index** cho khóa ngoại.

## 1. Bốn kiểu quan hệ
| Quan hệ | Ví dụ trong `shop-api` | Cách khai báo | Bảng/cột sinh ra |
|---|---|---|---|
| n-1 / 1-n | `products.category_id → categories.id` | `@ManyToOne` + `@JoinColumn` ở bên "n" (bên sở hữu); `@OneToMany` ở bên "1" | cột khóa ngoại nằm ở bảng "n" |
| n-1 tự tham chiếu | `categories.parent_id → categories.id` | `@ManyToOne(() => CategoryEntity)` + `@OneToMany` trên cùng entity | cây danh mục |
| 1-1 | `user_profiles.user_id → users.id` | `@OneToOne` + `@JoinColumn` ở bảng phụ thuộc; khóa chính **chính là** khóa ngoại | tối đa một hồ sơ mỗi người dùng, không cần UNIQUE riêng |
| n-n | `products ↔ tags` | `@ManyToMany` + `@JoinTable` ở **một** bên | bảng nối `product_tags (product_id, tag_id)` có khóa chính ghép |

- **Bên sở hữu** là bên giữ `@JoinColumn`/`@JoinTable`; bên kia (`mappedBy`) chỉ là "góc nhìn ngược", không thêm cột.
- Đặt tên khóa ngoại tường minh: `@JoinColumn({ name: 'category_id', foreignKeyConstraintName: 'fk_products_category' })`. Tên băm tự sinh khó đọc trong log và khó viết migration.
- Kiểu của thuộc tính quan hệ viết `Relation<CategoryEntity>` (và `import type`): hai file entity import vòng tròn nhau, `emitDecoratorMetadata` sẽ lỗi "before initialization" nếu dùng kiểu trực tiếp.
- Giữ **cả** cột scalar (`categoryId`) lẫn thuộc tính quan hệ (`category`) trỏ cùng cột `category_id`: đọc/ghi id không cần nạp cả đối tượng.

## 2. Xóa: RESTRICT hay CASCADE?
| Khóa ngoại | `ON DELETE` | Vì sao |
|---|---|---|
| `products → categories` | `RESTRICT` | không xóa danh mục còn sản phẩm: sản phẩm không được "mồ côi" |
| `categories → categories` (cha) | `RESTRICT` | không xóa danh mục còn con |
| `order_items → orders` | `CASCADE` | dòng hàng không có nghĩa nếu thiếu đơn |
| `order_items → products`, `payments → orders`, `orders → users` | `RESTRICT` | lịch sử mua bán và chứng từ không được mất |
| `product_tags → products / tags` | `CASCADE` | dòng nối vô nghĩa khi một đầu biến mất; đầu kia còn nguyên |
| `user_profiles → users` | `CASCADE` | hồ sơ đi theo người dùng |

**Mã lỗi khác nhau:** chèn/sửa trỏ tới dòng không có → `23503` (`foreign_key_violation`). Xóa dòng còn bị tham chiếu khi khóa ngoại là `RESTRICT` → **`23001`** (`restrict_violation`), *không phải* `23503` (mã đó chỉ dùng cho `NO ACTION`). Chỉ bắt `23503` thì xóa danh mục còn sản phẩm sẽ ra **500**. Ánh xạ sang API: lookup không thấy → `404 category-not-found`; xóa bị chặn → `409 category-in-use`; tham chiếu đối tượng không tồn tại từ dữ liệu khác → `422 invalid-category`.

## 3. Nạp quan hệ: khi cần, không hơn
```ts
repo.findOneBy({ id });                                              // 1 truy vấn, không JOIN
repo.findOne({ where: { id }, relations: { category: true, tags: true } });   // JOIN trong CÙNG truy vấn
```
- API cho phép client xin thêm bằng `?include=category,tags` (danh sách phân tách bằng dấu phẩy, giá trị lạ → `400`). Không include thì **không JOIN**.
- TypeORM 1.x dùng `relations` dạng **đối tượng** (`{ category: true }`), dạng mảng chuỗi đã bỏ. `eager: true` trên entity khiến *mọi* truy vấn nạp quan hệ đó, tránh dùng; `lazy` (Promise) hợp với code đồng bộ cũ hơn là Nest.
- Quan hệ to-many nạp bằng JOIN **không có thứ tự bảo đảm**: sắp lại ở tầng ánh xạ để response ổn định.

## 4. N+1
```ts
const cats = await repo.find();                                      // 1 truy vấn
for (const c of cats) c.products = await products.find({ where: { categoryId: c.id } });   // + N truy vấn
```
Trang danh mục 1000 mục là 1001 truy vấn. Dấu hiệu: số truy vấn **tăng theo số dòng**, và chậm dần khi dữ liệu lớn lên. Cách phát hiện: bật `DB_LOGGING=true` đọc log, hoặc đếm truy vấn trong test (testkit có `countQueries`). Đã đo (trong tiến trình, DB cùng máy):

| số danh mục | truy vấn ngây thơ | truy vấn relations | ms ngây thơ | ms relations |
|---|---|---|---|---|
| 10 | 11 | 1 | 3,2 | 1,4 |
| 100 | 101 | 1 | 19,9 | 2,9 |
| 1000 | 1001 | 1 | 203,0 | 23,8 |

**JOIN không miễn phí.** Nạp hai quan hệ to-many cùng lúc (`children` và `products`) bằng một JOIN trả về *tích Descartes*: 30 con × 30 sản phẩm = 900 dòng cho mỗi danh mục gốc (18 000 dòng so với 1 220 dòng nếu lấy riêng). `relationLoadStrategy: 'query'` (mỗi quan hệ một truy vấn) tránh được điều đó, nhưng đo ra chậm 2 giây ở 1000 danh mục (chưa rõ nguyên nhân). Không có đáp án chung: đo trên dữ liệu của bạn.

## 5. Postgres không tự tạo index cho khóa ngoại
Khóa chính và UNIQUE có index; **khóa ngoại thì không**. Thiếu index ở cột khóa ngoại làm "lấy các sản phẩm của danh mục X", JOIN, và cả việc kiểm tra `RESTRICT` khi xóa cha phải quét cả bảng con. Thêm `@Index('idx_products_category', ['categoryId'])`. Ngoại lệ đã bù: `UNIQUE (order_id, product_id)` phủ truy vấn theo `order_id` (cột đầu của index), khóa chính ghép `(product_id, tag_id)` phủ `product_id`. Bảng nối `product_tags` còn thiếu index cho `tag_id` mà TypeORM không tự thêm; sửa bằng migration ở B03.

## 6. Race condition trên quan hệ
- Tạo danh mục cùng slug: UNIQUE phân xử (`23505` → `409 duplicate-slug`), không "kiểm tra rồi chèn".
- Tạo nhãn mới: `INSERT ... ON CONFLICT DO NOTHING` (`orIgnore()`), rồi đọc lại. Hai request cùng tạo nhãn `sale` không đụng nhau.
- Thay tập nhãn của cùng một sản phẩm đồng thời: hai transaction cùng tính "cần thêm cặp (sản phẩm, nhãn)" rồi cùng chèn thì đụng khóa chính của bảng nối. **Khóa dòng sản phẩm trước** (`FOR UPDATE`) để các lần thay xếp hàng nhau. `FOR UPDATE` không dùng được cùng JOIN nên nạp quan hệ ở bước sau.

## Dùng ở đâu trong `shop-api`
`src/database/entities/*` (thêm quan hệ, `TagEntity`, `UserProfileEntity`), `src/categories/` (CRUD + `include`), `src/tags/`, `ProductsController.findOne` nhận `?include=`. Đơn hàng vẫn tạm ở RAM đến B05; khóa ngoại phía đơn hàng đã sẵn trong schema.

## Bẫy hay gặp
1. **Thêm khóa ngoại vào bảng đã có dữ liệu "mồ côi"**: sản phẩm có `category_id = 1` mà chưa có danh mục nào làm `synchronize` thất bại (`violates foreign key constraint "fk_products_category"`) và **ứng dụng không khởi động**. Nâng từ B01 lên B02 trên DB dev cũ, bạn sẽ gặp đúng lỗi này: dọn/sửa dữ liệu trước (hoặc tạo danh mục 1), đó là lý do cần migration (B03). Test cũ của bạn (Q02) cũng cần danh mục 1 trước khi tạo sản phẩm.
2. Chỉ bắt `23503` mà quên `23001` cho `RESTRICT` → 500.
3. N+1 trong vòng lặp `await`; `eager` trên mọi truy vấn.
4. JOIN nhiều quan hệ to-many làm số dòng nhân lên.
5. Quên index cho khóa ngoại.
6. Dựa vào thứ tự của mảng quan hệ (không được bảo đảm).
7. Dùng `relations: ['a','b']` kiểu cũ (TypeORM 1.x bỏ).
8. `cascade: true` ở ORM tưởng là `ON DELETE CASCADE` ở DB: hai thứ khác nhau (ORM tự lưu đối tượng con vs DB tự xóa dòng con).
