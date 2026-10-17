# J03 · Hàm & closure

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Chọn đúng giữa function declaration, function expression và arrow function.
- Dùng default params, rest params, destructuring tham số.
- Coi hàm là giá trị: truyền vào, trả ra (higher-order function).
- Giải thích closure và dùng nó để giữ state riêng tư: `once`, `memoize`, `debounce`, rate limiter.
- Viết được "wrapper" bọc quanh một hàm khác — chính là ý tưởng của middleware và interceptor trong NestJS.

---

## 1. Ba cách tạo hàm
```js
function add(a, b) { return a + b; }          // declaration: hoist cả thân, có `this` động
const sub = function (a, b) { return a - b; }; // expression
const mul = (a, b) => a * b;                   // arrow: ngắn, KHÔNG có `this`/`arguments` riêng (J04)
```
- Arrow trả object phải bọc ngoặc: `() => ({ ok: true })`.
- Hàm là **giá trị**: gán vào biến, đặt trong mảng/object, truyền làm tham số, trả về từ hàm khác.

## 2. Tham số
```js
function createUser({ name, role = 'user' } = {}, ...tags) {
  // destructuring + default + rest
}
greet(undefined, 'Hi');  // undefined → kích hoạt default; null thì KHÔNG
```
- Default được tính **mỗi lần gọi**, và có thể dùng tham số đứng trước: `(name, msg = \`Chào ${name}\`)`.
- `fn.length` = số tham số **trước** tham số đầu tiên có default/rest.

## 3. Closure
Hàm "nhớ" các biến của scope nơi nó được **tạo ra** (lexical scope), kể cả khi scope đó đã chạy xong.
```js
function makeCounter() {
  let count = 0;                 // không ai bên ngoài chạm vào được
  return () => ++count;
}
const c1 = makeCounter();
c1(); c1();                      // 2
const c2 = makeCounter();        // count riêng → c2() là 1
```
- Closure giữ **biến**, không chụp giá trị: biến đổi sau đó thì closure thấy giá trị mới.
- Mỗi lần gọi hàm ngoài tạo một bộ biến mới → mỗi closure có state riêng.
- Closure giữ biến sống trong bộ nhớ → cache trong closure mà không giới hạn = **memory leak** (ex10, P06).

## 4. Higher-order function & wrapper
```js
const withTiming = (fn) => (...args) => {
  const start = performance.now();
  try {
    return fn(...args);
  } finally {
    console.log(`${fn.name} ${performance.now() - start}ms`);
  }
};
```
Đây là khuôn mẫu của: middleware Express (N05), interceptor Nest (C08), decorator (T06).

## 5. Timer cơ bản
`setTimeout(fn, ms)` hẹn gọi `fn` sau ít nhất `ms`; trả về id để `clearTimeout(id)`. Debounce = mỗi lần gọi lại thì hủy hẹn cũ, hẹn mới.

## Bẫy hay gặp
| Bẫy | Ví dụ | Cách tránh |
|---|---|---|
| Cache bằng `if (cache[key])` | kết quả `0`, `''`, `undefined` bị tính lại | `Map` + `cache.has(key)` |
| Cache object thường với key từ input | `'__proto__'`, `'toString'` | `Map` |
| Cache không giới hạn | RAM tăng mãi | giới hạn kích thước (LRU) hoặc TTL |
| Wrapper làm mất `this` | `fn(...args)` | `fn.apply(this, args)` trong `function` thường |
| Wrapper nuốt lỗi | `catch {}` không ném lại | log rồi `throw` lại |

## Bên trong NestJS dùng cái này ở đâu
- `useFactory: (config) => new Client(config.url)` (C03) là một hàm tạo instance — closure giữ dependency.
- Middleware `(req, res, next)` (N05, C07) và interceptor (C08) là wrapper quanh handler — ex07, ex09.
- `@nestjs/throttler` (A06) là rate limiter (ex08) có store dùng chung.

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J03-functions-closure NN`.
