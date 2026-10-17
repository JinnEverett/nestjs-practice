# J08 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J08-prototype-class 01`. Đáp án: `solutions/`.

**Pass:** 8/10 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 Prototype chain
Đọc `starter/ex01.js`, ghi 11 dòng output vào `answers/ex01.txt`.

### ex02 · Value object `Money`
`export class Money` — số tiền tính bằng **đơn vị nhỏ nhất** (đồng, cent), bất biến:
- `new Money(amount, currency = 'VND')`: `amount` phải là safe integer, `currency` là 3 chữ in hoa (`/^[A-Z]{3}$/`), sai → `RangeError`
- getter `amount`, `currency` (không có setter — gán sẽ ném TypeError; không có field công khai nào sửa được)
- `add(other)`, `subtract(other)` → `Money` mới; khác currency → `TypeError`
- `multiply(factor)` → `Money` mới, làm tròn `Math.round`
- `equals(other)` → boolean
- `toString()` → `'1250000 VND'`; `toJSON()` → `{ amount, currency }`
- `static zero(currency = 'VND')`

### ex03 · Kế thừa & đa hình
- `export class Shape`: **không được** `new Shape()` trực tiếp (`TypeError`); `area()` mặc định ném `Error('Not implemented')`; `describe()` trả `'<TênClass> có diện tích <area làm tròn 2 chữ số>'` (vd. `'Circle có diện tích 3.14'`); `static largest(shapes)` → shape có diện tích lớn nhất, mảng rỗng → `null`.
- `export class Rectangle extends Shape` (`width`, `height`), `export class Circle extends Shape` (`radius`).

---

## 🟡 Kết hợp

### ex04 · `EventBus`
`export class EventBus`:
- `on(event, handler)` → trả về hàm `unsubscribe()`
- `off(event, handler)`
- `once(event, handler)` — chỉ chạy lần emit kế tiếp
- `emit(event, payload)` → số handler đã được gọi; gọi theo thứ tự đăng ký; handler đăng ký **trong lúc** đang emit thì không chạy ở lần emit đó
- Cùng một handler đăng ký 2 lần cho 1 event → chỉ tính 1 lần
- Không lộ cấu trúc lưu trữ ra ngoài (dùng `#private`)

### ex05 · Getter/setter có validate
`export class Product`:
- `constructor({ name, price })` — gán qua setter
- `name`: setter `trim()`; rỗng sau trim / không phải chuỗi → `TypeError`
- `price`: safe integer ≥ 0, sai → `RangeError`
- `toJSON()` → `{ name, price, priceLabel }` với `priceLabel` dạng `'150.000 ₫'` (Intl vi-VN VND)
- `static fromJSON(text)` → `Product` (đi qua validate)

### ex06 · Mixin
- `export const withTimestamps = (Base) => class ...`: khi khởi tạo có `createdAt` và `updatedAt` (cùng là `new Date()` lúc tạo); method `touch()` cập nhật `updatedAt`.
- `export const withSoftDelete = (Base) => class ...`: `deletedAt = null`; `softDelete()` đặt `deletedAt = new Date()`; `restore()`; getter `isDeleted`.
- Phải kết hợp được: `class Post extends withSoftDelete(withTimestamps(Entity))`, và constructor của `Entity` vẫn nhận đủ tham số.

### ex07 · 🐞 Repository có cache
`starter/ex07.js`: `CachedRepository` gọi `super.findById()` thì lỗi. Viết lại 2 class vào `answers/ex07.js`:
- `export class BaseRepository`: `constructor(items)` (lưu bản copy), `findAll()` → **mảng copy**, `findById(id)` → item hoặc `null`
- `export class CachedRepository extends BaseRepository`: `findById(id)` chỉ gọi `super.findById` **lần đầu** cho mỗi id (kể cả khi kết quả là `null`), lần sau trả từ cache; `invalidate(id)` xóa cache của id đó.

---

## 🔴 Thực tế

### ex08 · Token bucket
Rate limiter "mượt" hơn fixed window. `export class TokenBucket`:
- `constructor({ capacity, refillPerSecond, now = Date.now })` — bắt đầu **đầy** (`capacity` token)
- Token được nạp lại liên tục theo thời gian: `refillPerSecond` token mỗi giây, không vượt `capacity`
- `tryRemove(n = 1)` → `true` và trừ `n` token nếu đủ, ngược lại `false` (không trừ gì)
- getter `available` → số token hiện có, làm tròn xuống (đã tính phần nạp lại)

### ex09 · State machine đơn hàng
- `export class InvalidTransitionError extends Error` có `from`, `to`, `name = 'InvalidTransitionError'`, message chứa cả 2 trạng thái.
- `export class Order`: `constructor({ id, now = () => new Date() })`, trạng thái đầu `'pending'`.
  Chuyển hợp lệ: `pending → paid | cancelled`, `paid → shipped | refunded`, `shipped → delivered`. Mọi chuyển khác → `InvalidTransitionError`.
  Method: `pay()`, `ship()`, `deliver()`, `cancel()`, `refund()` (trả `this`), `canTransitionTo(status)`.
  getter `status`; getter `history` → **bản copy** mảng `[{ from, to, at }]` (`at` lấy từ `now()`).

### ex10 · 🔮 Thứ tự khởi tạo
Đọc `starter/ex10.js`, ghi 8 dòng output vào `answers/ex10.txt`.
