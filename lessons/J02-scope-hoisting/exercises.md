# J02 · Bài tập

Bài code: viết vào `answers/exNN.js` (ES module). Bài 🔮 đoán output: ghi vào `answers/exNN.txt`, **không chạy code trước**.
Chấm: `bash lessons/check.sh lessons/J02-scope-hoisting 01`.
Đáp án: `solutions/` — chỉ mở sau khi đã qua test hoặc bí sau 3 lần thử.

**Pass:** 6/8 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 Hoisting & TDZ
Đọc `starter/ex01.js`. Hàm `show(label, fn)` in `label` và kết quả của `fn()`, hoặc in `label` và **tên lỗi** (`e.name`) nếu `fn` ném lỗi.
Ghi 10 dòng output vào `answers/ex01.txt`, đúng như `console.log` in ra, vd. `A undefined`, `B ReferenceError`, `C hi`.

### ex02 · 🐞 Handler trong vòng lặp
`starter/ex02.js` có hàm `makeHandlers(names)` trả về mảng hàm; hàm thứ `i` phải trả `'Hello, <name> #<i>'`. Nhưng mọi hàm đều trả `'Hello, undefined #3'`.
Viết lại đúng vào `answers/ex02.js` (giữ tên và chữ ký `export function makeHandlers(names)`).
```js
const [a, b] = makeHandlers(['An', 'Bình']);
a(); // 'Hello, An #0'
b(); // 'Hello, Bình #1'
```

### ex03 · 🔮 const, shadowing, strict mode
Đọc `starter/ex03.js` (cùng kiểu `show` như ex01). Ghi 10 dòng output vào `answers/ex03.txt`.

---

## 🟡 Kết hợp

### ex04 · 🐞 Tính tổng đơn hàng
`starter/ex04.js` chứa `calculateTotal(items)` viết bằng `var` và một biến chưa khai báo — chạy là lỗi. Viết lại vào `answers/ex04.js`:
- `items`: mảng `{ price, qty }` (VND, số nguyên)
- tổng = Σ `price × qty`; nếu tổng **≥ 1 000 000** thì giảm 10% (làm tròn về số nguyên gần nhất)
- mảng rỗng → `0`
- không được tạo/ghi biến toàn cục nào
```js
calculateTotal([{ price: 200000, qty: 2 }])               // 400000
calculateTotal([{ price: 500000, qty: 2 }, { price: 1, qty: 5 }]) // 900005  (1 000 005 − 10%)
```

### ex05 · Bộ sinh mã đơn
`export function createIdGenerator(prefix, { start = 1, pad = 0 } = {})` trả về object `{ next, peek, reset }`:
- `next()` trả mã kế tiếp rồi tăng bộ đếm: `'ORD-1'`, `'ORD-2'`… Với `pad: 4`: `'ORD-0001'`
- `peek()` trả mã sắp sinh, **không** tăng bộ đếm
- `reset()` quay về `start`
- Hai generator khác nhau có bộ đếm **độc lập**; không ai bên ngoài sửa được bộ đếm (không có thuộc tính `count` lộ ra).
```js
const g = createIdGenerator('ORD', { pad: 4 });
g.next(); g.next(); // 'ORD-0001', 'ORD-0002'
g.peek();           // 'ORD-0003'
```

### ex06 · 🐞 Nhãn trạng thái đơn
`starter/ex06.js` dùng `switch` với `const label` lặp ở nhiều `case` → không chạy được. Viết `export function describeStatus(status)` trả về **object mới mỗi lần gọi** `{ label, color }`:

| status | label | color |
|---|---|---|
| `pending` | Chờ xử lý | gray |
| `paid` | Đã thanh toán | blue |
| `shipped` | Đang giao | orange |
| `delivered` | Đã giao | green |
| `cancelled` | Đã hủy | red |
| khác (kể cả `'toString'`, `undefined`) | Không rõ | gray |

Sửa object trả về không được ảnh hưởng tới lần gọi sau.

---

## 🔴 Thực tế

### ex07 · Dữ liệu rò giữa các request
Đồng nghiệp viết handler ở `starter/ex07.js`. Khi 2 request tới gần nhau, user A nhận về tên của user B. Hãy:
1. Giải thích ngắn gọn vì sao (ghi comment đầu file trả lời).
2. Viết lại `export async function handleRequest(user, loadOrders)` vào `answers/ex07.js`, trả `{ user: <tên>, orders: <số đơn> }`, đúng cả khi nhiều request chạy xen kẽ.
`loadOrders(userId)` là hàm async được truyền vào (giả lập truy vấn DB).

### ex08 · Config đọc một lần, đóng băng
Viết `export function createConfig(env)` (`env` là object giống `process.env`, mọi giá trị là chuỗi hoặc thiếu). Trả về object **đã đóng băng** (gán lại thuộc tính → TypeError trong strict mode):
- `port`: từ `PORT`, mặc định `3000`; phải là số nguyên 1–65535, sai → `throw new Error` có chữ `PORT`
- `databaseUrl`: từ `DATABASE_URL`, **bắt buộc** (thiếu hoặc rỗng → `throw new Error` có chữ `DATABASE_URL`)
- `nodeEnv`: từ `NODE_ENV`, mặc định `'development'`
- `isProduction`: `nodeEnv === 'production'`
Hàm **không** được đọc `process.env` trực tiếp (để test được).
```js
createConfig({ DATABASE_URL: 'postgres://x' })
// { port: 3000, databaseUrl: 'postgres://x', nodeEnv: 'development', isProduction: false }
```
