# J03 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J03-functions-closure 01`. Đáp án: `solutions/` (mở sau khi qua test).

**Pass:** 8/10 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · `pipe`
`export function pipe(...fns)` trả về hàm `(x) => ...` áp dụng các hàm **từ trái sang phải**. `pipe()` không có hàm nào → trả về hàm identity.
```js
const slugify = pipe((s) => s.trim(), (s) => s.toLowerCase(), (s) => s.replaceAll(' ', '-'));
slugify('  Hello World ') // 'hello-world'
```

### ex02 · `once`
`export function once(fn)` trả về hàm chỉ gọi `fn` **lần thành công đầu tiên**; các lần sau trả lại đúng kết quả lần đầu (kể cả khi kết quả là `undefined`). Nếu lần gọi ném lỗi thì lỗi được ném ra và lần sau được thử lại. Giữ nguyên tham số và `this`.
```js
const init = once(() => { console.log('connect'); return 42; });
init(); init(); // in 'connect' một lần, cả hai trả 42
```

### ex03 · 🔮 Closure & tham số
Đọc `starter/ex03.js`, ghi 8 dòng output vào `answers/ex03.txt`.

---

## 🟡 Kết hợp

### ex04 · `memoize`
`export function memoize(fn, keyFn = (first) => first)` trả về hàm nhớ kết quả theo key `keyFn(...args)`.
- Kết quả "falsy" (`0`, `''`, `undefined`, `null`) cũng phải được nhớ.
- Key như `'__proto__'` hay `'toString'` phải hoạt động bình thường.
- Hàm trả về có thêm phương thức `clear()` xóa cache.
```js
const slowSquare = (n) => n * n;
const fast = memoize(slowSquare);
fast(4); fast(4); // slowSquare chỉ chạy 1 lần
const byPair = memoize((a, b) => a + b, (a, b) => `${a}:${b}`);
```

### ex05 · `debounce`
Ô tìm kiếm gọi API mỗi lần gõ phím. Viết `export function debounce(fn, ms)`:
- Trả về hàm `debounced(...args)`; `fn` chỉ được gọi **sau khi ngừng gọi `ms` mili giây**, với **tham số của lần gọi cuối cùng**.
- `debounced.cancel()` hủy lần gọi đang chờ.
Test dùng fake timer, không cần đợi thật.

### ex06 · `curry`
`export function curry(fn)` dựa vào `fn.length`: gom tham số qua nhiều lần gọi, đủ thì gọi `fn`.
```js
const add3 = (a, b, c) => a + b + c;
const c = curry(add3);
c(1)(2)(3)   // 6
c(1, 2)(3)   // 6
c(1)(2, 3)   // 6
const add1 = c(1); add1(2)(3); add1(10)(10) // 6, 21 — các nhánh không ảnh hưởng nhau
```

### ex07 · `withLogging` — bọc hàm có log
`export function withLogging(fn, logger)` trả về hàm bọc quanh `fn`:
- Gọi `fn` với **đúng tham số và `this`**, trả về đúng kết quả.
- Thành công: gọi `logger.info({ fn: fn.name, args, ms })` (`ms` là số mili giây ≥ 0).
- Lỗi: gọi `logger.error({ fn: fn.name, args, error })` rồi **ném lại đúng lỗi đó**.

---

## 🔴 Thực tế

### ex08 · Rate limiter theo user
API đăng nhập bị dò mật khẩu. Viết `export function createRateLimiter({ limit, windowMs, now = Date.now })` trả về `{ tryConsume(key), remaining(key) }`:
- Mỗi `key` (vd. IP) được tối đa `limit` lượt trong một cửa sổ `windowMs` tính **từ lượt đầu tiên của cửa sổ đó**. Hết cửa sổ thì đếm lại từ đầu.
- `tryConsume(key)` trả `true` nếu còn lượt (và trừ 1 lượt), `false` nếu hết.
- `remaining(key)` trả số lượt còn lại trong cửa sổ hiện tại (key mới → `limit`).
- Các key độc lập. `now` là hàm trả thời gian (ms) — test sẽ truyền đồng hồ giả.

### ex09 · Middleware pipeline
Viết `export function composeMiddleware(middlewares)` trả về hàm `run(ctx)`. Mỗi middleware có dạng `(ctx, next) => any`:
- `next()` gọi middleware kế tiếp và trả về kết quả của nó; middleware cuối gọi `next()` nhận `undefined`.
- `run(ctx)` trả về kết quả của middleware đầu tiên.
- Middleware có thể **không** gọi `next` (chặn lại, vd. auth fail).
- Gọi `next()` 2 lần trong cùng một middleware → `throw new Error('next() called multiple times')`.
```js
const run = composeMiddleware([
  (ctx, next) => { ctx.log.push('a1'); const r = next(); ctx.log.push('a2'); return r; },
  (ctx, next) => { ctx.log.push('b'); return 'done'; },
]);
const ctx = { log: [] };
run(ctx);   // 'done', ctx.log = ['a1', 'b', 'a2']
```

### ex10 · Memoize có giới hạn (LRU)
`memoize` ở ex04 trên server chạy lâu ngày làm RAM tăng mãi. Viết `export function memoizeLRU(fn, maxSize)`:
- Nhớ theo tham số đầu tiên, tối đa `maxSize` key.
- Khi đầy, bỏ key **lâu nhất không được dùng** (Least Recently Used). Đọc trúng cache cũng tính là "được dùng".
- Hàm trả về có getter `size` cho biết số key đang nhớ.
