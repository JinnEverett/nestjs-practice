# J11 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J11-async-await 01`. Đáp án: `solutions/`.

**Pass:** 8/10 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 async/await chạy thế nào
Đọc `starter/ex01.js`, ghi 11 dòng output vào `answers/ex01.txt`.

### ex02 · Tuần tự vs song song
- `fetchSequential(ids, fetchOne)`: gọi lần lượt từng id (đợi xong mới gọi cái sau), trả mảng kết quả.
- `fetchParallel(ids, fetchOne)`: gọi tất cả cùng lúc, trả mảng kết quả **đúng thứ tự `ids`**.
Lỗi ở bất kỳ id nào → reject.

### ex03 · `pLimit`
`pLimit(concurrency)` → hàm `limit(fn, ...args)` trả Promise kết quả của `fn(...args)`, nhưng **tối đa `concurrency` hàm chạy cùng lúc**; phần còn lại xếp hàng theo thứ tự gọi.
- `limit.activeCount`, `limit.pendingCount` (getter)
- `fn` ném lỗi (đồng bộ hoặc reject) → promise của lời gọi đó reject; hàng đợi vẫn chạy tiếp
- `concurrency` không phải số nguyên ≥ 1 → `RangeError`

---

## 🟡 Kết hợp

### ex04 · `mapWithConcurrency`
`mapWithConcurrency(items, mapper, concurrency)` → Promise mảng kết quả **theo thứ tự `items`**; `mapper(item, index)` trả Promise; tối đa `concurrency` mapper chạy cùng lúc.
Mapper nào reject → kết quả reject với lỗi đó và **không bắt đầu** thêm item mới (item đang chạy cứ để chạy xong).

### ex05 · Retry với exponential backoff
`retry(fn, options)` — `fn(attempt)` (attempt bắt đầu từ 1) trả Promise. Options:
- `retries = 3` (số lần thử LẠI; tổng tối đa `retries + 1` lần)
- `baseDelayMs = 100`, `factor = 2`, `maxDelayMs = Infinity` — chờ trước lần thử lại thứ k: `min(baseDelayMs × factor^(k−1), maxDelayMs)`
- `shouldRetry = (error, attempt) => true` — trả `false` → ném lỗi ngay
- `sleep = (ms) => Promise` (mặc định chờ thật; test truyền sleep giả để ghi lại các khoảng chờ)
Hết lượt → ném **lỗi của lần cuối**.

### ex06 · Timeout có hủy thật
`withAbortTimeout(task, ms)` — `task(signal)` trả Promise và (nếu tử tế) dừng việc khi `signal` bị abort.
- Xong trước `ms` → kết quả; clearTimeout.
- Quá `ms` → `signal` bị abort **và** promise trả về reject với lỗi có `name === 'TimeoutError'` — kể cả khi `task` phớt lờ `signal`.

### ex07 · 🐞 Thanh toán hàng loạt
`starter/ex07.js` dùng `forEach(async ...)` nên trả về trước khi thanh toán xong và mất lỗi. Viết lại `processOrders(orders, charge)`:
- Gọi `charge(order)` cho mọi đơn **song song**
- Đợi tất cả xong (kể cả khi có đơn lỗi) rồi trả `{ succeeded: [id…], failed: [{ id, reason }] }` theo thứ tự `orders` (`reason` là `error.message`)

---

## 🔴 Thực tế

### ex08 · Batcher (DataLoader mini)
`createBatcher(batchFn, { maxBatchSize = 100, maxWaitMs = 0 } = {})` → `{ load(key) }`:
- Các `load` gọi gần nhau được gom lại; batch được gửi khi đủ `maxBatchSize` key **hoặc** sau `maxWaitMs` (đếm từ key đầu tiên của batch)
- `batchFn(keys)` → Promise mảng kết quả **cùng thứ tự** `keys`
- Key trùng trong cùng batch chỉ gửi một lần, mọi caller nhận cùng kết quả
- Phần tử kết quả là `Error` → `load` tương ứng reject với lỗi đó; `batchFn` reject → mọi `load` trong batch reject; độ dài mảng kết quả sai → mọi `load` reject

### ex09 · Theo dõi việc đang chạy (cho graceful shutdown)
`createInflightTracker()` → `{ track(promise), size, drain(timeoutMs) }`:
- `track(p)` trả lại chính `p`; trong lúc `p` chưa settle thì nó được đếm trong `size`
- `drain(timeoutMs)` → resolve khi **mọi** promise đang theo dõi đã settle (kể cả cái được `track` thêm trong lúc đang drain; lỗi của chúng không làm drain lỗi); quá `timeoutMs` → reject lỗi `name === 'TimeoutError'`

### ex10 · 🔮 Promise combinators
Đọc `starter/ex10.js`, ghi 9 dòng output vào `answers/ex10.txt`.
