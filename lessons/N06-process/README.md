# N06 · Process, cấu hình, signal và concurrency

Đọc khoảng 10 phút. Một API chạy tốt trên máy bạn nhưng deploy lên Docker/Kubernetes còn cần: đọc cấu hình đúng, **thoát có kiểm soát** khi nhận `SIGTERM`, và không để việc nặng chặn event loop.

## Mục tiêu: sau buổi này bạn làm được
- Đọc cấu hình từ `process.env` / `.env`, kiểm tra ngay lúc khởi động và **fail fast** khi sai.
- Dùng đúng exit code, bắt `SIGTERM`/`SIGINT`, đóng tài nguyên theo thứ tự ngược (graceful shutdown).
- Chạy chương trình con (`child_process`) an toàn: không shell injection, có timeout, giới hạn output.
- Đẩy việc CPU-bound sang `worker_threads`, tự giám sát tiến trình con và restart có backoff.

---

## 1. Cấu hình qua môi trường
`process.env` chỉ chứa **chuỗi** (hoặc `undefined`). `PORT=3000` là `"3000"`; `DEBUG=false` là `"false"` — chuỗi khác rỗng nên **truthy**!
```js
const debug = process.env.DEBUG === 'true';          // đúng
if (process.env.DEBUG) {}                            // sai: "false" cũng vào
const port = Number(process.env.PORT ?? 3000);       // NaN nếu PORT="abc" → phải kiểm tra
```
Quy tắc "12-factor": cấu hình khác nhau giữa môi trường nằm trong env, không nằm trong code; secrets không commit (`.env` nằm trong `.gitignore`, có `.env.example`). Node 20.6+ có `node --env-file=.env app.js`; Nest dùng `@nestjs/config` (C09).
**Fail fast:** thiếu `DATABASE_URL` thì thoát ngay lúc khởi động với thông báo rõ, đừng chờ tới request đầu tiên. Thông báo lỗi nêu **tên** biến, không in **giá trị** (secret).

## 2. Exit code và signal
- Exit code `0` = thành công; khác 0 = lỗi (`1` chung; Kubernetes/PM2/systemd dựa vào đây để biết có cần restart).
- `process.exit(code)` thoát **ngay**, bỏ dở mọi thứ đang chờ; ưu tiên đặt `process.exitCode` rồi để loop tự cạn, hoặc dọn dẹp xong mới gọi `exit`.
- `SIGTERM` là lời "xin dừng" của orchestrator (Docker stop, K8s rolling update), sau ~10–30s mà chưa thoát thì bị `SIGKILL` (không bắt được). `SIGINT` là Ctrl+C.
- Graceful shutdown: ngừng nhận việc mới → chờ việc đang chạy → đóng tài nguyên **theo thứ tự ngược lúc khởi tạo** (HTTP server → worker/queue → DB pool) → exit 0. Có timeout tổng; nhận tín hiệu lần hai thì thoát cứng.
- Windows không có signal POSIX đầy đủ (chỉ `SIGINT`, `SIGBREAK`, `SIGTERM` giả lập khi đóng cửa sổ); thiết kế để test không phụ thuộc việc gửi signal thật (tiêm `process` giả — `EventEmitter`).

## 3. `child_process`
```js
import { spawn } from 'node:child_process';
const child = spawn('git', ['log', '--oneline'], { stdio: ['ignore', 'pipe', 'pipe'] });  // KHÔNG dùng shell
```
- `spawn(cmd, args)` + mảng đối số: không qua shell → không bị injection (`;`, `$(…)`). `exec()` gom output vào chuỗi và dùng shell: tránh với input của người dùng.
- Luôn xử lý `'error'` (lệnh không tồn tại → `ENOENT`), giới hạn kích thước output, đặt timeout rồi `kill('SIGTERM')` → sau một lúc `SIGKILL`.

## 4. `worker_threads`
Event loop chỉ một thread (N01). Việc CPU-bound (nén ảnh, hash nhiều, tính toán lớn) chạy trong **worker**: thread riêng, V8 riêng, giao tiếp bằng `postMessage` (copy/transfer). Worker không chia sẻ biến với main; chi phí khởi tạo ~vài chục ms nên dùng pool cho tải thường xuyên.
```js
import { Worker } from 'node:worker_threads';
const w = new Worker(new URL('./job.js', import.meta.url), { workerData: { n: 40 } });
w.once('message', (r) => console.log(r));
```
`cluster` / nhiều process: tận dụng nhiều core cho I/O-bound (mỗi process một event loop); trong container thường để orchestrator chạy nhiều replica thay vì `cluster`.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| `if (process.env.FLAG)` với `"false"` | luôn bật | so sánh chuỗi |
| `Number(env.PORT)` không kiểm tra | `NaN` → listen cổng lạ | validate |
| `process.exit()` ngay khi nhận SIGTERM | mất request, rò kết nối | graceful |
| Không bắt `'error'` của child | crash cả app | `child.on('error')` |
| `exec(\`convert ${userInput}\`)` | shell injection | `spawn` + mảng |
| Chạy việc nặng trong handler | chặn mọi request | worker/queue |
| In nguyên config khi lỗi | lộ secret trong log | chỉ in tên biến |

## Bên trong Nest dùng cái này ở đâu
- `@nestjs/config` (C09) = `loadEnv` + `readConfig`; `app.enableShutdownHooks()` + `onApplicationShutdown` (C10, P02) = `createLifecycle` + `installSignalHandlers`.
- Dockerfile/Kubernetes (P07): `CMD ["node","dist/main.js"]` (không qua shell/npm để `SIGTERM` tới đúng process); `terminationGracePeriodSeconds` = timeout tổng của shutdown.
- BullMQ worker, xử lý ảnh, sinh PDF: process/worker riêng để API không bị chặn.
