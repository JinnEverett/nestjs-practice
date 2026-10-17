# N06 · Bài tập

Viết vào `answers/exNN.js` (ES module), chỉ dùng module có sẵn của Node.
Chấm: `bash lessons/check.sh lessons/N06-process 01`. Đáp án: `solutions/`.
Test **không gửi signal thật**: bài 04/08 nhận `process` giả (một `EventEmitter`) và hàm `exit` giả.

**Pass:** 7/8 bài + ex06 đo được lag, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · `loadEnv(text)` — parser `.env`
Trả object `{ KEY: 'value' }`.
- Bỏ dòng trống và dòng bắt đầu `#` (sau khi trim). Dòng không dạng `KEY=…` hoặc `KEY` sai ký tự (`[A-Za-z_][A-Za-z0-9_]*`) bị bỏ qua. Cho phép tiền tố `export `.
- Giá trị không có ngoặc: trim hai đầu; bỏ comment cuối dòng bắt đầu bằng khoảng trắng + `#` (`a=b # ghi chú` → `b`; `a=b#c` → `b#c`).
- `'…'`: nguyên văn, không xử lý escape. `"…"`: xử lý `\n`, `\t`, `\"`, `\\`; có thể **nhiều dòng** (khóa PEM). Sau dấu ngoặc đóng, phần còn lại của dòng (comment) bị bỏ. Dấu `"` mở mà không có đóng trên dòng đó → lấy phần còn lại của dòng.
- Hai ký tự `\r\n` coi như `\n`. Khóa lặp: lấy giá trị cuối. Giá trị rỗng `A=` → `''`. Dấu `=` trong giá trị được giữ (`URL=a=b` → `a=b`).

### ex02 · `readConfig(env, schema)` và `ConfigError`
`schema[KEY] = { type, required?, default?, min?, max?, values? }` với `type`: `string`, `int`, `bool`, `enum` (`values`), `url` (parse bằng `new URL`).
- Giá trị rỗng/thiếu → dùng `default` (nếu có), nếu không có mà `required` → lỗi.
- `int`: chuỗi `-?\d+` (sau trim), kiểm `min/max`. `bool`: `true|1|yes|on` → `true`, `false|0|no|off` → `false` (không phân biệt hoa thường). `enum`: phải thuộc `values`. `url`: hợp lệ.
- Trả object chỉ gồm khóa trong schema, đã ép kiểu. Khóa không có giá trị và không `default`, không `required` → khóa vắng (không đặt `undefined`).
- Có lỗi → ném `ConfigError` (extends Error) với `errors: [{ key, message }]` đủ **mọi** lỗi; `message` của ConfigError là `Invalid configuration: KEY1, KEY2`. **Không** được chứa giá trị của biến trong bất kỳ message nào.

### ex03 · `runMain(main, { exit, log })`
Chạy một hàm `main` (sync/async) rồi gọi `exit(code)` **đúng một lần** và trả Promise của `code`.
- Thành công → `0`. Ném lỗi (hoặc reject) → `log(err)` rồi code = `err.exitCode` nếu là số nguyên trong `1..255`, ngược lại `1`.
- Nếu `log` tự ném lỗi vẫn phải gọi `exit`. Ném giá trị không phải Error (`throw 'x'`) cũng được xử lý.
- Mặc định `exit = process.exit`, `log = console.error`.

---

## 🟡 Kết hợp

### ex04 · `createLifecycle({ timeoutMs })`
Quản lý tài nguyên để đóng theo thứ tự ngược.
- `register(name, closeFn)` (trả `lifecycle` để nối chuỗi). Đăng ký sau khi đã `shutdown` → ném `Error('Lifecycle already shutting down')`.
- `shutdown(reason)` → Promise của mảng `{ name, ok, ms, error? }` theo thứ tự **đóng** (ngược thứ tự đăng ký), đóng **tuần tự** (chờ xong cái này mới tới cái kế), `closeFn(reason)` có thể sync/async.
- Một `closeFn` ném lỗi hoặc vượt `timeoutMs` (mặc định 5000, mỗi tài nguyên) thì ghi `ok: false`, `error` (timeout: message `Timeout closing "<name>" after <ms>ms`) và **tiếp tục** đóng các cái còn lại; timer phải được dọn.
- Gọi `shutdown` nhiều lần trả **cùng một** Promise (đóng đúng một lần).

