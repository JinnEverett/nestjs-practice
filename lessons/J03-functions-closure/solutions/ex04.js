// ex04 · memoize — đáp án best practice
//
// - `Map` thay cho object thường: key nào cũng được (kể cả '__proto__', 'toString', số, object),
//   không đụng prototype.
// - `cache.has(key)` thay vì `if (cache.get(key))` → nhớ cả kết quả falsy/undefined.
// - keyFn mặc định lấy tham số đầu — đủ cho đa số trường hợp, và cho phép caller tự định nghĩa
//   key cho nhiều tham số (lưu ý: JSON.stringify args làm key thì chậm và sai với object có thứ tự key khác).
// - Gắn `clear` lên hàm trả về: hàm là object nên có thể có thuộc tính.
// ⚠️ Cache này không giới hạn → xem ex10 cho bản dùng được trên server chạy lâu.
export function memoize(fn, keyFn = (first) => first) {
  const cache = new Map();
  const memoized = (...args) => {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key);
    const value = fn(...args);
    cache.set(key, value);
    return value;
  };
  memoized.clear = () => cache.clear();
  return memoized;
}
