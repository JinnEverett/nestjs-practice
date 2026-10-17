# N02 · Bài tập

Viết vào `answers/exNN.js` (ES module). Không dùng package `semver` hay thư viện ngoài — chính là mục đích bài.
Chấm: `bash lessons/check.sh lessons/N02-npm 01`. Đáp án: `solutions/`.
Các bài sau dùng lại hàm của bài trước (`import … from './ex01.js'`), nên làm theo thứ tự.

**Pass:** 7/8 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · `satisfies(version, range)`
Version dạng `X.Y.Z` (không prerelease). Range hỗ trợ:
- exact `1.2.3` (cả `=1.2.3`), so sánh `>`, `>=`, `<`, `<=`
- `^` và `~` (nhớ quy tắc `^0.x`), partial/wildcard: `1`, `1.2`, `1.x`, `1.2.x`, `*`, `""` (chuỗi rỗng = mọi bản)
- nhiều comparator cách nhau khoảng trắng = AND (`>=1.2.0 <1.5.0`), `||` = OR
- version không hợp lệ (`"1.2"`, `"abc"`) → trả `false`; range không hiểu được → ném `TypeError`.

### ex02 · `compareVersions`, `sortVersions`, `maxSatisfying`
- `compareVersions(a, b)` → `-1 | 0 | 1` (so từng phần **như số**: `1.10.0 > 1.9.0`).
- `sortVersions(list)` → mảng mới tăng dần, không mutate.
- `maxSatisfying(list, range)` → version lớn nhất khớp `range`, không có thì `null`. Dùng `satisfies` của ex01.

### ex03 · `findDrift(pkg, lock)` — vì sao `npm ci` báo lệch
`pkg` là nội dung `package.json`, `lock` là `package-lock.json` (lockfileVersion 3). Với mỗi dependency trong `dependencies`, `devDependencies`, `optionalDependencies` của `pkg`, trả mảng `{ name, range, locked, reason }`, sắp theo `name`, cho các trường hợp lệch:
- `'missing'`: không có `lock.packages['node_modules/<name>']` (`locked: null`)
- `'out-of-range'`: bản đã khóa không khớp `range`
- `'range-mismatch'`: bản khóa vẫn khớp, nhưng `lock.packages[""]` ghi range khác với `package.json` (lockfile chưa được cập nhật)
Mỗi dependency chỉ báo **một** lý do (ưu tiên theo thứ tự trên). Không lệch → mảng rỗng.

---

## 🟡 Kết hợp

### ex04 · `auditImports({ pkg, files })` — kiểu depcheck
`files` là object `{ đường_dẫn: nội_dung_mã }`. Tìm các specifier trong `import … from 'x'`, `import 'x'`, `export … from 'x'`, `require('x')`, `import('x')`. Quy đổi specifier → tên package (`@a/b/c` → `@a/b`, `lodash/fp` → `lodash`); bỏ qua đường dẫn tương đối, `node:…` và module built-in của Node.
Trả `{ missing, unused, devInSrc }` (mỗi cái là mảng tên đã sắp xếp, không trùng):
- `missing`: được import nhưng không có trong bất kỳ nhóm nào (dependencies/devDependencies/peer/optional)
- `unused`: có trong `dependencies` nhưng không file nào import (bỏ qua `@types/*`)
- `devInSrc`: chỉ khai báo ở `devDependencies` mà được import từ file **không phải test** (test = đường dẫn bắt đầu `test/`, `tests/`, `e2e/`, hoặc chứa `.spec.` / `.test.`)

