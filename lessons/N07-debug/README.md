# N07 · Debug, lỗi toàn cục, log có cấu trúc

Đọc khoảng 10 phút. Khi production báo lỗi bạn không có debugger — chỉ có **log, stack trace và số đo**. Module này luyện cả hai: dùng debugger khi dev, và viết log/xử lý lỗi để dễ chẩn đoán khi chạy thật.

## Mục tiêu: sau buổi này bạn làm được
- Debug bằng VS Code / `--inspect`: breakpoint, logpoint, conditional breakpoint, step trong code async.
- Đọc stack trace và `error.cause`; biết lỗi nào làm process chết (`unhandledRejection`, `uncaughtException`) và vì sao.
- Viết logger JSON có cấu trúc: level, child logger, redact secret, serialize lỗi, gắn `requestId` bằng `AsyncLocalStorage`.
- Nhận ra triệu chứng: rò bộ nhớ, event loop bị chặn, race condition, pool cạn — và chẩn đoán từ số liệu.

---

## 1. Debugger
```jsonc
// .vscode/launch.json
{ "type": "node", "request": "launch", "name": "Debug file",
  "program": "${file}", "skipFiles": ["<node_internals>/**"] }
```
- `node --inspect-brk file.js` rồi mở `chrome://inspect` hoặc attach từ VS Code. Với Nest: `nest start --debug --watch`.
- **Logpoint** (chuột phải số dòng → Add Logpoint): in giá trị mà không sửa code, không commit nhầm `console.log`.
- **Conditional breakpoint**: `order.id === 4242` để dừng đúng request lỗi trong vòng lặp.
- Call stack của code async hiển thị "Async Call Stack" — nhìn thấy `await` nào dẫn tới đây.
- Source map phải bật (`sourceMap: true`) thì breakpoint mới nằm đúng ở `.ts`.

## 2. Lỗi toàn cục
- Promise bị reject mà không ai bắt → Node ≥ 15: sự kiện `unhandledRejection`; **không có listener thì process chết với exit code 1**. Đừng "nuốt" bằng listener rỗng; dùng nó để **log + shutdown có kiểm soát** (N06).
- Exception ném ra ngoài mọi `try/catch` → `uncaughtException`. Trạng thái process sau đó **không đáng tin** (đang giữa chừng một phép ghi?) → log rồi thoát, để orchestrator restart. Không "tiếp tục như không có gì".
- `process.exitCode = n` đặt mã thoát nhưng cho loop chạy nốt; `process.exit(n)` thoát ngay. Sự kiện `exit` chỉ chạy được code **đồng bộ**; `beforeExit` có thể lên lịch thêm việc.
- `new Error('msg', { cause })` giữ nguyên lỗi gốc; luôn bọc lỗi cấp thấp (DB) bằng lỗi nghiệp vụ **kèm `cause`**, đừng mất stack gốc.

## 3. Log có cấu trúc
Log một dòng JSON, máy đọc được (Loki/ELK/CloudWatch lọc theo `requestId`, `level`):
```json
{"level":"error","time":"2026-10-17T08:00:00.000Z","msg":"payment failed","requestId":"a1b2","orderId":42,"err":{"type":"Error","message":"card declined","stack":"…"}}
```
- Level: `trace < debug < info < warn < error < fatal`; production thường `info`.
- Không log secret: redact `password`, `token`, `authorization`, `cookie`…
- `AsyncLocalStorage` giữ "ngữ cảnh request" xuyên `await`/timer mà không phải truyền tham số qua mọi hàm:
```js
import { AsyncLocalStorage } from 'node:async_hooks';
const als = new AsyncLocalStorage();
als.run({ requestId: 'a1' }, async () => { await db.query(); log('xong'); /* als.getStore().requestId vẫn là 'a1' */ });
```
- `console.log` là đồng bộ khi ghi ra terminal/pipe — log quá nhiều có thể làm chậm cả loop.

## 4. Bốn kiểu sự cố hay gặp
| Triệu chứng | Nguyên nhân thường gặp | Bằng chứng |
|---|---|---|
| RAM tăng đều, OOM sau vài giờ | listener không gỡ, cache/Map không giới hạn, closure giữ object | heap tăng tuyến tính; 3 heap snapshot so sánh |
| Mọi endpoint chậm cùng lúc | code đồng bộ nặng chặn loop | event loop lag vọt, CPU 100% 1 core |
| Timeout hàng loạt khi tải tăng | pool DB nhỏ → hàng đợi | `waiting` > 0, CPU thấp |
| Chậm nhưng CPU thấp | dịch vụ bên ngoài chậm, không timeout | thời gian upstream dài |
| Số liệu sai thỉnh thoảng | race condition (check-then-act qua `await`) | chỉ lỗi khi đồng thời |

**Heap snapshot (3 snapshot technique):** `v8.writeHeapSnapshot()` (hoặc DevTools → Memory) lúc đầu, sau khi chạy tải, sau lần chạy tải nữa; so sánh "Objects allocated between Snapshot 1 and 2": thứ tăng mãi là kẻ rò.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| `array.forEach(async …)` | không chờ, lỗi thành unhandled | `for…of` + `await` hoặc `Promise.all` |
| Check-then-act qua `await` | oversell tồn kho | khóa theo key / UPDATE nguyên tử (B05, R08) |
| Listener `on()` trong vòng lặp request | rò + `MaxListenersExceededWarning` | gỡ listener, `once` |
| `catch (e) {}` rỗng | mất dấu vết | log + ném lại/ bọc `cause` |
| Log object chứa request đầy đủ | lộ token, log phình | chọn field, redact |

## Bên trong Nest dùng cái này ở đâu
- `Logger` của Nest và `nestjs-pino` (P01); `nestjs-cls` dùng `AsyncLocalStorage` (B05, P01, R06).
- `ExceptionFilter` mặc định biến lỗi thành 500; lỗi không bắt ở ngoài request (queue worker, cron) mới tới `uncaughtException`.
- `Terminus`/metrics (P02, P08) cung cấp đúng các con số trong bảng chẩn đoán.
