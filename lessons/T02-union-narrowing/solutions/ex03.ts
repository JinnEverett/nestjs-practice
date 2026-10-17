// ex03 · Result — đáp án best practice
//
// - Discriminated union theo `ok`: caller BẮT BUỘC kiểm r.ok trước khi đọc value — lỗi không thể bị quên
//   như khi throw mà không catch.
// - Generic T, E (E mặc định string) — T03 đi sâu.
// - ok/err là factory nhỏ: kiểu trả về `Result<T, never>` / `Result<never, E>` gán được vào mọi Result.
// - Dùng Result cho lỗi NGHIỆP VỤ dự đoán được (input sai); vẫn throw cho lỗi bất thường (DB sập).
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export function parseQuantity(input: string): Result<number> {
  const n = Number(input);
  if (input.trim() === '' || !Number.isInteger(n)) return err('Số lượng phải là số nguyên');
  if (n < 1 || n > 99) return err('Số lượng phải từ 1 đến 99');
  return ok(n);
}
