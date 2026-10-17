// ex06 · withAbortTimeout — đáp án best practice
//
// - AbortController: timeout thì abort(signal) với lý do là TimeoutError → task tử tế tự dừng (hủy query,
//   hủy HTTP request) thay vì chạy tiếp vô ích.
// - Race thêm với một promise reject khi signal abort → caller nhận TimeoutError đúng hạn kể cả khi task
//   phớt lờ signal.
// - finally clearTimeout → không giữ timer khi task xong sớm.
// - `return await` bên trong try để finally chạy SAU khi task settle.
// Gọn hơn khi không cần clearTimeout: AbortSignal.timeout(ms) (lỗi là DOMException name 'TimeoutError').
export async function withAbortTimeout(task, ms) {
  const controller = new AbortController();
  const timeoutError = Object.assign(new Error(`Timed out after ${ms}ms`), { name: 'TimeoutError' });
  const timer = setTimeout(() => controller.abort(timeoutError), ms);

  const aborted = new Promise((_, reject) => {
    controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true });
  });
  aborted.catch(() => {}); // tránh unhandled rejection khi task thắng nhưng sau đó vẫn abort

  try {
    return await Promise.race([task(controller.signal), aborted]);
  } finally {
    clearTimeout(timer);
  }
}
