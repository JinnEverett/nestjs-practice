// ex01 · typeOf — đáp án best practice
//
// Vì sao viết thế này:
// - Xử lý 3 trường hợp `typeof` "nói dối" trước, theo thứ tự rõ ràng, rồi rơi về `typeof`.
// - `value === null` là cách duy nhất chắc chắn để nhận ra null (typeof null === 'object').
// - `Array.isArray` đúng cả với mảng tạo từ realm khác (iframe, vm) — `instanceof Array` thì không.
// - `Number.isNaN` KHÔNG ép kiểu: Number.isNaN('abc') === false, còn isNaN('abc') === true (bẫy).
export function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isNaN(value)) return 'nan';
  return typeof value;
}
