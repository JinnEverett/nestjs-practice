// Helper cho bài tập type-level. Dùng trong checks/*.test.ts:
//   import type { Equal, Expect } from '../_lib/types.js';
//   type _1 = Expect<Equal<ReturnType<typeof fn>, number>>;
// Sai kiểu → tsc báo lỗi → check.sh chấm SAI.
export type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
export type Expect<T extends true> = T;
