// ex07 · Result combinators — đáp án best practice
//
// - Mỗi hàm generic theo T (giá trị), U (giá trị mới), E (lỗi) → kiểu chảy qua cả chuỗi mà không cần ghi tay.
// - andThen ("flatMap") cho phép nối các bước có thể thất bại mà không lồng if: parse → validate → save.
// - combine: dừng ở lỗi đầu tiên; mảng rỗng → ok([]).
// Thư viện: neverthrow, ts-results, Effect.
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function mapResult<T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

export function andThen<T, U, E>(r: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return r.ok ? fn(r.value) : r;
}

export function combine<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const r of results) {
    if (!r.ok) return r;
    values.push(r.value);
  }
  return ok(values);
}
