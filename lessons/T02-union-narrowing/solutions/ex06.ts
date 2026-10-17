// ex06 · toHttpStatus — đáp án best practice
//
// - instanceof thu hẹp theo class (lỗi của chính ta) — kiểm TRƯỚC.
// - `'status' in e` + typeof thu hẹp object lạ (lỗi của thư viện HTTP thường có status/statusCode).
// - Khoảng 400–599 → không để thư viện bên ngoài khiến API trả 200 cho một lỗi.
// - Mọi thứ khác → 500.
export class NotFoundError extends Error {
  override name = 'NotFoundError';
}

export class ValidationError extends Error {
  override name = 'ValidationError';
}

export function toHttpStatus(e: unknown): number {
  if (e instanceof NotFoundError) return 404;
  if (e instanceof ValidationError) return 400;
  if (typeof e === 'object' && e !== null && 'status' in e && typeof e.status === 'number' && e.status >= 400 && e.status <= 599) {
    return e.status;
  }
  return 500;
}
