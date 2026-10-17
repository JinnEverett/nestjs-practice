// ex08 · Paths / PathValue / get — đáp án best practice
//
// - Paths<T>: với mỗi key string K: nếu T[K] là "lá" (primitive, mảng, Date, function) → K;
//   nếu là object thường → K | `${K}.${Paths<T[K]>}`. Lấy union mọi giá trị bằng `[keyof T & string]`.
// - PathValue<T, P>: tách P theo dấu chấm bằng template literal + infer, đi xuống từng tầng.
// - Hàm get lúc chạy dùng reduce; một ép kiểu ở cuối (kiểu đã được chứng minh ở chữ ký).
// - Lưu ý: kiểu đệ quy sâu làm chậm tsc — chỉ dùng cho object cấu hình có độ sâu vừa phải.
type Leaf = string | number | boolean | bigint | symbol | null | undefined | Date | readonly unknown[] | ((...args: never[]) => unknown);

export type Paths<T> = {
  [K in keyof T & string]: T[K] extends Leaf ? K : K | `${K}.${Paths<T[K]>}`;
}[keyof T & string];

export type PathValue<T, P> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export function get<T, P extends Paths<T>>(obj: T, path: P): PathValue<T, P> {
  return path.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], obj) as PathValue<T, P>;
}
