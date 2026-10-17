// ex07 · mergeDeep — đáp án best practice
//
// - Kết quả bắt đầu là bản copy nông của target → không mutate target; đệ quy tạo object mới cho
//   mọi nhánh được merge → không dùng chung tham chiếu.
// - isPlainObject: chỉ merge object "thuần" (prototype là Object.prototype hoặc null);
//   mảng, Date, Map, class instance → thay thế nguyên khối.
// - Bỏ qua `__proto__`, `constructor`, `prototype` (FORBIDDEN_KEYS). Lưu ý JSON.parse tạo
//   `__proto__` thành own property bình thường → Object.keys thấy nó → phải lọc tường minh.
// - Gán bằng Object.defineProperty? Không cần, vì key nguy hiểm đã bị loại trước khi gán.
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const isPlainObject = (v) => {
  if (typeof v !== 'object' || v === null) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

export function mergeDeep(target, source) {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (FORBIDDEN_KEYS.has(key) || value === undefined) continue;
    result[key] = isPlainObject(value) && isPlainObject(result[key]) ? mergeDeep(result[key], value) : value;
  }
  return result;
}
