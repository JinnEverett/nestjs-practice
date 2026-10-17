# J06 · Array methods & tư duy hàm

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Chọn đúng method cho từng việc: `map`, `filter`, `reduce`, `find`, `some`, `every`, `flatMap`, `includes`.
- Sort đúng: comparator cho số, chuỗi tiếng Việt, nhiều tiêu chí, không mutate (`toSorted`).
- Gom nhóm và tổng hợp dữ liệu (group by, count, top N) — tư duy giống `GROUP BY` bên SQL.
- Nhận ra độ phức tạp O(n·m) khi lồng `find`/`filter` trong vòng lặp và sửa bằng `Map`.

---

## 1. Bảng chọn method
| Muốn | Dùng | Trả về |
|---|---|---|
| Biến đổi từng phần tử | `map` | mảng mới cùng độ dài |
| Lọc | `filter` | mảng mới ≤ độ dài |
| Gộp thành 1 giá trị (tổng, object, Map) | `reduce` | bất kỳ |
| Phần tử đầu tiên thỏa | `find` / `findLast` | phần tử hoặc `undefined` |
| Vị trí | `findIndex`, `indexOf` | số, `-1` nếu không có |
| Có ít nhất một / tất cả | `some` / `every` | boolean (dừng sớm) |
| Có chứa giá trị | `includes` | boolean (đúng cả với `NaN`) |
| Map rồi làm phẳng 1 tầng | `flatMap` | mảng mới |
| Chỉ chạy side effect | `for...of` (hoặc `forEach`) | — |

SQL ↔ JS: `WHERE` ≈ `filter`, `SELECT expr` ≈ `map`, `GROUP BY + SUM` ≈ `reduce`/`Object.groupBy`, `ORDER BY` ≈ `toSorted`, `LIMIT/OFFSET` ≈ `slice`, `JOIN` ≈ tra `Map`.

## 2. Sort
```js
[10, 9, 1, 100].sort();                    // [1, 10, 100, 9] ❌ mặc định so theo CHUỖI
nums.toSorted((a, b) => a - b);            // ✅ tăng dần, không mutate
names.toSorted((a, b) => a.localeCompare(b, 'vi'));   // ✅ tiếng Việt: Ă, Â, Đ đúng chỗ
items.toSorted((a, b) => a.price - b.price || a.id - b.id); // nhiều tiêu chí: `||` khi bằng 0
```
- Comparator trả số âm (a trước), dương (b trước), 0 (giữ thứ tự — sort của JS là **stable**).
- `sort`, `reverse`, `splice` **mutate** mảng gốc. Bản không mutate: `toSorted`, `toReversed`, `toSpliced`, `with` (Node 20+).

## 3. reduce & group by
```js
const revenueByCustomer = orders.reduce((acc, o) => {
  acc.set(o.customerId, (acc.get(o.customerId) ?? 0) + o.total);
  return acc;
}, new Map());

const byStatus = Object.groupBy(orders, (o) => o.status);   // Node 21+: { paid: [...], pending: [...] }
const byId = new Map(products.map((p) => [p.id, p]));       // "index" để JOIN O(1)
```
Luôn truyền giá trị khởi tạo cho `reduce` — mảng rỗng không có khởi tạo sẽ ném TypeError.

## 4. Độ phức tạp
```js
// ❌ O(orders × products): 50k × 10k = 500 triệu phép so
orders.map((o) => products.find((p) => p.id === o.productId));
// ✅ O(orders + products)
const byId = new Map(products.map((p) => [p.id, p]));
orders.map((o) => byId.get(o.productId));
```
Đây chính là khác biệt giữa Nested Loop không index và Hash Join bên SQL.

## Bẫy hay gặp
| Bẫy | Ví dụ |
|---|---|
| `map(parseInt)` | `['1','2','3'].map(parseInt)` → `[1, NaN, NaN]` (index bị truyền làm radix) |
| `forEach` trả `undefined`, không `break` được | dùng `for...of` hoặc `some`/`find` |
| `Array(3).map(...)` | mảng "lỗ" — map bỏ qua → dùng `Array.from({ length: 3 }, fn)` |
| `indexOf(NaN)` | luôn `-1` → dùng `includes` |
| Chain dài trên mảng lớn | mỗi bước tạo mảng mới — với dữ liệu rất lớn, gộp vào một `reduce`/vòng lặp |

## Bên trong NestJS dùng cái này ở đâu
- Map entity → DTO (`users.map(toUserResponse)`), gom dữ liệu sau khi query, ghép kết quả nhiều query bằng `Map` (thay vì N+1 query — B02, M05 DataLoader).
- Filter/sort/paginate an toàn từ query string (ex10) → R01 làm lại ở tầng SQL.

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J06-array-methods NN`.
