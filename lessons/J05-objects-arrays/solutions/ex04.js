// ex04 · deepEqual — đáp án best practice
//
// - Bắt đầu bằng phép so nhanh: `a === b` (cùng tham chiếu hoặc primitive bằng nhau, kể cả 0 === -0),
//   rồi NaN (Number.isNaN cả hai).
// - Loại sớm mọi trường hợp khác kiểu: không phải object, null, mảng vs không mảng, Date vs không Date.
// - Object: so số key trước (rẻ), rồi từng key với Object.hasOwn để { a: undefined } ≠ { b: undefined }.
// - Đệ quy cho phần tử con. (Không xử lý vòng — thư viện thật như node:util isDeepStrictEqual có xử lý.)
export function deepEqual(a, b) {
  if (a === b) return true;
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]));
}
