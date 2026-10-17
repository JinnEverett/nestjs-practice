# J13 · Collections & iteration: Map, Set, WeakMap, iterator, generator

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Chọn đúng `Map`/`Set`/`WeakMap` thay cho object/array khi phù hợp.
- Hiểu iterator protocol — thứ đứng sau `for...of`, spread, destructuring.
- Viết generator (lười — chỉ tính khi cần) và async generator (`for await`) để xử lý dữ liệu theo luồng.
- Duyệt API phân trang / export dữ liệu lớn mà không nạp hết vào RAM.

---

## 1. Map vs object, Set vs array
| Nhu cầu | Dùng |
|---|---|
| Key bất kỳ (số, object), thêm/xóa nhiều, cần `size`, giữ thứ tự chèn | `Map` |
| Record có cấu trúc cố định, serialize JSON | object thường |
| Tập giá trị duy nhất, kiểm tra "có chứa" O(1) | `Set` |
| Danh sách có thứ tự, trùng được, truy cập theo index | array |
| Gắn dữ liệu phụ vào object mà không giữ object sống (cache, metadata) | `WeakMap` / `WeakSet` |

```js
const byId = new Map(users.map((u) => [u.id, u]));   // index O(1)
const seen = new Set();                               // dedupe
const meta = new WeakMap();                           // meta.set(request, { startedAt })
```
- `Map`/`Set` so key bằng SameValueZero: `1` khác `'1'`, `NaN` bằng `NaN`, object so theo tham chiếu.
- `JSON.stringify(new Map())` → `'{}'` → đổi bằng `Object.fromEntries(map)` hoặc `[...map]`.
- `WeakMap` chỉ nhận key là object, không duyệt được, không có `size` — đổi lại key bị GC thì entry tự biến mất (không rò bộ nhớ).
- Node 22+: `Set.prototype.union / intersection / difference / isSubsetOf…` có sẵn.

## 2. Iterator protocol
Một object **iterable** có method `[Symbol.iterator]()` trả về **iterator** — object có `next()` trả `{ value, done }`.
```js
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return { next: () => (current <= last ? { value: current++, done: false } : { value: undefined, done: true }) };
  },
};
[...range];   // [1, 2, 3]
```
`for...of`, spread `[...x]`, `Array.from`, destructuring, `new Map(iterable)`, `Promise.all(iterable)` đều dùng protocol này.

## 3. Generator — viết iterator dễ dàng
```js
function* naturals() {
  let n = 0;
  while (true) yield n++;      // vô hạn nhưng lười: chỉ chạy tới yield tiếp theo khi được gọi next()
}
function* take(iterable, n) {
  if (n <= 0) return;
  for (const x of iterable) {
    yield x;
    if (--n === 0) return;     // return → for...of bên ngoài dừng, finally của nguồn được gọi
  }
}
[...take(naturals(), 3)];      // [0, 1, 2]
```
- `yield` tạm dừng, `next(value)` tiếp tục và đưa `value` vào làm kết quả của biểu thức `yield`.
- `break` khỏi `for...of` gọi `iterator.return()` → khối `finally` trong generator chạy (dọn tài nguyên).
- `yield* other` ủy quyền cho iterable khác.

## 4. Async generator & `for await`
```js
async function* paginate(fetchPage) {
  let cursor = null;
  do {
    const { items, nextCursor } = await fetchPage(cursor);
    yield* items;
    cursor = nextCursor;
  } while (cursor);
}
for await (const order of paginate(api.listOrders)) {
  if (done(order)) break;      // dừng sớm → không tải trang tiếp theo
}
```
Stream của Node (N03) cũng là async iterable: `for await (const chunk of fs.createReadStream(...))`.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| Object làm "map" với key từ input | đụng `__proto__`, key số bị đổi thành chuỗi |
| Duyệt generator hai lần | lần 2 rỗng (iterator đã cạn) — iterable "tái sử dụng" phải tạo iterator mới mỗi lần |
| `Map` dùng làm cache không giới hạn | rò bộ nhớ (J03 ex10) |
| Nạp cả bảng 1M dòng vào mảng để export | hết RAM → duyệt theo trang / stream (ex05, ex08) |

## Bên trong NestJS dùng cái này ở đâu
- Index trong bộ nhớ (`Map`), dedupe (`Set`), metadata theo request (`WeakMap`).
- Export CSV lớn: async generator đọc DB theo trang → stream ra response (`StreamableFile`, C12).
- Batch insert khi import dữ liệu (ex08) — B03 seed dữ liệu lớn.

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J13-collections-iterators NN`.
