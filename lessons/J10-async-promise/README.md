# J10 · Async I: callback, Promise, event loop

Đọc khoảng 12 phút. Đây là module quan trọng nhất của Tier J: mọi request trong Node/Nest đều là code bất đồng bộ.

## Mục tiêu: sau buổi này bạn làm được
- Giải thích event loop: call stack, microtask queue, macrotask (timer) queue — đoán đúng thứ tự log.
- Đọc/viết Promise: 3 trạng thái, `then/catch/finally`, chaining, lỗi lan theo chuỗi.
- Chuyển API callback kiểu Node (`(err, result)`) sang Promise (promisify).
- Bọc event, timer thành Promise và **dọn dẹp** (listener, timer) đúng cách.
- Không chặn event loop khi xử lý dữ liệu lớn.

---

## 1. Một luồng, một call stack
JavaScript chạy **một luồng**: tại một thời điểm chỉ một đoạn code chạy. Việc chờ (mạng, đĩa, timer) được giao cho runtime; khi xong, **callback** được xếp vào hàng đợi, và event loop đưa nó lên call stack khi stack rỗng.

```
┌──────────── call stack (code đồng bộ đang chạy) ────────────┐
└──────────────────────────────────────────────────────────────┘
      ▲ stack rỗng → chạy HẾT microtask, rồi mới lấy 1 macrotask
┌── microtask queue ──┐   ┌── macrotask queue ──┐
│ Promise.then/catch  │   │ setTimeout, setInterval,│
│ queueMicrotask      │   │ setImmediate, I/O xong  │
│ (Node: nextTick     │   └─────────────────────────┘
│  còn ưu tiên hơn)   │
└─────────────────────┘
```
Quy tắc đoán thứ tự:
1. Code đồng bộ chạy hết trước (kể cả thân `new Promise(executor)` — executor chạy **ngay**).
2. Sau mỗi macrotask (và sau code đồng bộ ban đầu), **toàn bộ** microtask chạy — kể cả microtask mới sinh ra trong lúc đó.
3. Rồi mới tới macrotask tiếp theo (timer…).

```js
console.log(1);
setTimeout(() => console.log(4), 0);
Promise.resolve().then(() => console.log(3));
console.log(2);
// 1 2 3 4
```

## 2. Callback kiểu Node và "callback hell"
```js
fs.readFile(path, 'utf8', (err, data) => {   // error-first callback
  if (err) return handle(err);
  parse(data, (err2, obj) => { /* lồng tiếp... */ });
});
```
Vấn đề: lồng sâu, dễ quên xử lý `err`, dễ gọi callback 2 lần, không dùng được `try/catch`.

## 3. Promise
Một object đại diện cho kết quả **tương lai**: `pending` → `fulfilled` (có value) hoặc `rejected` (có reason). Đã settle thì **không đổi nữa** (gọi `resolve` lần 2 bị bỏ qua).
```js
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve(42), 100);
});
p.then((v) => v + 1)          // then trả về Promise MỚI → chaining
 .then((v) => fetchMore(v))   // trả về Promise → chuỗi đợi nó
 .catch((err) => fallback)    // bắt lỗi của MỌI bước phía trên
 .finally(() => cleanup());   // chạy dù thành công hay lỗi; giá trị đi xuyên qua
```
- Trong `then`: `return x` → bước sau nhận `x`; `return promise` → đợi; `throw` → nhảy tới `catch` gần nhất.
- `catch` trả về giá trị → chuỗi **trở lại** trạng thái thành công.
- Promise bị reject mà không ai `catch` → `unhandledRejection` → Node (từ v15) **dừng process**.

## 4. Promisify
```js
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
import { promisify } from 'node:util';
const readFileAsync = promisify(fs.readFile);   // hoặc dùng luôn 'node:fs/promises'
import { once } from 'node:events';
const [payload] = await once(emitter, 'ready');   // event → Promise
```

## 5. Dọn dẹp
Một Promise "chờ có giới hạn" (timeout) phải **clearTimeout** khi xong sớm; Promise chờ event phải **gỡ listener** trong mọi nhánh (thành công, lỗi, timeout). Quên → rò bộ nhớ, process không thoát.

## 6. Đừng chặn event loop
Vòng lặp đồng bộ 200ms trong một request = **mọi** request khác đứng 200ms (bạn đã thấy ở S00: RPS rơi từ 29 000 xuống 47). Việc CPU nặng: chia nhỏ và nhường (`setImmediate`) hoặc đẩy sang `worker_threads` (N06).

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| Quên `return` trong `then` | bước sau nhận `undefined`, không đợi promise bên trong |
| `.then(ok, fail)` thay vì `.catch` | `fail` không bắt lỗi ném từ `ok` |
| `new Promise(async (resolve) => ...)` | lỗi trong executor async không reject promise |
| Bọc promise có sẵn bằng `new Promise` (anti-pattern) | dễ quên reject; cứ `return` promise đó |
| Promise rơi lơ lửng không catch | crash process |

## Bên trong NestJS dùng cái này ở đâu
- Handler, service, repository đều trả Promise; Nest tự `await` kết quả của controller.
- Interceptor dùng RxJS Observable (C08) — một khái niệm cùng họ với Promise nhưng nhiều giá trị.
- Dedupe request đang bay (ex08) là kỹ thuật chống cache stampede (B07).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J10-async-promise NN`.
