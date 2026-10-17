// ex04 · ensureError / attempt — đáp án best practice
//
// - Trong JS có thể `throw` bất cứ thứ gì → ở biên hệ thống luôn chuẩn hóa về Error trước khi log
//   (để có stack, có message). Giữ giá trị gốc trong `cause`.
// - describe an toàn: JSON.stringify có thể ném (vòng, BigInt) → try/catch nhỏ, rơi về String().
// - attempt trả tuple [error, result] → caller xử lý lỗi tường minh mà không cần try/catch lồng
//   (phong cách Go). Phù hợp cho chỗ "lỗi là chuyện bình thường", ví dụ parse input.
const describe = (value) => {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

export function ensureError(value) {
  if (value instanceof Error) return value;
  return new Error(`Non-error thrown: ${describe(value)}`, { cause: value });
}

export function attempt(fn, ...args) {
  try {
    return [null, fn(...args)];
  } catch (error) {
    return [ensureError(error), undefined];
  }
}
