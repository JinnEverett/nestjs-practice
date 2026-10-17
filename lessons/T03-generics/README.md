# T03 · Generics

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Viết hàm/class/interface generic giữ được kiểu xuyên suốt (không rơi về `any`/`unknown`).
- Ràng buộc tham số kiểu bằng `extends`, dùng `keyof` và indexed access `T[K]`.
- Đặt giá trị mặc định cho tham số kiểu; để TS tự suy luận tham số kiểu từ đối số.
- Thiết kế API generic thực dụng: repository, cache, event emitter có kiểu, query builder.

---

## 1. Vì sao cần generic
```ts
function firstAny(xs: any[]): any { return xs[0]; }          // mất kiểu
function first<T>(xs: readonly T[]): T | undefined { return xs[0]; }
const n = first([1, 2]);        // number | undefined — T được SUY RA là number
const s = first<string>([]);    // ghi tường minh khi không suy ra được
```
Generic = "hàm của kiểu": kiểu đầu ra phụ thuộc kiểu đầu vào.

## 2. Ràng buộc (constraint)
```ts
function byId<T extends { id: number }>(items: readonly T[], id: number): T | undefined {
  return items.find((x) => x.id === id);   // được đọc x.id vì T chắc chắn có id
}
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {   // T[K]: kiểu của thuộc tính K
  return obj[key];
}
getProp({ name: 'An', age: 30 }, 'age');   // number
getProp({ name: 'An' }, 'email');          // ❌ lỗi biên dịch
```

## 3. Class & interface generic, default type
```ts
interface ApiResponse<T, M = undefined> { data: T; meta: M }
class InMemoryRepository<T extends { id: number }> {
  #rows = new Map<number, T>();
  findById(id: number): T | undefined { return this.#rows.get(id); }
}
```

## 4. Map kiểu theo key (typed event emitter)
```ts
type Events = { 'order.created': { orderId: number }; 'user.registered': { email: string } };
function on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void) { /* ... */ }
on('order.created', (p) => p.orderId);   // p: { orderId: number }
```

## 5. Nguyên tắc
- Tham số kiểu phải **xuất hiện ít nhất 2 lần** (liên kết đầu vào với đầu ra); dùng một lần thì thay bằng kiểu cụ thể / `unknown`.
- Để TS suy luận; chỉ ghi `<T>` tường minh khi cần.
- Đừng "generic hóa" sớm: hai chỗ dùng giống nhau mới nên tổng quát.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| `function f<T>(x: T): any` | generic vô ích |
| `as T` bên trong hàm generic | nói dối, mất an toàn |
| Ràng buộc quá rộng (`T extends object`) rồi `as any` | dùng `keyof` / indexed access đúng cách |
| Quá nhiều tham số kiểu | khó đọc — tách hàm hoặc dùng object option |

## Bên trong NestJS dùng cái này ở đâu
- `Repository<User>` của TypeORM, `ConfigService<EnvVars>`, `ExecutionContext.switchToHttp().getRequest<Request>()`.
- Generic response wrapper `PaginatedResponse<T>` (C11), `CallHandler<T>` của interceptor (C08).
- QueryBuilder của TypeORM là builder generic (ex08, B04).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/T03-generics NN`.
