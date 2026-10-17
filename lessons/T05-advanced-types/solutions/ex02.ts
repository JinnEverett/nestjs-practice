// ex02 · Mapped types — đáp án best practice
//
// - `[K in keyof T]` duyệt mọi key; modifier `?`, `readonly`, `-readonly` thêm/bỏ thuộc tính.
// - DeepReadonly: function giữ nguyên (kiểm trước), object/mảng đệ quy; mapped type trên mảng tự ra readonly array.
// - deepFreeze trả về DeepReadonly<T> — kiểu khớp với hành vi lúc chạy (nhất quán giữa type và runtime).
export type MyPartial<T> = { [K in keyof T]?: T[K] };
export type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
export type Mutable<T> = { -readonly [K in keyof T]: T[K] };
export type Nullable<T> = { [K in keyof T]: T[K] | null };

export type DeepReadonly<T> = T extends (...args: never[]) => unknown ? T : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;

export function deepFreeze<T>(obj: T): DeepReadonly<T> {
  if (typeof obj === 'object' && obj !== null) {
    Object.values(obj).forEach(deepFreeze);
    Object.freeze(obj);
  }
  return obj as DeepReadonly<T>;
}
