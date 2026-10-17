# J05 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J05-objects-arrays 01`. Đáp án: `solutions/`.
**Mọi hàm không được mutate input** (test sẽ kiểm tra).

**Pass:** 8/10 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 Tham chiếu & copy
Đọc `starter/ex01.js`, ghi 9 dòng output vào `answers/ex01.txt`.

### ex02 · `pick` và `omit`
Export 2 hàm, đều trả **object mới**:
- `pick(obj, keys)`: chỉ giữ các key trong `keys` mà `obj` **thật sự có** (own property, kể cả khi giá trị là `undefined`); key không tồn tại thì bỏ qua.
- `omit(obj, keys)`: giữ mọi own key trừ các key trong `keys`.
```js
pick({ a: 1, b: 2, c: 3 }, ['a', 'c', 'z']) // { a: 1, c: 3 }
omit({ a: 1, b: 2, c: 3 }, ['b'])           // { a: 1, c: 3 }
```

### ex03 · Response DTO
Viết `export function toUserResponse(user)`. Input:
```js
{ id, email, passwordHash, profile: { fullName, avatarUrl? }, address?: { city }, roles?: string[], createdAt: Date }
```
Output (đúng các key này, không hơn):
```js
{ id, email, fullName, avatarUrl, city, roles, createdAt }
```
- `avatarUrl`, `city` thiếu → `null`; `roles` thiếu → `[]`
- `roles` trong output là **mảng mới** (sửa nó không ảnh hưởng user)
- `createdAt` → chuỗi ISO (`toISOString()`)
- **Không bao giờ** có `passwordHash`.

---

## 🟡 Kết hợp

### ex04 · `deepEqual`
`export function deepEqual(a, b)` so sánh sâu: primitive (NaN bằng NaN; 0 bằng -0), mảng (đúng thứ tự), object thường (cùng tập key, không quan tâm thứ tự), `Date` (cùng thời điểm), lồng nhau tùy ý. Khác kiểu (vd. mảng vs object, `null` vs `{}`) → `false`.

### ex05 · `updateIn` — update bất biến theo đường dẫn
`export function updateIn(obj, path, updater)`:
- `path` là mảng key/index, vd. `['cart', 'items', 0, 'qty']`
- Trả về cấu trúc mới với giá trị tại `path` = `updater(giá trị cũ)`
- Mảng vẫn là mảng; tầng trung gian thiếu → tạo `{}`
- Nhánh không đổi **giữ nguyên tham chiếu** (structural sharing)
- `updater` trả về đúng giá trị cũ → trả về **chính `obj`** (không tạo object mới)
```js
const s = { cart: { items: [{ qty: 1 }, { qty: 5 }] }, user: { name: 'An' } };
const n = updateIn(s, ['cart', 'items', 0, 'qty'], (q) => q + 1);
n.cart.items[0].qty      // 2
n.user === s.user        // true
n.cart.items[1] === s.cart.items[1] // true
s.cart.items[0].qty      // 1 (gốc không đổi)
```

### ex06 · 🔮 Destructuring & spread
Đọc `starter/ex06.js`, ghi 9 dòng output vào `answers/ex06.txt`.

### ex07 · `mergeDeep` an toàn
Merge config mặc định với config người dùng gửi lên. `export function mergeDeep(target, source)` trả về **object mới**:
- object thường lồng nhau được merge đệ quy
- mảng, `Date` và mọi giá trị không phải object thường: giá trị của `source` **thay thế** hoàn toàn
- giá trị `undefined` trong `source` bị bỏ qua (không ghi đè)
- key `__proto__`, `constructor`, `prototype` trong `source` bị **bỏ qua** (chống prototype pollution)
- không mutate `target` lẫn `source`

---

## 🔴 Thực tế

### ex08 · `deepClone`
**Không dùng** `structuredClone` và `JSON`. `export function deepClone(value)` hỗ trợ: primitive, mảng, object thường, `Date`, `Map`, `Set` (clone sâu cả key/value bên trong), và **tham chiếu vòng** (object trỏ tới chính nó vẫn clone được, cấu trúc vòng được giữ trong bản clone).

### ex09 · 🐞 Giỏ hàng bị "nhiễm" dữ liệu
`starter/ex09.js` có `addItem` dùng default param dùng chung và mutate input → giỏ của khách này lẫn sang khách khác. Viết lại `export function addItem(cart, item)` vào `answers/ex09.js`:
- `cart` có dạng `{ items: [{ productId, qty, price }] }`; trả về **cart mới**
- sản phẩm đã có → cộng dồn `qty` (tạo item mới cho dòng đó); chưa có → thêm vào cuối
- các dòng không đổi **giữ nguyên tham chiếu**
- `item.qty` không phải số nguyên dương → `throw new RangeError(...)`

### ex10 · Đối chiếu thay đổi (diff)
Trang admin cần ghi audit log "ai sửa gì". Viết `export function diffObjects(before, after)` trả về mảng các thay đổi ở **tầng 1**, sắp xếp theo `key` tăng dần:
```js
{ key, type: 'added' | 'removed' | 'changed', from?, to? }
```
- `added`: có ở `after`, không có ở `before` → `{ key, type, to }`
- `removed`: ngược lại → `{ key, type, from }`
- `changed`: có ở cả hai nhưng **không deepEqual** (dùng lại logic ex04; được copy code) → `{ key, type, from, to }`
- Bỏ qua các key trong tham số thứ 3 `ignore` (mặc định `['updatedAt']`).
