# J12 · Bài tập

Bài 🔮 ghi vào `answers/exNN.txt`. Bài code: tên file ghi trong từng đề (có bài là `.cjs` hoặc cả thư mục).
Chấm: `bash lessons/check.sh lessons/J12-modules 01`. Đáp án: `solutions/`.

**Pass:** 6/8 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 ESM: thứ tự chạy, live binding, singleton
Đọc `starter/ex01.js` và thư mục `starter/ex01-lib/`, ghi 8 dòng output vào `answers/ex01.txt`.

### ex02 · Chuyển CommonJS sang ESM
Chuyển `starter/ex02.cjs` thành `answers/ex02.js` (ESM): `createSlugger` là **default export**; `slugify` và `DEFAULT_SEPARATOR` là **named export**. Không còn `require` / `module.exports`.

### ex03 · Viết module CommonJS
`answers/ex03.cjs`: `module.exports = { parseCsvLine }` với `parseCsvLine(line, separator = ',')` → mảng chuỗi:
- Field có thể nằm trong ngoặc kép, khi đó được chứa dấu phân cách; `""` bên trong ngoặc kép là một dấu `"`
- Field không ngoặc giữ nguyên (không trim)
```js
parseCsvLine('1,"Áo, size L","nói ""hay""",')  // ['1', 'Áo, size L', 'nói "hay"', '']
```

### ex04 · 🔮 CommonJS: cache, exports, vòng require
Đọc `starter/ex04.cjs` và `starter/ex04-lib/`, ghi 8 dòng output vào `answers/ex04.txt`.

---

## 🟡 Kết hợp

### ex05 · Nạp plugin động
`answers/ex05.js`: `loadPlugins(names, baseUrl)` → `Promise<Map<name, plugin>>`:
- Mỗi plugin là file `<name>.js` trong thư mục `baseUrl` (một `URL` kết thúc bằng `/`), có **default export** là object có method `register`
- Tải **song song** bằng `import()`
- Tên không khớp `/^[a-z0-9-]+$/` → `Error` (chặn path traversal như `'../secret'`) **trước khi** import
- File không tồn tại → `Error` có message chứa tên plugin, `cause` là lỗi gốc
- Không có `register` → `TypeError`
Test dùng `fixtures/plugins/`.

### ex06 · Config nạp lúc import (top-level await)
`answers/ex06.js` đọc `../fixtures/config.json` **khi module được import** (top-level await, đường dẫn tính theo `import.meta.url`) và export:
- `config`: object đã **đóng băng sâu** (mọi tầng)
- `get(path, fallback)`: `get('db.port')` → giá trị; thiếu → `fallback`

### ex07 · 🐞 Gỡ vòng import
`starter/ex07/` gồm `users.js` ⇄ `orders.js` import lẫn nhau → `ReferenceError` khi nạp. Viết lại thành thư mục `answers/ex07/` (giữ `index.js` export `describeUser` và `describeOrder`) **không còn vòng import**, kết quả:
```js
describeUser(1)   // 'USR-1 An có 2 đơn'
describeOrder(10) // 'Đơn 10 của USR-1 An [USR:owner]'
```

---

## 🔴 Thực tế

### ex08 · Đóng gói thư viện nội bộ
Tạo package `answers/ex08/` tên `shop-utils`:
- `package.json` với `"exports"`: `"."` → `./src/index.js` khi `import`, `./src/index.cjs` khi `require`; `"./errors"` → `./src/errors.js`. Không export gì khác.
- `src/index.js` (ESM) và `src/index.cjs` (CJS) cùng export `formatVnd(n)`, `VERSION = '1.0.0'`, và `FORMAT` (`'esm'` / `'cjs'`)
- `src/errors.js` export `class ShopError extends Error`
- `src/internal.js` (bất kỳ) — **không** được import từ ngoài
Test copy thư mục vào `node_modules/shop-utils` rồi `import 'shop-utils'`, `require('shop-utils')`, `import 'shop-utils/errors'`, và kiểm tra `shop-utils/src/internal.js` bị chặn.
