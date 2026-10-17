// ex05 · createIdGenerator — đáp án best practice
//
// - Bộ đếm `current` là biến `let` trong scope của lần gọi createIdGenerator → mỗi generator
//   có biến riêng (closure), bên ngoài không đọc/sửa được (đóng gói thật sự, không cần class).
// - Một hàm `format` dùng chung cho next/peek → không lặp logic định dạng.
// - `String.prototype.padStart` thay cho tự ghép số 0; pad = 0 thì không làm gì.
// - Destructuring tham số với giá trị mặc định `{ start = 1, pad = 0 } = {}` cho phép gọi thiếu options.
export function createIdGenerator(prefix, { start = 1, pad = 0 } = {}) {
  let current = start;
  const format = (n) => `${prefix}-${String(n).padStart(pad, '0')}`;

  return {
    next: () => format(current++),
    peek: () => format(current),
    reset: () => {
      current = start;
    },
  };
}
