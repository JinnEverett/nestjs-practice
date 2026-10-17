// ex07 · memoizeByObject — đáp án best practice
//
// - WeakMap: key là object, entry tự biến mất khi object không còn ai tham chiếu → cache không rò bộ nhớ
//   (Map sẽ giữ mọi request/entity sống mãi).
// - has() để nhớ cả undefined.
// - Kiểm kiểu key: WeakMap chỉ nhận object/function (Node sẽ ném TypeError của chính nó, nhưng thông điệp tự viết rõ hơn).
// Ứng dụng: cache giá trị tính toán theo request object, metadata gắn vào class/instance (reflect-metadata dùng ý tưởng này — T06).
export function memoizeByObject(fn) {
  const cache = new WeakMap();
  return (obj, ...rest) => {
    if ((typeof obj !== 'object' && typeof obj !== 'function') || obj === null) {
      throw new TypeError('memoizeByObject: first argument must be an object');
    }
    if (cache.has(obj)) return cache.get(obj);
    const value = fn(obj, ...rest);
    cache.set(obj, value);
    return value;
  };
}
