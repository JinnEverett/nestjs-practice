# N01 · Event loop của Node

Đọc khoảng 12 phút. J10 dạy event loop ở mức "microtask vs timer". Bài này đi sâu vào **Node**: các phase của libuv, `nextTick`/`setImmediate`, thread pool, và quan trọng nhất: **một dòng code đồng bộ nặng chặn mọi request** — lý do số 1 khiến API Nest "đúng nhưng sập khi có tải".

## Mục tiêu: sau buổi này bạn làm được
- Kể đúng thứ tự các phase của event loop và đoán thứ tự `nextTick` / microtask / `setTimeout` / `setImmediate`.
- Biết việc nào chạy trên thread pool của libuv (`crypto`, `fs`, `dns.lookup`, `zlib`) và việc nào không (mạng, timer).
- **Đo** độ trễ event loop bằng `perf_hooks.monitorEventLoopDelay`.
- Chia nhỏ việc nặng để không làm đói event loop.

---

## 1. Các phase
```
   ┌───────────────────────────┐
┌─▶│ timers      setTimeout/setInterval đến hạn │
│  ├───────────────────────────┤
│  │ pending callbacks (lỗi TCP...)             │
│  ├───────────────────────────┤
│  │ poll        I/O xong → callback; chờ I/O   │
│  ├───────────────────────────┤
│  │ check       setImmediate                   │
│  ├───────────────────────────┤
│  │ close       'close' của socket...          │
│  └───────────────────────────┘
   Giữa MỌI callback: process.nextTick queue → rồi microtask (Promise) queue
```
- `process.nextTick(fn)`: chạy **ngay sau thao tác hiện tại**, trước cả microtask Promise (trong CommonJS). Gọi đệ quy `nextTick` thì loop **không bao giờ** sang phase tiếp theo → đói timer/I/O.
- `setImmediate(fn)`: chạy ở phase `check`, ngay sau poll. Đây là cách "nhường" loop đúng chuẩn.
- `setTimeout(fn, 0)` thực ra là 1ms. Gọi từ module chính, thứ tự với `setImmediate` **không xác định**; gọi **trong callback I/O** thì `setImmediate` luôn trước.

```js
import { readFile } from 'node:fs';
readFile(import.meta.filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
// immediate, timeout (luôn luôn — vì đang ở phase poll, kế tiếp là check)
```
Bẫy ESM: trong **ES module**, code top-level chạy bên trong một promise job nên microtask (`Promise.then`) chạy **trước** `nextTick`. Trong CommonJS thì ngược lại.

## 2. Thread pool của libuv
Node chạy JS trên **một thread**, nhưng một số API chạy nền trên pool mặc định **4 thread** (`UV_THREADPOOL_SIZE`): `fs.*`, `crypto.pbkdf2/scrypt/randomBytes`, `zlib`, `dns.lookup`. Mạng (socket) dùng epoll/IOCP, không dùng pool.
Hệ quả: 8 lần `pbkdf2` song song không nhanh gấp 8 — chúng xếp hàng sau 4 thread. Hash password trong Nest (argon2/bcrypt) cũng đi qua pool này; nếu pool đầy, `fs.readFile` cũng bị chậm theo.

## 3. Chặn event loop
```js
app.get('/report', () => {
  let s = 0;
  for (let i = 0; i < 5e9; i++) s += i;   // 3 giây đồng bộ
  return s;
});
```
Trong 3 giây đó **không request nào khác** được xử lý (kể cả `/health`). Với 100 connection: p99 ≈ thời gian chặn × số request xếp hàng. Triệu chứng: CPU 100% trên 1 core, RPS thấp, p99 vọt.
Cách xử lý, theo thứ tự ưu tiên: (1) đừng làm việc đó trong request (queue/worker — P03, N06); (2) dùng API async/stream; (3) chia nhỏ rồi `setImmediate` giữa các phần; (4) `worker_threads` cho CPU-bound.

## 4. Đo độ trễ event loop
```js
import { monitorEventLoopDelay } from 'node:perf_hooks';
const h = monitorEventLoopDelay({ resolution: 10 });  // lấy mẫu mỗi 10ms
h.enable();
// ... chạy việc ...
console.log(h.max / 1e6, 'ms');   // histogram tính bằng nanosecond
console.log(h.percentile(99) / 1e6);
h.disable();
```
`resolution: 10` nghĩa là timer 10ms; nếu loop bị chặn 120ms thì mẫu đo sẽ ≈ 120ms. Số này là "event loop lag" trong bảng `bench` (cột lấy từ `/_debug/loop` ở P05).

## Bẫy hay gặp
| Bẫy | Sai | Đúng |
|---|---|---|
| Đệ quy `nextTick` | `const f = () => process.nextTick(f)` làm timer không bao giờ chạy | `setImmediate(f)` |
| `*Sync` trong handler | `fs.readFileSync` trong request | `await fs.promises.readFile` |
| `JSON.parse/stringify` payload hàng chục MB | chặn vài trăm ms | stream / phân trang |
| Tin `setTimeout(fn, 0)` chạy ngay | thứ tự với `setImmediate` ở main là ngẫu nhiên | đừng dựa vào nó |
| Hash đồng bộ | `pbkdf2Sync`, `bcrypt.hashSync` | bản async (chạy trên pool) |

## Bên trong Nest dùng cái này ở đâu
- Một Nest app là **một event loop duy nhất** phục vụ mọi controller. Guard/pipe/interceptor đồng bộ nặng = chặn tất cả.
- `/_debug/loop` ở P05 chính là `monitorEventLoopDelay` bọc vào một controller.
- Graceful shutdown (P02) dựa vào việc loop còn việc để làm hay không (handle còn mở).
