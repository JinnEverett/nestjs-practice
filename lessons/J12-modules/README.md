# J12 · Modules: ESM vs CommonJS

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Đọc/viết cả hai hệ module: ES Modules (`import/export`) và CommonJS (`require/module.exports`).
- Biết Node chọn hệ nào cho một file (`"type"` trong package.json, đuôi `.mjs`/`.cjs`).
- Hiểu module được **chạy một lần** và cache → module là singleton.
- Dùng `import()` động, top-level await, `import.meta.dirname`.
- Gỡ vòng import (circular dependency) — lỗi bạn sẽ gặp lại ở NestJS (`forwardRef`).
- Thiết kế `"exports"` trong package.json.

---

## 1. Hai hệ module
| | ES Modules (ESM) | CommonJS (CJS) |
|---|---|---|
| Cú pháp | `import x from './a.js'`, `export const y` | `const x = require('./a')`, `module.exports = ...` |
| Khi nào dùng | `.mjs`, hoặc `.js` khi package.json có `"type": "module"` | `.cjs`, hoặc `.js` khi không có `"type": "module"` |
| Load | bất đồng bộ, phân tích `import` **trước** khi chạy | đồng bộ, `require` là lời gọi hàm lúc chạy |
| Đuôi file khi import tương đối | **bắt buộc** (`'./a.js'`) | không bắt buộc |
| Giá trị import | **live binding** (thấy giá trị mới khi module gốc đổi) | bản copy giá trị tại thời điểm `require` (với primitive) |
| `this` top-level, `__dirname` | `undefined`, không có → `import.meta.dirname` | `module.exports`, có |
| Top-level await | ✅ | ❌ |

TypeScript của NestJS mặc định biên dịch ra **CommonJS**; code bạn viết bằng cú pháp `import` nhưng chạy là `require`. Biết cả hai giúp đọc lỗi kiểu `ERR_REQUIRE_ESM` hay `exports is not defined`.

## 2. Module chạy một lần, rồi được cache
```js
// db.js
console.log('tạo pool');           // in đúng 1 lần dù 10 file import
export const pool = createPool();  // mọi nơi dùng CÙNG pool → module là singleton tự nhiên
```

## 3. Thứ tự đánh giá (ESM)
Node đọc mọi `import` tĩnh, tải cả cây, rồi chạy từ **lá lên gốc** (module được import chạy trước module import nó), theo thứ tự xuất hiện.

## 4. import động & top-level await
```js
const { default: plugin } = await import(`./plugins/${name}.js`);   // tải khi cần
const config = JSON.parse(await readFile(new URL('./config.json', import.meta.url), 'utf8'));
import data from './config.json' with { type: 'json' };            // import attributes (Node 22+)
const here = import.meta.dirname;                                   // thay __dirname (Node 20.11+)
```
⚠️ Ghép đường dẫn import từ input người dùng = path traversal (`../../etc/...`) → luôn whitelist tên.

## 5. Vòng import
`a.js` import `b.js`, `b.js` import `a.js`. Khi chạy, một trong hai sẽ thấy module kia **chưa chạy xong**: ESM → `ReferenceError: Cannot access 'X' before initialization`; CJS → nhận object `exports` **rỗng một nửa**.
Cách gỡ (theo thứ tự ưu tiên): tách phần dùng chung ra module thứ ba; đảo chiều phụ thuộc (truyền vào qua tham số — dependency injection); chỉ dùng giá trị bên trong hàm (lúc gọi) thay vì lúc module được nạp.

## 6. `"exports"` trong package.json
```json
{
  "name": "shop-utils",
  "type": "module",
  "exports": {
    ".": { "import": "./src/index.js", "require": "./src/index.cjs" },
    "./errors": "./src/errors.js"
  }
}
```
Chỉ những đường được liệt kê mới import được từ ngoài → file nội bộ được bảo vệ (`ERR_PACKAGE_PATH_NOT_EXPORTED`); điều kiện `import`/`require` cho phép phát hành cả 2 định dạng.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| Quên `.js` trong import ESM | `ERR_MODULE_NOT_FOUND` |
| `exports = {...}` trong CJS | không export gì (chỉ đổi biến cục bộ) — dùng `module.exports` |
| `require()` một package chỉ có ESM có top-level await | `ERR_REQUIRE_ASYNC_MODULE` |
| Vòng import | `undefined` / ReferenceError lúc khởi động |
| `import(userInput)` | path traversal |

## Bên trong NestJS dùng cái này ở đâu
- Mỗi file là một module JS; mỗi `@Module()` của Nest là một khái niệm **khác** (gom provider) — đừng nhầm.
- Hai module Nest import lẫn nhau, hoặc hai service inject lẫn nhau → cần `forwardRef()` (C03, C04); nhưng tốt hơn là tách phần chung ra (ex07).
- Lazy-loading module (C10) dùng `import()` động.

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J12-modules NN`.
