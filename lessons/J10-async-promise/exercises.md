# J10 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J10-async-promise 01`. Đáp án: `solutions/`.
Module này luyện **Promise thuần**: được dùng `async/await` nếu đã biết, nhưng hãy thử viết bằng `.then` trước.

**Pass:** 8/10 bài + đoán đúng ≥ 2/3 bài 🔮, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 Thứ tự log: microtask vs timer
Đọc `starter/ex01.js`, ghi 11 dòng output vào `answers/ex01.txt`.

### ex02 · `sleep` và `promisify`
- `sleep(ms, value)` → Promise resolve `value` sau `ms` mili giây.
- `promisify(fn)` → hàm trả Promise, gọi `fn(...args, callback)` với callback kiểu Node `(err, result)`: `err` khác null/undefined → reject `err`, ngược lại resolve `result`. Giữ `this`. **Không** dùng `util.promisify`.

### ex03 · `withTimeout`
`withTimeout(promise, ms, message = 'Operation timed out')`:
- `promise` settle trước `ms` → kết quả/lỗi của nó
- quá `ms` → reject `Error` có `name = 'TimeoutError'` và `message`
- Khi `promise` settle trước, **phải `clearTimeout`** (không để timer treo).

### ex04 · 🔮 Promise chaining
Đọc `starter/ex04.js`, ghi 10 dòng output vào `answers/ex04.txt`.

---

## 🟡 Kết hợp

### ex05 · 🐞 Thoát khỏi callback hell
`starter/ex05.js` viết `getUserSummary` bằng callback lồng nhau và có bug (lỗi ở một bước bị bỏ qua). Viết lại `export function getUserSummary(id, api)` trả **Promise** của:
```js
{ name, orderCount, totalPaid }  // totalPaid = tổng amount của payment status 'succeeded' trên mọi đơn
```
`api` có 3 hàm callback kiểu Node: `getUser(id, cb)`, `getOrders(userId, cb)` → `[{ id }]`, `getPayments(orderId, cb)` → `[{ amount, status }]`.
- Lỗi ở bất kỳ bước nào → Promise reject đúng lỗi đó
- Payment của các đơn phải được lấy **song song** (test đo thời gian)

### ex06 · Chờ một event
`fromEvent(emitter, event, { timeoutMs } = {})` → Promise:
- resolve với payload của lần `event` đầu tiên
- reject với lỗi nếu emitter phát `'error'` trước
- có `timeoutMs` và quá hạn → reject `Error` có `name = 'TimeoutError'`
- **Mọi nhánh** đều gỡ hết listener mình đã gắn và xóa timer.

### ex07 · Deferred
`createDeferred()` → `{ promise, resolve, reject }` — resolve/reject được gọi từ **bên ngoài**. Không dùng `Promise.withResolvers`.

---

## 🔴 Thực tế

### ex08 · Gộp request đang bay (request coalescing)
1000 request cùng hỏi giá sản phẩm 42 khi cache vừa hết hạn → 1000 query xuống DB (cache stampede). Viết `createCoalescingCache(fetcher, { ttlMs = Infinity, now = Date.now } = {})` → `{ get(key) }`:
- Nhiều `get(key)` **đồng thời** cùng key → `fetcher(key)` chỉ chạy **một lần**, tất cả nhận cùng kết quả
- Thành công → cache trong `ttlMs`; hết hạn → lần sau gọi lại `fetcher`
- Thất bại → mọi caller đang chờ nhận lỗi, **không cache lỗi** (lần sau thử lại)
- Key khác nhau độc lập

### ex09 · Tính tổng không chặn event loop
`chunkedSum(numbers, chunkSize = 10_000)` → Promise của tổng. Xử lý từng đoạn `chunkSize` phần tử, giữa các đoạn **nhường event loop** (`setImmediate`) để timer/request khác được chạy. Test kiểm tra: một `setTimeout(0)` đặt ngay sau khi gọi phải chạy **trước** khi tổng của mảng 2 triệu phần tử xong.

### ex10 · 🔮 nextTick, microtask, setImmediate (riêng Node)
Đọc `starter/ex10.js`, ghi 9 dòng output vào `answers/ex10.txt`.
