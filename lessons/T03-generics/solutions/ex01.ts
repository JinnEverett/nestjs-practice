// ex01 · first / last / compact — đáp án best practice
//
// - `readonly T[]` nhận cả mảng thường lẫn mảng readonly/tuple `as const`; T suy ra từ phần tử.
// - `xs.at(-1)` đọc phần tử cuối; với noUncheckedIndexedAccess cả xs[0] và at() đều trả T | undefined — trung thực.
// - compact: type predicate `(x): x is T` trong filter → TS biết kết quả là T[] (không còn null/undefined).
//   So sánh `x != null` (không dùng truthiness) để giữ 0, '', false.
export function first<T>(xs: readonly T[]): T | undefined {
  return xs[0];
}

export function last<T>(xs: readonly T[]): T | undefined {
  return xs.at(-1);
}

export function compact<T>(xs: readonly (T | null | undefined)[]): T[] {
  return xs.filter((x): x is T => x != null);
}
