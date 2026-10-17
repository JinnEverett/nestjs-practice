# shop-utils — đáp án ex08

- `"exports"` là **danh sách cho phép**: chỉ `shop-utils` và `shop-utils/errors` import được; `src/internal.js` bị Node chặn (`ERR_PACKAGE_PATH_NOT_EXPORTED`) → được tự do đổi code nội bộ mà không làm vỡ người dùng.
- Điều kiện `import` / `require` → phát hành cả ESM và CJS (dual package). Thứ tự key có ý nghĩa: Node chọn điều kiện khớp **đầu tiên**.
- `"type": "module"` → file `.js` là ESM; bản CJS phải dùng đuôi `.cjs`.
- Bẫy "dual package hazard": hai bản là hai module khác nhau → `instanceof` lỗi giữa 2 bản không khớp, state singleton bị nhân đôi. Với thư viện có state, cho bản này re-export bản kia.
- Thực tế: thêm `"types"` (TypeScript), build bằng `tsc`/`tsup` ra cả 2 định dạng.
