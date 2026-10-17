// ex02 · pick / omit — đáp án best practice
//
// - `Object.hasOwn` (thay cho obj.hasOwnProperty) → chỉ lấy own property, an toàn cả với object
//   tạo bằng Object.create(null). Toán tử `in` sẽ lấy nhầm 'toString' từ prototype.
// - `Object.fromEntries` + `filter`/`map` → khai báo, không cần biến tạm, luôn tạo object mới.
// - omit dùng Set cho tra cứu O(1) khi danh sách keys dài.
export function pick(obj, keys) {
  return Object.fromEntries(keys.filter((key) => Object.hasOwn(obj, key)).map((key) => [key, obj[key]]));
}

export function omit(obj, keys) {
  const excluded = new Set(keys);
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !excluded.has(key)));
}
