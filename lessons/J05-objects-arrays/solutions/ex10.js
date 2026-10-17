// ex10 · diffObjects — đáp án best practice
//
// - Hợp các key của cả hai object bằng Set → duyệt mỗi key một lần.
// - `Object.hasOwn` để phân biệt "không có key" với "key có giá trị undefined".
// - Tái sử dụng deepEqual (ex04) thay vì so `!==` → mảng/object/Date giống nhau không bị báo đổi.
// - Sắp xếp bằng `toSorted` + localeCompare → không mutate, kết quả ổn định cho audit log.
// - `ignore` có default → caller thường không phải truyền.
import { deepEqual } from './ex04.js';

export function diffObjects(before, after, ignore = ['updatedAt']) {
  const ignored = new Set(ignore);
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((k) => !ignored.has(k));

  return keys
    .toSorted((a, b) => a.localeCompare(b))
    .flatMap((key) => {
      const inBefore = Object.hasOwn(before, key);
      const inAfter = Object.hasOwn(after, key);
      if (!inBefore) return [{ key, type: 'added', to: after[key] }];
      if (!inAfter) return [{ key, type: 'removed', from: before[key] }];
      if (deepEqual(before[key], after[key])) return [];
      return [{ key, type: 'changed', from: before[key], to: after[key] }];
    });
}
