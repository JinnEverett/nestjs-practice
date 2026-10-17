// ex03 · pLimit — đáp án best practice
//
// - Hàng đợi các "lượt chạy" (hàm không tham số); `active` đếm số đang chạy.
// - next(): còn chỗ và còn việc → lấy việc đầu hàng (FIFO) và chạy.
// - Bọc fn trong `Promise.resolve().then(() => fn(...args))` → lỗi đồng bộ của fn cũng thành reject,
//   không làm vỡ bộ đếm.
// - `finally` giảm active và gọi next() → dù thành công hay lỗi, hàng đợi luôn chạy tiếp (không kẹt).
// - Getter cho activeCount / pendingCount (đọc trạng thái, không sửa được).
// Thư viện thật: p-limit.
export function pLimit(concurrency) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new RangeError('concurrency must be an integer >= 1');

  const queue = [];
  let active = 0;

  const next = () => {
    if (active >= concurrency || queue.length === 0) return;
    active++;
    const run = queue.shift();
    run();
  };

  const limit = (fn, ...args) =>
    new Promise((resolve, reject) => {
      queue.push(() => {
        Promise.resolve()
          .then(() => fn(...args))
          .then(resolve, reject)
          .finally(() => {
            active--;
            next();
          });
      });
      next();
    });

  Object.defineProperties(limit, {
    activeCount: { get: () => active },
    pendingCount: { get: () => queue.length },
  });
  return limit;
}
