# T03 · Bài tập

Viết vào `answers/exNN.ts`. Chấm: `bash lessons/check.sh lessons/T03-generics 01`. Đáp án: `solutions/`.
**Không dùng `any`.** Phần lớn test là test **kiểu**: kiểu suy ra phải chính xác.

**Pass:** 6/8 bài, `tsc` sạch, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Hàm generic đầu tiên
`first(xs)`, `last(xs)` (mảng `readonly T[]` → `T | undefined`) và `compact(xs)` — bỏ `null`/`undefined`, kiểu trả về **không còn** null/undefined: `compact<T>(xs: readonly (T | null | undefined)[]): T[]`.

### ex02 · `groupBy` có kiểu
`groupBy(items, keyFn)` → `Map<K, T[]>`, với `K` suy ra từ kiểu trả về của `keyFn`.
```ts
const m = groupBy(orders, (o) => o.status);   // Map<'paid' | 'pending', Order[]> nếu status là union đó
```

### ex03 · `pick` có kiểu
`pick(obj, keys)` → `Pick<T, K>`; `keys` chỉ được chứa key có thật của `obj` (sai tên → lỗi biên dịch).

---

## 🟡 Kết hợp

### ex04 · Repository trong bộ nhớ
`class InMemoryRepository<T extends { id: number }>`:
- `create(data: Omit<T, 'id'>): T` — id tự tăng từ 1
- `findById(id): T | undefined`, `findAll(where?: Partial<T>): T[]` (khớp mọi field trong `where` bằng `===`)
- `update(id, patch: Partial<Omit<T, 'id'>>): T` — không tìm thấy → `Error`
- `delete(id): boolean`
- Trả **bản copy** (sửa object trả về không làm đổi dữ liệu trong repo)

### ex05 · Event emitter có kiểu
`createEmitter<Events extends Record<string, unknown>>()` → `{ on(event, handler), emit(event, payload) }`:
- `on` trả hàm unsubscribe
- `handler` nhận **đúng kiểu payload** của event; `emit` với payload sai kiểu / tên event lạ → lỗi biên dịch

### ex06 · Ràng buộc với `keyof`
- `mergeDefaults<T extends object>(defaults: T, overrides: Partial<T>): T` — bỏ qua giá trị `undefined` trong overrides
- `sortByKey(items, key, dir = 'asc')` — chỉ chấp nhận `key` có giá trị **string hoặc number** (key trỏ tới boolean/object → lỗi biên dịch); trả mảng mới

### ex07 · Thao tác trên `Result<T, E>`
Với `type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`, export `ok`, `err`, và:
- `mapResult(r, fn)` — đổi value nếu ok
- `andThen(r, fn)` — `fn` trả Result (nối các bước có thể lỗi)
- `combine(results)` — tất cả ok → `ok(mảng value)`; ngược lại lỗi **đầu tiên**
Kiểu phải được suy ra đúng qua mọi bước.

---

## 🔴 Thực tế

### ex08 · Query builder có kiểu
`query<T>()` trả builder **bất biến** (mỗi lần gọi trả builder mới):
- `.where(key, value)` — `value` phải đúng kiểu `T[key]`
- `.whereIn(key, values)`
- `.orderBy(key, dir = 'asc')`
- `.limit(n)`, `.offset(n)`
- `.run(rows: readonly T[]): T[]` — lọc → sắp xếp → offset → limit
```ts
query<Product>().where('categoryId', 1).orderBy('price', 'desc').limit(2).run(products)
query<Product>().where('price', 'abc')   // ❌ lỗi biên dịch
```
