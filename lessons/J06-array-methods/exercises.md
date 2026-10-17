# J06 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J06-array-methods 01`. Đáp án: `solutions/`.
**Không mutate input. Hạn chế vòng `for` có chỉ số — ưu tiên array method.**

**Pass:** 8/10 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Doanh thu
`export function totalRevenue(orders)` — tổng `total` của các đơn có `status` là `'paid'` hoặc `'delivered'`. Mảng rỗng → `0`.

### ex02 · Sắp xếp sản phẩm
`export function sortProducts(products)` trả **mảng mới** sắp theo `price` tăng dần; cùng giá thì theo `name` (thứ tự chữ cái tiếng Việt, `localeCompare(…, 'vi')`).

### ex03 · Đếm theo trạng thái
`export function countByStatus(orders, statuses = [])` trả object `{ [status]: số đơn }`. Mọi status trong `statuses` phải có mặt kể cả khi bằng 0.
```js
countByStatus([{ status: 'paid' }, { status: 'paid' }, { status: 'pending' }], ['cancelled'])
// { cancelled: 0, paid: 2, pending: 1 }   (thứ tự key không quan trọng)
```

### ex04 · 🔮 Bẫy array
Đọc `starter/ex04.js`, ghi 11 dòng output vào `answers/ex04.txt`.

---

## 🟡 Kết hợp

### ex05 · Top khách hàng
`export function topCustomers(orders, n = 3)` — bỏ đơn `cancelled`; với mỗi `customerId` tính `revenue` (tổng `total`) và `orderCount`. Trả `n` khách doanh thu cao nhất: `[{ customerId, revenue, orderCount }]`, sắp `revenue` giảm dần, bằng nhau thì `customerId` tăng dần.

### ex06 · `sortBy` nhiều tiêu chí
`export function sortBy(items, criteria)` với `criteria = [{ key, dir }]` (`dir`: `'asc'` mặc định | `'desc'`):
- So lần lượt theo từng tiêu chí; chuỗi so bằng `localeCompare(…, 'vi')`, số so bằng phép trừ
- Giá trị `null`/`undefined` **luôn nằm cuối** bất kể `dir`
- Stable (bằng nhau ở mọi tiêu chí → giữ thứ tự cũ); không mutate

### ex07 · `chunk` và `uniqueBy`
- `chunk(arr, size)`: chia thành các mảng con độ dài `size` (mảng cuối có thể ngắn hơn). `size` không phải số nguyên dương → `RangeError`.
- `uniqueBy(arr, keyFn)`: bỏ phần tử trùng key, **giữ lần xuất hiện đầu tiên**, giữ thứ tự.
```js
chunk([1, 2, 3, 4, 5], 2)                       // [[1, 2], [3, 4], [5]]
uniqueBy([{ id: 1, v: 'a' }, { id: 1, v: 'b' }], (x) => x.id) // [{ id: 1, v: 'a' }]
```

### ex08 · Làm phẳng cây danh mục
`export function flattenCategories(tree)` — `tree` là mảng gốc `{ id, name, children? }`. Trả danh sách duyệt **tiền thứ tự** (cha trước, con sau, theo thứ tự trong mảng):
```js
[{ id, name, depth, path }]  // depth gốc = 0; path = tên từ gốc tới nút nối bằng ' > '
```

---

## 🔴 Thực tế

### ex09 · Báo cáo doanh thu theo danh mục
`export function revenueByCategory(orders, products)`:
- `orders`: `[{ id, status, items: [{ productId, qty, unitPrice }] }]`; chỉ tính đơn `delivered`
- `products`: `[{ id, categoryName }]`; `productId` không tìm thấy → danh mục `'Khác'`
- Trả `[{ category, revenue, units }]` (`revenue` = Σ `qty × unitPrice`, `units` = Σ `qty`), sắp `revenue` giảm dần, bằng nhau thì `category` tăng dần.
- **Yêu cầu hiệu năng:** 50 000 đơn × 4 dòng hàng, 30 000 sản phẩm phải chạy dưới 1 giây (test có đo).

### ex10 · Filter / sort / paginate cho API danh sách
`export function applyQuery(products, query = {})`. `products`: `{ id, name, price, categoryId, isActive }`. `query` (mọi field tùy chọn):
- Chỉ lấy `isActive === true`
- `q`: tìm chuỗi con trong `name`, **không phân biệt hoa thường và dấu tiếng Việt** (kể cả `đ/Đ`), bỏ khoảng trắng 2 đầu; rỗng = không lọc
- `minPrice`, `maxPrice`: lọc khoảng giá (bao gồm 2 đầu)
- `categoryIds`: mảng id; rỗng/thiếu = không lọc
- `sort`: `'price' | '-price' | 'name' | '-name'` (dấu `-` = giảm dần), mặc định theo `id` tăng; bằng nhau thì `id` tăng
- `page` (mặc định 1), `limit` (mặc định 20)
Trả `{ data, total, page, limit, totalPages }` — `total` là số bản ghi sau khi lọc; `totalPages = ceil(total / limit)`; page vượt quá → `data: []`.
