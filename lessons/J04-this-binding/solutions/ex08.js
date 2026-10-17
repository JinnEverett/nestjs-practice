// ex08 · instrumentMethods — đáp án best practice
//
// - Lấy method gốc qua `instance[name]` (tìm cả trên prototype) TRƯỚC khi ghi đè.
// - Ghi wrapper lên chính instance (own property) → chỉ instance này bị bọc, class/prototype không đổi.
// - Wrapper là `function` thường + `original.apply(this, args)`:
//   khi gọi s.total(...), this = s → bên trong total gọi this.withTax(...) đi qua wrapper của withTax
//   (vì own property che prototype) → đo được cả lời gọi lồng nhau.
// - Đây là cơ chế của method decorator / interceptor: bọc mà không sửa code gốc (T06, C08).
export function instrumentMethods(instance, methodNames, onCall) {
  for (const name of methodNames) {
    const original = instance[name];
    if (typeof original !== 'function') throw new TypeError(`${name} is not a method`);
    instance[name] = function (...args) {
      onCall(name, args);
      return original.apply(this, args);
    };
  }
  return instance;
}
