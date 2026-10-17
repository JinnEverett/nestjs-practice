# T07 · Bài tập — xây mini-nest từng bước

Code trong `answers/mini-nest/` (xem README), export mọi thứ qua `answers/mini-nest/index.ts`. File đầu tiên dùng metadata cần `import 'reflect-metadata';`.
Chấm từng bước: `bash lessons/check.sh lessons/T07-mini-framework 01` … `08`. Đáp án: `solutions/mini-nest/`.
**Không dùng thư viện ngoài** ngoài `reflect-metadata` và module có sẵn của Node.

**Pass:** mini-framework qua hết 8 bài test.

---

## Hợp đồng API (giữ đúng tên)
```ts
type Token<T = unknown> = string | symbol | (abstract new (...args: never[]) => T);
type Provider =
  | (new (...args: never[]) => unknown)                                   // class
  | { provide: Token; useClass: new (...args: never[]) => unknown }
  | { provide: Token; useValue: unknown }
  | { provide: Token; useFactory: (...args: never[]) => unknown; inject?: Token[] };

class Container { register(p: Provider): this; resolve<T>(token: Token<T>): T }
function Injectable(options?: { scope?: 'singleton' | 'transient' }): ClassDecorator
function Inject(token: Token): ParameterDecorator

function Controller(prefix?: string): ClassDecorator
function Get/Post/Put/Delete(path?: string): MethodDecorator
function Param(name: string) / Query(name: string) / Body(): ParameterDecorator
class HttpError extends Error { constructor(status: number, message: string) }

function createApp(opts: { controllers?: Function[]; providers?: Provider[] }): Promise<{
  container: Container;
  handle(req: { method: string; url: string; body?: unknown }): Promise<{ status: number; body?: unknown }>;
  listen(port?: number): Promise<{ port: number; close(): Promise<void> }>;
}>
```

---

## 🟢 Container

### ex01 · Đăng ký & resolve class không tham số
`register(Class)` rồi `resolve(Class)` → instance; gọi lại trả **cùng instance** (singleton). Token chưa đăng ký → `Error` chứa `'No provider for <Tên>'`. `register` trả `this`.

### ex02 · Constructor injection
Class có `@Injectable()` và tham số constructor là class → container tự resolve đệ quy theo `design:paramtypes`. Các consumer dùng chung singleton. Dependency chưa đăng ký → lỗi nhắc tên dependency.

### ex03 · Custom provider & `@Inject`
`useValue`, `useClass` (token trỏ tới class khác), `useFactory` + `inject` (resolve token rồi truyền vào factory), token chuỗi/symbol qua `@Inject(token)`. Factory chỉ chạy **một lần**.

---

## 🟡 Nâng cao

### ex04 · Phát hiện vòng phụ thuộc
Vòng A → B → A → `Error` có message chứa đường đi `'A -> B -> A'` (token chuỗi in nguyên, symbol in `description`, class in `name`).

### ex05 · Scope transient
`@Injectable({ scope: 'transient' })` → mỗi lần resolve (và mỗi consumer) nhận instance **mới**; mặc định singleton.

### ex06 · Router & param decorator
`createApp({ controllers, providers })`:
- controller được container tạo (có constructor injection)
- `handle({ method, url, body })` khớp route theo method + path (`/products/:id`), dựng tham số handler từ `@Param`, `@Query` (thiếu → `undefined`), `@Body`
- status: `POST` → 201, còn lại 200; body = giá trị handler trả về
- không khớp → `404`, `{ message: 'Cannot <METHOD> <pathname>' }`

---

## 🔴 Hoàn thiện

### ex07 · Lỗi, async, lifecycle
- handler `async` được `await`
- ném `HttpError(status, message)` → `{ status, body: { message } }`; lỗi khác → `500`, `{ message: 'Internal server error' }` (không lộ message gốc)
- `createApp` resolve **mọi** provider lúc khởi động, rồi gọi `await instance.onModuleInit()` (nếu có) theo **thứ tự instance được tạo** (dependency trước), tuần tự

### ex08 · Chạy HTTP thật
`listen(port = 0)` dùng `node:http`: đọc body, parse JSON (sai → `400 { message: 'Invalid JSON' }`), gọi `handle`, trả JSON với `content-type: application/json`. `close()` đóng server. Test gọi bằng `fetch`.
