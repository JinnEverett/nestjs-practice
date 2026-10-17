// ex06 · safeDivide — đáp án best practice
//
// - `Number.isFinite` (khác `isFinite` toàn cục) KHÔNG ép kiểu: Number.isFinite('10') === false.
//   Một lần kiểm tra loại được: chuỗi, null, undefined, boolean, NaN, Infinity.
// - `b === 0` đúng cả với -0 (0 === -0 là true) nên không cần xử lý riêng.
// - Hai số hữu hạn vẫn có thể chia ra Infinity (vd. 1e308 / 1e-10) → kiểm tra kết quả lần cuối.
export function safeDivide(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  const result = a / b;
  return Number.isFinite(result) ? result : null;
}