### ex05 · `resolveScript(pkg, name)` và `scriptCycle(pkg, name)`
- `resolveScript` trả mảng `{ name, command }` theo thứ tự chạy: `pre<name>` (nếu có), `<name>`, `post<name>` (nếu có). Không có script `name` → ném `Error` có message `Missing script: "<name>"`; nếu có script tên gần giống (khoảng cách sửa ≤ 2) thì thêm `. Did you mean "<gần nhất>"?`.
- `scriptCycle(pkg, name)`: một command có thể gọi script khác bằng `npm run <x>` / `npm run-script <x>` / `npm run <x> --…`. Duyệt đồ thị gọi nhau xuất phát từ `name`; thấy vòng → ném `Error('Cycle: a -> b -> a')` (đường đi từ node đầu vòng); không vòng → trả mảng tên script đã thăm theo thứ tự DFS (kể cả `name`). Chỉ xét script có thật.

### ex06 · `lintPackageJson(pkg)` — kiểm tra `package.json` trước khi deploy
Trả mảng `{ code, name? }` sắp theo `code` rồi `name`. Các luật:
- `floating-range`: range của dependency/devDependency là `*`, `latest`, chuỗi rỗng, hoặc chỉ có cận dưới (`>=1.0.0`, `>1`) không có cận trên
- `tool-in-dependencies`: trong `dependencies` có công cụ dev: `typescript`, `jest`, `ts-jest`, `eslint`, `prettier`, `nodemon`, `supertest`, `vitest`, `ts-node`, `@nestjs/cli`, `@nestjs/testing`, hoặc bất kỳ `@types/*`
- `duplicate-dependency`: cùng tên ở cả `dependencies` lẫn `devDependencies`
- `url-dependency`: range là URL/git/GitHub: bắt đầu `git+`, `git:`, `github:`, `http:`, `https:` hoặc dạng `user/repo`
- `missing-engines`: không có `engines.node`
- `not-private`: `private !== true`
- `no-start-script`: không có cả `scripts.start` lẫn `scripts["start:prod"]`

---

## 🔴 Thực tế

### ex07 · Tự động tăng version từ commit
CI của team muốn tự tăng version theo Conventional Commits.
- `bump(version, level)` với `level` là `'major' | 'minor' | 'patch'`: `1.4.2` + `minor` → `1.5.0`; ném `RangeError` nếu `level` lạ hoặc version sai dạng.
- `releaseType(commits)` — `commits` là mảng chuỗi message (có thể nhiều dòng). Trả `'major'` nếu có commit dạng `type!:`/`type(scope)!:` hoặc body chứa dòng bắt đầu `BREAKING CHANGE:`; ngược lại `'minor'` nếu có `feat`; ngược lại `'patch'` nếu có `fix` hoặc `perf`; còn lại `null`. Lấy mức cao nhất.
- `nextVersion(current, commits)` → version mới, hoặc `current` nếu `releaseType` là `null`.

### ex08 · Dựng cây `node_modules` (hoisting)
`buildTree(rootDeps, registry)`:
- `registry`: `{ tên: { 'x.y.z': { dependencies: { tên: range } } } }`; `rootDeps`: `{ tên: range }`.
- Trả object `{ 'node_modules/a': '1.0.0', 'node_modules/a/node_modules/c': '2.0.0', … }` (đường dẫn cài → version).
- Thuật toán (BFS, mỗi package duyệt dependency theo thứ tự **alphabet** của tên):
  1. Với dependency `d@range` của package ở thư mục `P` (`''` cho gốc), đi từ `P/node_modules/d` ngược lên đến gốc, tìm nơi đã cài `d` đầu tiên. Nếu bản đó khớp `range` → **dùng lại**. Nếu không khớp → phải cài **lồng** ngay dưới `P`.
  2. Không thấy `d` ở đâu → cài ở **gốc** (`node_modules/d`) bản lớn nhất khớp `range`.
  3. Mỗi package vừa cài thì duyệt tiếp dependency của nó (đường dẫn cài của nó là thư mục `P` mới).
- Không có package → `Error('Package not found: x')`; không có version khớp → `Error('No matching version for x@range')`. Vòng phụ thuộc (a → b → a) không được treo.
- Dùng `maxSatisfying` của ex02.
