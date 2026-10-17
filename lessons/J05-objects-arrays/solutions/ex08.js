// ex08 · deepClone — đáp án best practice
//
// - WeakMap `seen` ánh xạ object gốc → bản clone. Gặp lại object đã clone thì trả bản clone đó:
//   xử lý được cả tham chiếu vòng lẫn object dùng chung, và không clone lặp vô hạn.
// - Đăng ký bản clone vào `seen` TRƯỚC khi đệ quy vào con (quan trọng cho vòng).
// - Phân nhánh theo loại: Date, Map, Set, Array, object thường. Map clone cả key lẫn value.
// - WeakMap không giữ object sống → không rò bộ nhớ sau khi clone xong.
// Trong thực tế: dùng `structuredClone` có sẵn (Node 17+), trừ khi cần clone class instance có method.
export function deepClone(value, seen = new WeakMap()) {
  if (typeof value !== 'object' || value === null) return value;
  if (seen.has(value)) return seen.get(value);

  if (value instanceof Date) return new Date(value.getTime());

  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);
    for (const [k, v] of value) copy.set(deepClone(k, seen), deepClone(v, seen));
    return copy;
  }

  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    for (const v of value) copy.add(deepClone(v, seen));
    return copy;
  }

  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const key of Object.keys(value)) copy[key] = deepClone(value[key], seen);
  return copy;
}
