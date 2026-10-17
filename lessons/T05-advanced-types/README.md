# T05 · Type nâng cao & utility types

Đọc khoảng 12 phút. Mục tiêu không phải viết "type gymnastics" hằng ngày, mà **đọc hiểu** kiểu của thư viện (NestJS, TypeORM, Prisma) và dẫn xuất kiểu thay vì khai báo trùng lặp.

## Mục tiêu: sau buổi này bạn làm được
- Dùng `keyof`, `typeof`, indexed access `T[K]`, `T[number]`.
- Dùng thành thạo utility type: `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Extract`, `Exclude`, `NonNullable`, `ReturnType`, `Parameters`, `Awaited`.
- Viết mapped type (kể cả key remapping `as`), conditional type với `infer`, template literal type.
- Dẫn xuất DTO từ entity, route params từ chuỗi path, đường dẫn config `'db.port'` có kiểu.

---

## 1. Lấy kiểu từ giá trị và từ kiểu khác
```ts
const ROUTES = { home: '/', order: '/orders/:id' } as const;
type RouteName = keyof typeof ROUTES;                  // 'home' | 'order'
type RoutePath = (typeof ROUTES)[RouteName];           // '/' | '/orders/:id'
type Item = Order['items'][number];                    // kiểu phần tử của mảng items
```

## 2. Utility types (có sẵn)
| Utility | Nghĩa |
|---|---|
| `Partial<T>` / `Required<T>` | mọi field optional / bắt buộc |
| `Readonly<T>` | mọi field readonly (nông) |
| `Pick<T, K>` / `Omit<T, K>` | giữ / bỏ một số key |
| `Record<K, V>` | object có key K, value V |
| `Extract<U, X>` / `Exclude<U, X>` | lọc union |
| `NonNullable<T>` | bỏ null/undefined |
| `ReturnType<F>`, `Parameters<F>`, `Awaited<P>` | kiểu trả về, tuple tham số, kiểu "mở" Promise |

## 3. Mapped type
```ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
type Mutable<T> = { -readonly [K in keyof T]: T[K] };            // bỏ readonly
type Getters<T> = { [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K] };   // đổi tên key
```

## 4. Conditional type & `infer`
```ts
type ElementType<T> = T extends readonly (infer E)[] ? E : never;
type UnwrapPromise<T> = T extends Promise<infer V> ? UnwrapPromise<V> : T;   // đệ quy
type IsString<T> = T extends string ? true : false;
```
Conditional type **phân phối** trên union: `IsString<string | number>` = `true | false` = `boolean`. Muốn tắt: bọc `[T] extends [string]`.

## 5. Template literal type
```ts
type EventName<E extends string> = `${E}.created` | `${E}.updated`;
type RouteParams<P> = P extends `${string}:${infer Param}/${infer Rest}` ? Param | RouteParams<`/${Rest}`>
  : P extends `${string}:${infer Param}` ? Param : never;
type X = RouteParams<'/users/:userId/orders/:orderId'>;   // 'userId' | 'orderId'
```

## 6. Khi nào dừng
Kiểu phức tạp làm lỗi biên dịch khó đọc và biên dịch chậm. Quy tắc: dẫn xuất kiểu khi nó **loại bỏ trùng lặp** hoặc **ngăn bug thật**; còn lại viết kiểu đơn giản, tường minh.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| Khai báo DTO bằng tay song song với entity | lệch nhau khi entity đổi → dẫn xuất bằng `Omit`/`Pick` |
| `Readonly<T>` tưởng là sâu | chỉ 1 tầng |
| `Omit<T, 'typo'>` | không lỗi! `Omit` nhận key bất kỳ → kiểm bằng `Pick`/`keyof` khi cần chặt |
| Conditional type phân phối ngoài ý muốn | bọc `[T]` |

## Bên trong NestJS dùng cái này ở đâu
- `PartialType`, `PickType`, `OmitType`, `IntersectionType` của `@nestjs/mapped-types` là phiên bản **lúc chạy** của `Partial/Pick/Omit` (giữ cả decorator validate) — C05.
- `ConfigService<Env, true>.get('db.port', { infer: true })` dùng kiểu đường dẫn giống ex08 (C09).
- Kiểu `FindOptionsWhere<T>` của TypeORM, kiểu sinh ra của Prisma là mapped/conditional type (B01, B08).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/T05-advanced-types NN`.
