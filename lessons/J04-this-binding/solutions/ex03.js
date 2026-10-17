// ex03 · bindAll — đáp án best practice
//
// - Đọc `obj[name]` (tìm cả trên prototype chain, nên bind được method của class) rồi gán lại
//   lên chính obj bản đã bind → own property che method của prototype.
// - Validate trước khi bind, thông điệp lỗi nói rõ tên sai.
// - Dùng `for...of` vì có side effect (gán); `forEach` cũng được nhưng for...of dễ đọc hơn khi có throw.
export function bindAll(obj, ...methodNames) {
  for (const name of methodNames) {
    const method = obj[name];
    if (typeof method !== 'function') {
      throw new TypeError(`bindAll: "${name}" is not a function`);
    }
    obj[name] = method.bind(obj);
  }
  return obj;
}
