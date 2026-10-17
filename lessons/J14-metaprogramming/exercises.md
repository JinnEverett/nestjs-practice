# J14 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J14-metaprogramming 01`. Đáp án: `solutions/`.

**Pass:** 6/8 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 Descriptor, Symbol, seal/freeze
Đọc `starter/ex01.js`, ghi 10 dòng output vào `answers/ex01.txt`.

### ex02 · Enum đóng băng
`createEnum(names)` → object đóng băng `{ PENDING: 'PENDING', PAID: 'PAID', … }`:
- `Object.keys(e)` chỉ gồm các tên (method phụ **không** enumerable)
- method `values()` → mảng tên; `has(value)` → boolean (`has('toString')` là `false`)
- tên trùng → `Error`; gán/sửa → `TypeError` (strict mode)

### ex03 · Object có kiểm tra kiểu (Proxy)
`createValidatedObject(schema, initial = {})` — `schema` dạng `{ name: 'string', age: 'number', active: 'boolean' }`:
- Gán field có trong schema với sai kiểu (`typeof`) → `TypeError`; field không có trong schema → `TypeError`
- `delete` → `TypeError`
- `initial` cũng phải qua kiểm tra; `Object.keys`, `JSON.stringify` hoạt động bình thường

---

## 🟡 Kết hợp

### ex04 · Read-only view sâu
`readonlyView(target)` → Proxy chỉ đọc **mọi tầng**: gán, xóa, `defineProperty` ở bất kỳ tầng nào → `TypeError`. Object gốc vẫn sửa được và view thấy thay đổi. `view.a === view.a` (cùng proxy cho cùng object con).

### ex05 · Theo dõi thay đổi (dirty checking)
`createChangeTracker(target)` → `{ proxy, getChanges(), reset() }`:
- Ghi nhận mọi lần gán qua `proxy` (kể cả object **thường** lồng nhau — mảng coi như giá trị) theo đường dẫn `'address.city'`
- `getChanges()` → `[{ path, from, to }]` sắp theo `path`; `from` là giá trị **trước lần sửa đầu tiên**, `to` là giá trị hiện tại; gán về lại giá trị ban đầu → thay đổi đó biến mất
- `reset()` → coi trạng thái hiện tại là mốc mới (xóa danh sách thay đổi)
- Thay đổi được ghi thẳng vào `target`

### ex06 · `Symbol.toPrimitive`
`createPrice(amount)` → object với getter `amount`, sao cho:
- `` `${price}` `` / `String(price)` → `'150.000 ₫'` (Intl vi-VN VND)
- `+price`, `price + 1`, `price > 100` dùng số `amount`
- `Object.prototype.toString.call(price)` → `'[object Price]'`
- `JSON.stringify({ price })` → `'{"price":150000}'`

---

## 🔴 Thực tế

### ex07 · Metadata registry (reflect-metadata mini)
`createMetadataRegistry()` → `{ defineMetadata, getOwnMetadata, getMetadata, hasMetadata, getMetadataKeys }`, với chữ ký `(key, …, target, propertyKey?)` giống `reflect-metadata`:
- `defineMetadata(key, value, target, propertyKey?)`
- `getOwnMetadata(key, target, propertyKey?)` — chỉ của chính `target`
- `getMetadata(key, target, propertyKey?)` — tìm trên `target` rồi lần theo **chuỗi prototype** (`Object.getPrototypeOf`) → lớp con thấy metadata của lớp cha
- `hasMetadata(key, target, propertyKey?)`
- `getMetadataKeys(target, propertyKey?)` — key của chính nó trước, rồi key kế thừa, không trùng
Metadata không được giữ `target` sống (dùng `WeakMap`).

### ex08 · Auto-mock (Proxy)
Viết test cho service mà không phải tự tạo object giả cho từng dependency. `createAutoMock()` trả Proxy:
- Truy cập **bất kỳ** tên method nào → một hàm ghi lại lời gọi, mặc định trả `undefined`; cùng tên trả cùng hàm
- `mock.calls(name)` → mảng các mảng tham số đã gọi
- `mock.mockReturn(name, value)` → method đó trả `value`; `mock.mockImplementation(name, fn)` → gọi `fn`
- `await mock` và `Promise.resolve(mock)` phải trả về **chính mock** (tức mock **không** được giả làm thenable)
- Truy cập key là `Symbol` → `undefined`
