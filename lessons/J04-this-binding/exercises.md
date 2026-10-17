# J04 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J04-this-binding 01`. Đáp án: `solutions/` (mở sau khi qua test).

**Pass:** 6/8 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 Bốn quy tắc của `this`
Đọc `starter/ex01.js`, ghi 11 dòng output vào `answers/ex01.txt` (`show` in tên lỗi nếu có lỗi).

### ex02 · 🐞 Counter mất `this`
`starter/ex02.js` có class `Counter` bị lỗi khi dùng `forEach(this.add)` và khi tách method ra. Viết lại `export class Counter` vào `answers/ex02.js`:
- `total` bắt đầu từ 0
- `add(n)` cộng `n` vào `total`, trả về `this` (để gọi nối `c.add(1).add(2)`)
- `addAll(nums)` cộng mọi số trong mảng, trả về `this`
- `const { add } = counter; add(5)` vẫn cộng vào đúng `counter`
- Hai instance độc lập.

### ex03 · `bindAll`
`export function bindAll(obj, ...methodNames)` gắn cứng `this = obj` cho các method được liệt kê (ghi đè lên chính `obj`), trả về `obj`. Tên nào không phải function → `throw new TypeError(...)`.
```js
const svc = bindAll({ n: 1, get() { return this.n; } }, 'get');
const { get } = svc; get(); // 1
```

---

## 🟡 Kết hợp

### ex04 · Tự viết `bind`
`export function myBind(fn, thisArg, ...preset)` — **không dùng** `Function.prototype.bind`. Trả về hàm gọi `fn` với `this = thisArg` và tham số = `preset` nối với tham số lúc gọi. (Không cần hỗ trợ `new`.)
```js
function greet(g, mark) { return `${g}, ${this.name}${mark}`; }
myBind(greet, { name: 'An' }, 'Chào')('!') // 'Chào, An!'
```

### ex05 · Gọi method theo đường dẫn
Hệ thống plugin lưu tên action dạng chuỗi. Viết `export function invokeMethod(root, path, ...args)`:
- `path` dạng `'services.mailer.send'` — đi theo từng phần tới method cuối, gọi nó với `args` và `this` là **object chứa method** (ở ví dụ: `root.services.mailer`).
- Không tồn tại tầng nào / phần cuối không phải function → `throw new TypeError` có nhắc `path`.

### ex06 · 🐞 Service đăng ký event handler
`starter/ex06.js`: `OrderService` đăng ký `this.handleOrderCreated` với emitter, khi event bắn ra thì lỗi `Cannot read properties of undefined (reading 'notifier')`. Viết lại `export class OrderService` vào `answers/ex06.js`:
- `constructor(emitter, notifier)`: lưu `notifier`, đăng ký handler cho event `'order.created'` qua `emitter.on(event, handler)`
- `handleOrderCreated(order)`: gọi `this.notifier.send(\`Đơn ${order.id} đã tạo\`)`
- `dispose()`: hủy đăng ký bằng `emitter.off('order.created', handler)` — phải truyền **đúng hàm đã đăng ký**.

### ex07 · 🔮 Arrow vs function trong class
Đọc `starter/ex07.js`, ghi 8 dòng output vào `answers/ex07.txt`.

---

## 🔴 Thực tế

### ex08 · Đo thời gian mọi method của service
Viết `export function instrumentMethods(instance, methodNames, onCall)`: thay từng method được liệt kê **trên chính instance** bằng wrapper:
- Trước khi chạy: gọi `onCall(name, args)`
- Gọi method gốc với **đúng `this`** (method gốc có thể gọi `this.otherMethod()` và đọc field), trả nguyên kết quả
- Method nằm trên prototype của class cũng phải bọc được
- Trả về `instance`
```js
class PriceService { rate = 1.1; withTax(x) { return Math.round(x * this.rate); } }
const s = instrumentMethods(new PriceService(), ['withTax'], (name, args) => console.log(name, args));
s.withTax(100); // log 'withTax' [100], trả 110
```
