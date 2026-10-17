# N01 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/N01-event-loop 01`. Đáp án: `solutions/`.

**Pass:** 8/8 bài (7/8 nếu 🔮 đúng ≥ 2/3), dùng ≤ 2 hint. Có thí nghiệm đo lag (ex03).

---

## 🟢 Cơ bản

### ex01 · 🔮 nextTick vs microtask trong ES module
Đọc `starter/ex01.js`, ghi output (mỗi dòng một mục, theo thứ tự) vào `answers/ex01.txt`. Chú ý: file này là **ES module**.

### ex02 · 🔮 `setTimeout` vs `setImmediate` trong callback I/O
Đọc `starter/ex02.js`, ghi output vào `answers/ex02.txt`.

### ex03 · `measureLag(work)`
`export async function measureLag(work)`: đo độ trễ event loop trong lúc `work` chạy.
- `work` là hàm (sync hoặc async). Dùng `monitorEventLoopDelay({ resolution: 10 })`.
- Trả `{ maxMs, p99Ms }` (đơn vị ms, làm tròn xuống số nguyên không cần).
- Bật monitor trước khi gọi `work`, **tắt (`disable`) sau khi `work` xong hoặc ném lỗi**; lỗi của `work` phải được ném lại.
- Bẫy: nếu `work` là đoạn đồng bộ chặn 120ms rồi trả về ngay, đọc `max` liền sau đó có thể ra 0 hoặc nhỏ hơn thực tế rất nhiều. Vì sao? (Test có case này.)

---

## 🟡 Kết hợp

### ex04 · `mapInChunks(items, fn, { budgetMs })`
Xử lý mảng lớn bằng hàm **đồng bộ** `fn` mà không làm đói event loop.
- Trả Promise của mảng kết quả `items.map(fn)` (cùng thứ tự).
- Sau mỗi phần tử, nếu đã chạy liên tục ≥ `budgetMs` (mặc định 8) kể từ lần nhường gần nhất → nhường loop bằng `setImmediate` rồi chạy tiếp.
- `fn` ném lỗi → reject ngay với lỗi đó, không xử lý tiếp.
- Không mutate `items`.

### ex05 · Thí nghiệm thread pool
`export async function benchPbkdf2(counts)`: với mỗi `n` trong `counts` (vd. `[1, 4, 8]`), chạy `n` lần `crypto.pbkdf2` (async, `sha512`, 100000 vòng, salt cố định) **song song**, đo thời gian đến khi xong hết.
Trả `[{ n, ms }]` theo đúng thứ tự `counts`. Sau khi chạy, tự ghi nhận xét vào `answers/ex05.md`: vì sao `n=8` lâu hơn `n=4` dù máy có nhiều core? (test chỉ kiểm file tồn tại, không rỗng, và có chứa từ "thread pool" hoặc "UV_THREADPOOL_SIZE").

### ex06 · `runJobs(jobs, { batch })`
`jobs`: mảng hàm **đồng bộ** không tham số. Chạy lần lượt từng job, sau mỗi `batch` job (mặc định 100) thì nhường loop bằng `setImmediate`.
- Trả Promise resolve khi xong tất cả (giá trị: số job đã chạy).
- Một job ném lỗi → reject với lỗi đó và **không chạy job sau nó**.
- Với 20 000 job, một `setTimeout(…, 0)` đặt trước đó phải chạy được **trước khi** job cuối kết thúc.

---

## 🔴 Thực tế

### ex07 · `createLoopMonitor()` — nền cho `/_debug/loop`
Nest app cần endpoint báo event loop lag. Viết `export function createLoopMonitor({ resolution = 10 } = {})` trả object:
- `snapshot()` → `{ maxMs, p99Ms, meanMs }` (số, đơn vị ms) tính từ lúc bắt đầu hoặc `reset()` gần nhất.
- `reset()` xóa histogram.
- `stop()` tắt monitor; sau `stop` gọi `snapshot()` vẫn không ném lỗi.
- Tạo xong là bật ngay. Không giữ process sống (không để timer treo — test kiểm bằng việc process con thoát được).

### ex08 · 🔮 Thứ tự trong `async` + `nextTick` + `setImmediate`
Đọc `starter/ex08.cjs` (lần này là **CommonJS**, khác ex01), ghi output vào `answers/ex08.txt`.

> 📏 Câu hỏi quy mô (không chấm): một endpoint chạy vòng `for` đồng bộ 50ms. Ở 100 connection, ước lượng RPS tối đa của **cả server** và p99. Kiểm chứng ở S00 bằng `bench/hello-server.js` (route chặn 20ms).
