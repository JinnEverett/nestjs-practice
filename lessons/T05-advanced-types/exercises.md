# T05 · Bài tập

Viết vào `answers/exNN.ts`. Chấm: `bash lessons/check.sh lessons/T05-advanced-types 01`. Đáp án: `solutions/`.
Phần lớn test là **test kiểu** (`Expect<Equal<…>>`, `@ts-expect-error`). Không dùng `any`.

**Pass:** 6/8 bài, `tsc` sạch, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · keyof, typeof, indexed access
```ts
export const ROUTES = { home: '/', orders: '/orders', orderDetail: '/orders/:id' } as const;
export type RouteName = …;   // 'home' | 'orders' | 'orderDetail'  (dẫn xuất, không gõ tay)
export type RoutePath = …;   // '/' | '/orders' | '/orders/:id'
export function routePath(name: RouteName): RoutePath
export type OrderItem = …;   // kiểu phần tử của Order['items'] (Order cho sẵn trong đề — copy vào file)
```
```ts
export interface Order { id: number; items: { productId: number; qty: number }[] }
```

### ex02 · Tự viết mapped types
`MyPartial<T>`, `MyReadonly<T>`, `Mutable<T>` (bỏ readonly), `Nullable<T>` (mọi field thêm `| null`), `DeepReadonly<T>` (đệ quy mọi tầng object/mảng, function giữ nguyên). Kèm hàm `deepFreeze<T>(obj: T): DeepReadonly<T>` (freeze thật lúc chạy).

### ex03 · Conditional type & infer
`ElementType<T>` (phần tử của mảng, không phải mảng → `never`), `MyAwaited<T>` (mở Promise lồng nhau), `FirstArg<F>` (kiểu tham số đầu của hàm, hàm không tham số → `never`), `MyReturnType<F>`. Kèm hàm runtime `isPromiseLike(x: unknown): x is PromiseLike<unknown>`.

---

## 🟡 Kết hợp

### ex04 · Route params từ chuỗi path
```ts
export type RouteParams<P extends string> = …;   // '/users/:userId/orders/:orderId' → 'userId' | 'orderId'
export function buildPath<P extends string>(path: P, params: Record<RouteParams<P>, string | number>): string
```
Thiếu param / param thừa → lỗi biên dịch. Lúc chạy: thay `:name` bằng giá trị đã `encodeURIComponent`.

### ex05 · Dẫn xuất DTO từ entity
Cho entity (copy vào file):
```ts
export interface UserEntity { id: number; email: string; passwordHash: string; fullName: string; role: 'user' | 'admin'; createdAt: Date; updatedAt: Date }
```
Dẫn xuất (không gõ lại field):
- `CreateUserDto` = mọi field trừ `id`, `passwordHash`, `createdAt`, `updatedAt`, `role`, **thêm** `password: string`
- `UpdateUserDto` = `CreateUserDto` tất cả optional, trừ `email` (không cho đổi email)
- `UserResponse` = entity bỏ `passwordHash`, với `createdAt`/`updatedAt` là `string`
- `toUserResponse(user: UserEntity): UserResponse`

### ex06 · Key remapping & template literal
- `type EventName<E extends string> = …` → `` `${E}.created` | `${E}.updated` | `${E}.deleted` ``
- `type Getters<T> = …` → `{ getName: () => string, getAge: () => number }` từ `{ name: string; age: number }`
- `createGetters<T extends Record<string, unknown>>(obj: T): Getters<T>` lúc chạy

### ex07 · Action creator có kiểu
```ts
export type CartAction = { type: 'add'; productId: number; qty: number } | { type: 'remove'; productId: number } | { type: 'clear' };
export type PayloadOf<T extends CartAction['type']> = …;   // các field của action đó trừ 'type'
export function action<T extends CartAction['type']>(type: T, payload: PayloadOf<T>): Extract<CartAction, { type: T }>
```
`action('add', { productId: 1, qty: 2 })` có kiểu đúng nhánh add; payload sai → lỗi biên dịch.

---

## 🔴 Thực tế

### ex08 · Đọc config theo đường dẫn có kiểu
```ts
export type Paths<T> = …;          // mọi đường dẫn 'a' | 'a.b' | … đi qua object thường; mảng và Date là lá
export type PathValue<T, P> = …;   // kiểu giá trị tại đường dẫn
export function get<T, P extends Paths<T>>(obj: T, path: P): PathValue<T, P>
```
```ts
get(config, 'db.port')   // number
get(config, 'db.user')   // ❌ lỗi biên dịch
```
