// ex03 · Conditional types & infer — đáp án best practice
//
// - `infer X` "bắt" một phần của kiểu trong mệnh đề extends.
// - MyAwaited đệ quy để mở Promise lồng (giống Awaited có sẵn, bản đó còn xử lý thenable).
// - FirstArg dùng tuple pattern `[infer A, ...unknown[]]` → hàm không tham số không khớp → never.
// - Function constraint dùng `(...args: never[]) => unknown` thay vì any: mọi hàm đều gán được vào kiểu này.
export type ElementType<T> = T extends readonly (infer E)[] ? E : never;
export type MyAwaited<T> = T extends Promise<infer V> ? MyAwaited<V> : T;
export type FirstArg<F> = F extends (...args: infer A) => unknown ? (A extends [infer First, ...unknown[]] ? First : never) : never;
export type MyReturnType<F> = F extends (...args: never[]) => infer R ? R : never;

export function isPromiseLike(x: unknown): x is PromiseLike<unknown> {
  return typeof x === 'object' && x !== null && 'then' in x && typeof x.then === 'function';
}
