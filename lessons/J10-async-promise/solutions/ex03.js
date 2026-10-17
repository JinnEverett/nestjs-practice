// ex03 · withTimeout — đáp án best practice
//
// - Promise.race giữa promise gốc và một promise "hẹn giờ reject".
// - `finally` luôn clearTimeout → không để timer treo giữ process sống / tốn bộ nhớ khi gọi hàng nghìn lần.
// - Error có name 'TimeoutError' → tầng trên phân biệt timeout với lỗi khác (map sang 504, hoặc retry).
// Lưu ý: timeout KHÔNG hủy được công việc bên dưới (query vẫn chạy). Muốn hủy thật cần AbortController
// truyền xuống (J11) — fetch, pg, axios đều hỗ trợ signal.
export function withTimeout(promise, ms, message = 'Operation timed out') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(message);
      error.name = 'TimeoutError';
      reject(error);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
