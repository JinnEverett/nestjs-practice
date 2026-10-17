# J04 · `this` & ngữ cảnh gọi

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Xác định `this` của một lời gọi bằng 4 quy tắc (+ arrow function).
- Dùng `call`, `apply`, `bind` đúng chỗ.
- Sửa bug "mất `this`" khi truyền method làm callback — lỗi rất hay gặp khi dùng class/service.
- Viết wrapper giữ nguyên `this` của hàm gốc.

---

## 1. `this` được quyết định lúc GỌI, không phải lúc viết
| Cách gọi | `this` là |
|---|---|
| `obj.method()` | `obj` (object đứng trước dấu chấm) |
| `fn()` gọi trần | `undefined` (strict mode / module / class) |
| `fn.call(ctx, a, b)` / `fn.apply(ctx, [a, b])` | `ctx` |
| `const g = fn.bind(ctx)` → `g()` | `ctx`, **vĩnh viễn** (bind lần nữa / call không đổi được) |
| `new Fn()` | object mới được tạo |
| arrow function | **không có `this` riêng** — dùng `this` của scope bao quanh lúc arrow được tạo |

```js
const user = { name: 'An', hi() { return this.name; } };
user.hi();                 // 'An'
const hi = user.hi;        // tách method ra khỏi object
hi();                      // TypeError: Cannot read properties of undefined (reading 'name')
```

## 2. Mất `this` khi truyền method làm callback
```js
class Counter {
  total = 0;
  add(n) { this.total += n; }
}
const c = new Counter();
[1, 2, 3].forEach(c.add);          // ❌ TypeError — forEach gọi trần add(n)
[1, 2, 3].forEach((n) => c.add(n)); // ✅ gọi qua object
[1, 2, 3].forEach(c.add, c);        // ✅ thisArg của forEach/map/filter
```
Cách làm method "tách ra vẫn chạy":
```js
class Counter {
  total = 0;
  add = (n) => { this.total += n; };   // arrow class field: this = instance, mãi mãi
}
// hoặc trong constructor: this.add = this.add.bind(this);
```
Đánh đổi: arrow field tạo **một hàm mới cho mỗi instance** (không nằm trên prototype), không override được bằng `super.add()`.

## 3. Arrow function trong method
```js
class Timer {
  label = 'timer';
  run() {
    return [1].map(function () { return this; });   // [undefined] — function thường gọi trần
  }
  run2() {
    return [1].map(() => this.label);               // ['timer'] — arrow lấy this của run2
  }
}
```
Quy tắc thực dụng: **method** của object/class viết bằng cú pháp method thường; **callback** bên trong method viết bằng arrow.

## 4. `call` / `apply` / `bind`
```js
function greet(greeting, mark) { return `${greeting}, ${this.name}${mark}`; }
greet.call({ name: 'An' }, 'Chào', '!');
greet.apply({ name: 'An' }, ['Chào', '!']);
const greetAn = greet.bind({ name: 'An' }, 'Chào');   // bind kèm tham số sẵn (partial)
greetAn('?');                                          // 'Chào, An?'
```
Wrapper giữ `this`: viết bằng `function` thường và gọi `fn.apply(this, args)`.

## Bẫy hay gặp
| Bẫy | Sai | Đúng |
|---|---|---|
| Truyền method làm callback | `emitter.on('x', this.handle)` | `emitter.on('x', (e) => this.handle(e))` |
| Arrow làm method của object literal | `{ hi: () => this.name }` | `{ hi() { return this.name; } }` |
| `function` thường làm callback trong method | `arr.map(function () { this.x })` | `arr.map(() => this.x)` |
| Destructure method | `const { save } = repo; save()` | `repo.save()` |
| Wrapper bằng arrow | `(...a) => fn(...a)` | `function (...a) { return fn.apply(this, a); }` |

## Bên trong NestJS dùng cái này ở đâu
- Service, controller, guard đều là class; Nest gọi method qua instance nên `this` đúng. Bug xuất hiện khi **chính bạn** truyền method làm callback: `setInterval(this.cleanup, 1000)`, `eventEmitter.on('order.created', this.notify)`, `.then(this.map)`.
- Decorator/interceptor bọc method (T06, C08) phải giữ `this` — ex08.

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J04-this-binding NN`.
