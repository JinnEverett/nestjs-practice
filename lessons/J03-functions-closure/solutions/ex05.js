// ex05 · debounce — đáp án best practice
//
// - Một biến `timer` trong closure: mỗi lần gọi thì hủy hẹn cũ (clearTimeout) và hẹn lại.
//   Chỉ lần gọi cuối "sống sót" → fn nhận tham số của lần gọi cuối.
// - clearTimeout(undefined) là hợp lệ → không cần if.
// - cancel() hủy hẹn và dọn biến → không giữ tham số cũ trong bộ nhớ.
// - Giữ `this` bằng function thường để dùng được làm method.
export function debounce(fn, ms) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn.apply(this, args);
    }, ms);
  }
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  return debounced;
}
