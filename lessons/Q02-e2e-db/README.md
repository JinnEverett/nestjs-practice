# Q02 · E2E với database thật

Đọc khoảng 11 phút. Từ B01 dữ liệu nằm trong Postgres, nên test e2e của bạn chạm DB thật. Điều đó làm test *chân thực* (ràng buộc, kiểu dữ liệu, transaction, truy vấn thật) nhưng cũng mở ra loại lỗi mới: test này làm bẩn DB cho test kia, hai tiến trình giẫm lên nhau, test xanh lần đầu rồi đỏ lần hai. Bài này dựng nền để bộ e2e **xanh ổn định**. Cần Postgres đang chạy (`docker compose -f env/docker-compose.yml up -d postgres`) và đã làm B01.

## Mục tiêu
- Giữ DB sạch giữa các test bằng một helper `cleanDatabase(app)` đúng (động, an toàn, nhanh).
- Dựng dữ liệu bằng factory, không nhồi JSON giống nhau khắp bộ test.
- Viết e2e kiểm cả **phản hồi HTTP lẫn trạng thái trong DB**.
- Chạy ổn định: nhiều lần liên tiếp, thứ tự ngẫu nhiên, và song song nhiều tiến trình.

## 1. Vì sao e2e với DB hay "chập chờn"
| Triệu chứng | Nguyên nhân gốc |
|---|---|
| Xanh lần đầu, đỏ lần hai | dữ liệu lần chạy trước còn trong DB (id, SKU trùng, `total = 1`) |
| Đỏ khi chạy riêng một test | test đó sống nhờ dữ liệu test khác tạo |
| Đỏ khi bật `--randomize` | thứ tự chạy ngầm định đang là một phần của test |
| Đỏ ở CI, xanh máy dev | id cứng (`/products/1`), múi giờ, thứ tự mặc định của `SELECT` không có `ORDER BY` |
| Đỏ khi hai worker chạy cùng lúc | cả hai ghi vào cùng một DB/bảng |
| Đỏ vì `sleep` quá ngắn | chờ thời gian thay vì chờ điều kiện |

Quy tắc vàng: **mỗi test tự dựng trạng thái đầu và không tin trạng thái nào khác**.

## 2. Ba chiến lược giữ DB sạch
| Chiến lược | Tốc độ | Cô lập | Ghi chú |
|---|---|---|---|
| `TRUNCATE ... RESTART IDENTITY CASCADE` trước mỗi test | nhanh (vài ms) | tốt trong một DB | **mặc định của khóa học**; đi qua HTTP/pool thật |
| Bọc mỗi test trong transaction rồi rollback | nhanh nhất | rất tốt | chỉ khi test và ứng dụng dùng **cùng một connection**; qua HTTP, mỗi request lấy connection khác nên không rollback được |
| Mỗi worker/test một database (hoặc schema) mới | chậm (tạo DB + schema) | tuyệt đối | dùng cho **song song giữa tiến trình**; Testcontainers là biến thể dựng cả container |

```ts
export async function cleanDatabase(app: INestApplication) {
  const ds = app.get(DataSource);
  const rows = await ds.query(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
  const tables = rows.map((r) => r.tablename).filter((t) => !KEEP.has(t));           // bỏ 'migrations'
  await ds.query(`TRUNCATE TABLE ${tables.map(quote).join(', ')} RESTART IDENTITY CASCADE`);
}
```
- Lấy danh sách bảng **động** từ catalog: thêm entity mới không phải sửa helper. Trích dẫn định danh (`"Q02_MixedCase"`).
- Một câu lệnh cho mọi bảng + `CASCADE` để khỏi tính thứ tự khóa ngoại; `RESTART IDENTITY` để id về 1.
- **Không** xóa bảng của công cụ (`migrations`): dọn nhầm là mất lịch sử migration.
- TRUNCATE chỉ dọn **DB**. Trạng thái nằm ngoài DB (cache trong bộ nhớ của C08, sổ trong RAM, Redis ở B07) vẫn còn: sau khi dọn DB mà dữ liệu cũ vẫn xuất hiện, hãy nghi cache. Dọn chúng cùng lúc (khởi tạo lại ứng dụng cho mỗi file test, hoặc có hook reset).

## 3. Song song giữa các tiến trình
Jest chạy nhiều file song song trên nhiều worker. Hai worker cùng `TRUNCATE` một DB thì giẫm lên nhau. Cách làm: mỗi worker một database riêng, tên suy ra từ `process.env.JEST_WORKER_ID`, hoặc `DATABASE_URL` khác nhau cho mỗi tiến trình. Điều kiện để làm được: ứng dụng đọc `DATABASE_URL` từ cấu hình (C09) thay vì viết cứng, và ở môi trường test tự tạo schema (`synchronize`, hoặc chạy migration ở B03).

## 4. Dữ liệu thử bằng factory
```ts
makeProduct({ price: 5 })               // thân hợp lệ, SKU duy nhất, ghi đè từng trường
await createProduct(app, { stock: 3 })  // tạo qua API (đã có khóa admin), trả body để lấy id
```
Factory giảm lặp, gom "thân hợp lệ" về một chỗ (khi luật validate đổi chỉ sửa một nơi) và **trả id thật** để test không phải đoán `/products/1`. SKU duy nhất bằng bộ đếm + tiền tố theo lần chạy, vẫn khớp `^[A-Z0-9-]{3,20}$`.

## 5. Kiểm cả hai phía
Một test mạnh kiểm *phản hồi* (`201`, body) và *trạng thái DB* (`SELECT ... FROM products`): hàng đã nằm đúng giá trị; còn khi lỗi (`401`, `400`, `409`) thì DB **không đổi** ("không có tác dụng phụ" là một hành vi cần test).

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| id cứng trong URL | đỏ khi chạy lần hai/ngẫu nhiên | dùng id trả về từ factory |
| `let created` dùng chung giữa các test | test phụ thuộc thứ tự | mỗi test tự tạo |
| `expect(total).toBe(1)` mà không dọn DB | đúng lần đầu, sai lần sau | `cleanDatabase` trước mỗi test |
| `TRUNCATE` danh sách bảng gõ tay | thêm bảng là quên dọn | lấy từ `pg_tables` |
| Dọn cả `migrations` | mất lịch sử | loại trừ |
| Cache/RAM còn dữ liệu cũ sau khi dọn DB | đọc ra dữ liệu ma | dọn/khởi tạo lại trạng thái ngoài DB |
| Dùng DB dev để chạy test | xóa mất dữ liệu đang làm | DB riêng `shop_test` |
| `sleep(1500)` để chờ | chậm và vẫn flaky | chờ điều kiện, hoặc không cần chờ |
| Mọi thứ e2e | bộ test chậm | logic nghiệp vụ test ở unit (Q01, Q03, Q04) |

## Dùng ở đâu trong `shop-api`
Mọi module sau (B02–B07, A01–A06, R01–R10) viết e2e theo mẫu này. B05 và R08 dựa vào việc chạy **đồng thời** nhiều request thật trên DB thật để tái hiện race condition. P07 dùng đúng helper này trong CI với service container Postgres.
