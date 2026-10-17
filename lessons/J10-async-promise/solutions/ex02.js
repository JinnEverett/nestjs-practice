// ex02 · sleep / promisify — đáp án best practice
//
// - sleep: chỉ cần resolve trong setTimeout; tham số thứ 3 của setTimeout truyền thẳng vào callback.
// - promisify: trả về `function` thường (không phải arrow) để nhận `this` của lời gọi, rồi
//   `fn.call(this, ...args, callback)`.
// - `err != null` (bắt cả null lẫn undefined) theo quy ước error-first của Node.
// - Bọc trong try/catch không cần thiết: nếu fn ném đồng bộ trong executor, Promise tự reject.
// Thực tế: dùng `util.promisify`, hoặc API promise có sẵn (`node:fs/promises`, `node:timers/promises`).
export function sleep(ms, value) {
  return new Promise((resolve) => setTimeout(resolve, ms, value));
}

export function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn.call(this, ...args, (err, result) => (err != null ? reject(err) : resolve(result)));
    });
  };
}
