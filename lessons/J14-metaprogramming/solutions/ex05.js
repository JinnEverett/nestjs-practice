// ex05 · createChangeTracker — đáp án best practice (dirty checking kiểu ORM)
//
// - Map path → giá trị gốc (lúc thay đổi ĐẦU TIÊN) — đủ để tính diff, không cần chụp toàn bộ object.
// - Proxy lồng nhau theo prefix đường dẫn: đọc object thường → trả proxy con với path mới.
//   Mảng/Date không được bọc (coi như giá trị nguyên khối).
// - Gán về đúng giá trị gốc (Object.is) → xóa entry → không gửi UPDATE thừa.
// - `to` đọc trực tiếp từ target lúc getChanges → luôn là giá trị hiện tại.
// TypeORM khi save() so entity với bản đã load để chỉ UPDATE cột thay đổi — cùng ý tưởng.
const isPlainObject = (v) => typeof v === 'object' && v !== null && Object.getPrototypeOf(v) === Object.prototype;

const readPath = (obj, path) => path.split('.').reduce((node, key) => node?.[key], obj);

export function createChangeTracker(target) {
  const originals = new Map();

  const wrap = (obj, prefix) =>
    new Proxy(obj, {
      get(t, key, receiver) {
        const value = Reflect.get(t, key, receiver);
        return typeof key === 'string' && isPlainObject(value) ? wrap(value, `${prefix}${key}.`) : value;
      },
      set(t, key, value, receiver) {
        const path = `${prefix}${String(key)}`;
        if (!originals.has(path)) originals.set(path, t[key]);
        const ok = Reflect.set(t, key, value, receiver);
        if (Object.is(originals.get(path), value)) originals.delete(path);
        return ok;
      },
    });

  return {
    proxy: wrap(target, ''),
    getChanges: () =>
      [...originals.keys()]
        .toSorted()
        .map((path) => ({ path, from: originals.get(path), to: readPath(target, path) })),
    reset: () => originals.clear(),
  };
}
