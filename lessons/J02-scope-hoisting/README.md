# J02 · Biến, scope & hoisting

Đọc khoảng 10 phút. Chạy ví dụ bằng `node file.js`.

## Mục tiêu: sau buổi này bạn làm được
- Chọn đúng `const` / `let` (và biết vì sao gần như không còn dùng `var`).
- Giải thích hoisting và TDZ (temporal dead zone) — đoán đúng lỗi `ReferenceError` vs giá trị `undefined`.
- Phân biệt block scope, function scope, module scope; nhận ra shadowing.
- Hiểu strict mode chặn những lỗi gì (biến toàn cục ngầm, gán vào `const`).
- Nhận ra bug "state dùng chung" — gốc rễ của lỗi rò dữ liệu giữa các request trong service NestJS.

---

## 1. `const`, `let`, `var`
| | Scope | Hoisting | Gán lại | Khai báo lại |
|---|---|---|---|---|
| `const` | block `{}` | có, nhưng ở TDZ tới dòng khai báo | ❌ | ❌ |
| `let` | block `{}` | có, nhưng ở TDZ | ✅ | ❌ |
| `var` | **function** | có, giá trị ban đầu `undefined` | ✅ | ✅ (âm thầm) |

Quy tắc dùng: **mặc định `const`**; dùng `let` khi thật sự cần gán lại (biến đếm, accumulator); **không dùng `var`**.

`const` chỉ khóa **tên biến**, không khóa object bên trong:
```js
const cart = [];
cart.push('áo');      // ✅ được: mutate object
cart = [];            // ❌ TypeError: Assignment to constant variable.
Object.freeze(cart);  // muốn khóa nội dung thì freeze (nông — chỉ 1 tầng)
```

## 2. Hoisting và TDZ
Trước khi chạy một scope, JS "đăng ký" mọi khai báo trong scope đó:
```js
console.log(a);    // undefined   — var được hoist kèm giá trị undefined
console.log(b);    // ReferenceError — let/const ở TDZ tới khi chạy qua dòng khai báo
hello();           // 'hi'        — function declaration được hoist cả thân hàm
arrow();           // TypeError: arrow is not a function — var arrow đang là undefined
var a = 1;
let b = 2;
function hello() { return 'hi'; }
var arrow = () => 'arrow';
```
`typeof` biến **chưa từng khai báo** trả `'undefined'` (không lỗi); nhưng `typeof` biến `let` đang ở TDZ thì **ném ReferenceError**.

## 3. Scope và shadowing
```js
const x = 'module';
function f() {
  const x = 'function';     // shadow x bên ngoài
  if (true) {
    const x = 'block';      // shadow tiếp
    console.log(x);         // 'block'
  }
  console.log(x);           // 'function'
}
```
- **Block scope**: `{ }` của `if`, `for`, `switch`, hoặc block trần.
- **Function scope**: `var` chỉ dừng ở biên hàm → rò ra ngoài `for`/`if`.
- **Module scope**: biến top-level của một file ES module chỉ thấy trong file đó, **tồn tại suốt vòng đời process** và **dùng chung cho mọi lời gọi**.
- `switch` chỉ có MỘT block cho mọi `case` → khai báo `const label` ở 2 case là SyntaxError. Bọc mỗi case trong `{ }` hoặc dùng bảng tra.

## 4. Vòng lặp: `var` vs `let`
```js
const fns = [];
for (var i = 0; i < 3; i++) fns.push(() => i);
fns.map((f) => f());   // [3, 3, 3] — chỉ có MỘT biến i dùng chung
for (let j = 0; j < 3; j++) fns.push(() => j);
// let tạo biến j MỚI cho mỗi vòng → [0, 1, 2]
```

## 5. Strict mode
ES module (file `.js` trong package `"type": "module"`, `.mjs`, và mọi file TypeScript biên dịch ra ESM/CJS bởi `tsc`) **luôn ở strict mode**:
- gán vào biến chưa khai báo → `ReferenceError` (thay vì âm thầm tạo biến toàn cục);
- `this` trong hàm thường gọi trần là `undefined` (thay vì `globalThis`);
- gán vào thuộc tính của object đã `freeze` → `TypeError` (thay vì âm thầm bỏ qua).

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách tránh |
|---|---|---|
| `var` trong `for` + callback | mọi callback thấy giá trị cuối | `let` hoặc `map` |
| Quên khai báo (`total = 0`) | biến toàn cục ngầm (sloppy) / ReferenceError (strict) | luôn `const`/`let`, bật ESLint `no-undef` |
| `const` tưởng là bất biến | object vẫn bị sửa | `Object.freeze`, hoặc không mutate |
| `const` trùng tên trong các `case` | SyntaxError | `{ }` cho từng case / bảng tra |
| Lưu dữ liệu của request vào biến module/field của service | request A thấy dữ liệu của request B | giữ dữ liệu trong biến cục bộ / tham số |

## Bên trong NestJS dùng cái này ở đâu
- Provider (service) mặc định là **singleton**: một instance dùng chung cho mọi request — giống hệt biến module scope. Gán `this.currentUser = user` trong service là bug rò dữ liệu kinh điển (ex07). Nest có REQUEST scope và `AsyncLocalStorage` cho nhu cầu này (C10, P01).
- Config đọc một lần lúc khởi động rồi đóng băng (ex08) là đúng tinh thần `@nestjs/config` (C09).

## Bài tập
Xem `exercises.md`. Chấm bằng `bash lessons/check.sh lessons/J02-scope-hoisting NN`.