### ex05 · `runCommand(cmd, args, options)`
Bọc `child_process.spawn` (không shell). `options`: `{ timeoutMs = 0 (không giới hạn), input, maxBuffer = 1048576, cwd, env }`.
- Resolve `{ code, signal, stdout, stderr }` khi tiến trình con đóng (mã thoát ≠ 0 **vẫn resolve**).
- `input` (chuỗi) được ghi vào stdin rồi đóng stdin; không có `input` cũng phải đóng stdin để chương trình đọc stdin không treo.
- Lệnh không tồn tại → reject với lỗi `ENOENT` (`err.code`).
- Quá `timeoutMs` → gửi `SIGTERM`, sau 200ms vẫn sống thì `SIGKILL`; reject `Error` có `name = 'TimeoutError'` kèm `stdout`, `stderr` đã thu được.
- Output vượt `maxBuffer` byte (tổng stdout+stderr) → kill tiến trình, reject `RangeError`.
- Đối số có ký tự đặc biệt (`; echo hacked`, `$(…)`) phải được truyền nguyên văn tới chương trình.

### ex06 · `fibInWorker(n)` — CPU-bound ra khỏi main thread
Tính `fib(n)` bằng đệ quy ngây thơ (`fib(38)` mất ~0.3–1s) **trong `worker_threads`**.
- Trả Promise<number>. `n` không phải số nguyên 0..50 → reject `RangeError` mà không tạo worker.
- Trong lúc worker tính, event loop của main phải **không bị chặn** (test đo độ trễ timer 10ms).
- Có thể chạy nhiều lời gọi song song; worker được `terminate` sau khi xong (process con không treo).
- Có thể đặt code worker trong file riêng `answers/ex06-worker.js` hoặc dùng `new Worker(code, { eval: true })`.
- Làm xong, tự ghi vào `answers/ex06.md` số đo: thời gian `fib(38)` đồng bộ trên main vs trong worker và event loop lag (dùng `measureLag` ở N01) — test chỉ kiểm file có tồn tại.

---

## 🔴 Thực tế

### ex07 · `superviseChild(options)` — mini PM2
`options`: `{ cmd, args = [], maxRestarts = 3, backoffMs = 20, stableMs = 1000, onEvent }`. Chạy tiến trình con và giám sát:
- Con thoát với mã `0` → dừng giám sát: `done` resolve `{ reason: 'exited', starts }`.
- Con thoát ≠ 0 (hoặc bị signal) → restart sau `backoffMs * 2 ** (lầnLiênTiếp - 1)`. Đếm "lần crash liên tiếp"; con đã chạy ≥ `stableMs` trước khi crash thì reset bộ đếm này về 0 (coi như lần crash mới). Quá `maxRestarts` lần liên tiếp → `done` resolve `{ reason: 'max-restarts', starts }`.
- `stop()` → Promise: kill con (nếu đang chạy), không restart nữa, `done` resolve `{ reason: 'stopped', starts }`.
- Trả `{ stop, done }`. `starts` là tổng số lần đã khởi động. `onEvent({ type: 'start'|'exit'|'restart'|'give-up'|'stop', … })` gọi tại mỗi mốc (tùy bạn thêm field).
- Không chạy lệnh trong shell.

### ex08 · `installSignalHandlers(proc, lifecycle, options)`
`proc` là `process` (hoặc EventEmitter giả), `lifecycle` từ ex04 (hoặc object có `shutdown(reason)` trả Promise như ex04). `options`: `{ exit = process.exit, forceAfterMs = 10000, signals = ['SIGTERM','SIGINT'], log = console.error }`.
- Tín hiệu đầu tiên → `lifecycle.shutdown(signal)`; xong thì `exit(0)` nếu mọi tài nguyên `ok`, ngược lại `exit(1)`.
- Tín hiệu lần hai trong lúc đang shutdown → `exit(1)` ngay (người vận hành sốt ruột).
- Quá `forceAfterMs` mà shutdown chưa xong → `exit(1)`. Timer không được giữ process sống (`unref`) và phải hủy khi xong.
- `uncaughtException` / `unhandledRejection` → `log(err)`, chạy `shutdown(<tên sự kiện>)`, rồi `exit(1)` (kể cả khi shutdown báo OK).
- Trả `{ uninstall() }` gỡ mọi listener đã đăng ký. `exit` chỉ được gọi **một lần** dù có nhiều tín hiệu/ lỗi.

> 📏 Câu hỏi quy mô (không chấm): pod Kubernetes có `terminationGracePeriodSeconds: 30`, request dài nhất của bạn mất 8s, lifecycle đóng DB pool mất 2s. Chọn `forceAfterMs` và `timeoutMs` từng tài nguyên thế nào? Điều gì xảy ra với request đến đúng lúc rolling update nếu readiness probe chưa kịp báo "not ready"? (P02)
