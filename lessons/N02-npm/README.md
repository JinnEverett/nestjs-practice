# N02 · npm và quản lý dependency

Đọc khoảng 10 phút. Mọi dự án Nest là một `package.json`. Lỗi kiểu "chạy được trên máy tôi", "CI cài ra bản khác", "production thiếu package" đều xuất phát từ đây.

## Mục tiêu: sau buổi này bạn làm được
- Đọc đúng semver range (`^`, `~`, `x`, `>=`), biết version nào được cài.
- Giải thích lockfile làm gì và vì sao CI dùng `npm ci` thay vì `npm install`.
- Phân biệt `dependencies` / `devDependencies` / `peerDependencies` và đặt package đúng chỗ.
- Hiểu `node_modules` được "hoist" thế nào, vì sao có phiên bản lồng nhau.
- Viết `scripts` dùng hook `pre`/`post`, phát hiện vòng lặp giữa các script.

---

## 1. Semver
`MAJOR.MINOR.PATCH`: đổi MAJOR khi phá API, MINOR khi thêm tính năng tương thích, PATCH khi sửa lỗi.

| Range | Nghĩa | Ví dụ khớp |
|---|---|---|
| `1.2.3` | đúng bản này | 1.2.3 |
| `^1.2.3` | `>=1.2.3 <2.0.0` | 1.2.3, 1.9.0 |
| `^0.2.3` | `>=0.2.3 <0.3.0` (0.x: MINOR coi như MAJOR) | 0.2.9 |
| `^0.0.3` | chỉ `0.0.3` | |
| `~1.2.3` | `>=1.2.3 <1.3.0` | 1.2.9 |
| `1.x`, `1.2.x` | mọi bản trong họ đó | |
| `>=1.2.0 <2.0.0` | cả hai điều kiện (AND) | |
| `^1.0.0 \|\| ^2.0.0` | hoặc | |
| `*`, `latest` | bất kỳ — **tránh** | |

`^` là mặc định của `npm install`: nhận mọi bản MINOR/PATCH mới. Thế nên **2 lần `npm install` ở 2 thời điểm có thể ra 2 cây khác nhau** → cần lockfile.

## 2. Lockfile
`package-lock.json` ghi **đúng version đã cài** (và hash) cho toàn bộ cây, kể cả dependency gián tiếp.
- `npm install`: có thể cập nhật lockfile.
- `npm ci`: xóa `node_modules`, cài **đúng** theo lockfile, **lỗi nếu lockfile lệch `package.json`**. Dùng trong CI/Docker.
- Luôn commit lockfile của ứng dụng (thư viện publish thì khác).
```jsonc
{ "lockfileVersion": 3,
  "packages": {
    "": { "dependencies": { "express": "^5.0.0" } },          // bản sao deps của package.json
    "node_modules/express": { "version": "5.1.0" },
    "node_modules/foo/node_modules/ms": { "version": "2.0.0" } // bản lồng nhau
  } }
```

## 3. Các nhóm dependency
- `dependencies`: cần lúc **chạy** production (`@nestjs/*`, `typeorm`, `pg`).
- `devDependencies`: chỉ cần lúc build/test (`typescript`, `jest`, `eslint`, `@types/*`, `@nestjs/cli`). `npm ci --omit=dev` trong image production sẽ bỏ chúng; nếu đặt nhầm thì build image lỗi hoặc ngược lại production thiếu module.
- `peerDependencies`: "tôi cần bạn cung cấp package này" (plugin/thư viện dùng chung `@nestjs/common`).
- `engines.node`: cảnh báo/ chặn sai phiên bản Node.

## 4. `node_modules` và hoisting
npm đặt package ở `node_modules/` gốc nếu không xung đột; nếu hai package cần hai MAJOR khác nhau của cùng một thư viện, một bản sẽ được **lồng** (`node_modules/b/node_modules/c`). Node tìm module bằng cách đi ngược lên cây thư mục. Hệ quả: import một package **không khai báo** (phantom dependency) vẫn chạy, cho tới ngày cây thay đổi.

## 5. Scripts
`npm run build` chạy `scripts.build`. Có hook: `prebuild` chạy trước, `postbuild` sau. `npm test`, `npm start` là lối tắt. `npx tool` chạy binary (cài tạm nếu chưa có). Script gọi script khác (`"ci": "npm run lint && npm run test"`) phải tránh vòng.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| `"typescript": "*"` hay `latest` | build đổi bất ngờ | range có cận trên, lockfile |
| Chỉ `npm install` trong CI | cây khác máy dev | `npm ci` |
| `jest` nằm trong `dependencies` | image production phình, lộ tool | `devDependencies` |
| Import package không khai báo | hỏng khi hoist đổi | khai báo đúng `dependencies` |
| Không commit lockfile | không tái lập được | commit |
| Sửa `package.json` tay mà không cập nhật lockfile | `npm ci` lỗi | `npm install` rồi commit cả hai |

## Bên trong Nest dùng cái này ở đâu
- `nest new` sinh `package.json` với `@nestjs/*` cùng MAJOR — trộn MAJOR là nguồn lỗi DI khó hiểu. `nest upgrade` (Nest 12) cập nhật đồng bộ.
- Dockerfile ở P07: `npm ci` → build → `npm ci --omit=dev` ở stage cuối. Sai nhóm dependency là lỗi deploy kinh điển.
- Thư viện Nest (`@nestjs/typeorm`...) khai báo `@nestjs/common` là **peerDependency** để dùng chung một bản — nếu có 2 bản, `instanceof` và metadata DI hỏng.
