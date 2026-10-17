// ex01 · describeValue — đáp án best practice
//
// - `v == null` thu hẹp null | undefined cùng lúc; sau đó TS biết v là string | number | boolean.
// - Mỗi `typeof` loại một khả năng; nhánh cuối không cần kiểm vì chỉ còn string.
// - Không dùng `if (!v)`: sẽ coi 0, false, '' là trống — sai nghĩa.
export function describeValue(v: string | number | boolean | null | undefined): string {
  if (v == null) return '(trống)';
  if (typeof v === 'boolean') return v ? 'có' : 'không';
  if (typeof v === 'number') return v.toFixed(2);
  const text = v.trim();
  return text === '' ? '(trống)' : text;
}
