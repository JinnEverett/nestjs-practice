# T06 · Decorators & reflect-metadata

Đọc khoảng 12 phút. Sau module này, `@Controller`, `@Get`, `@Injectable`, `@Inject`, `@Column`, `@IsEmail` của NestJS/TypeORM/class-validator sẽ không còn là "phép màu".

## Mục tiêu: sau buổi này bạn làm được
- Viết 4 loại decorator (class, method, property, parameter) và decorator factory (decorator nhận tham số).
- Hiểu thứ tự decorator được áp dụng.
- Ghi/đọc metadata bằng `reflect-metadata`; đọc `design:type`, `design:paramtypes` do TypeScript sinh ra.
- Bọc method bằng decorator mà vẫn giữ `this` (log, đo thời gian, cache, retry, timeout).
- Tự viết bản mini của: router decorator, validation decorator, injection decorator.

---

## 1. Hai loại decorator
| | Legacy (`experimentalDecorators`) | TC39 (chuẩn, TS 5+) |
|---|---|---|
| Ai dùng | **NestJS, TypeORM, class-validator, Angular** | thư viện mới |
| Parameter decorator | ✅ | ❌ |
| `emitDecoratorMetadata` | ✅ | ❌ |
Vì NestJS dựa vào parameter decorator và `design:paramtypes`, module này học **legacy decorator** (tsconfig của bài đã bật 2 cờ `experimentalDecorators` + `emitDecoratorMetadata`).

## 2. Decorator là hàm, chạy lúc định nghĩa class
```ts
function Log(target: object, key: string | symbol, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (this: unknown, ...args: unknown[]) {   // function thường → giữ this
    console.log('gọi', String(key), args);
    return original.apply(this, args);
  };
}
class OrderService {
  @Log place(id: number) { /* ... */ }
}
```
| Loại | Tham số | Dùng để |
|---|---|---|
| class | `(constructor)` | đăng ký class, ghi metadata, (hiếm) thay class |
| method | `(prototype, tên, descriptor)` | bọc method, ghi metadata route/role |
| property | `(prototype, tên)` | ghi metadata cột/validate (không có descriptor!) |
| parameter | `(target, tên method hoặc undefined nếu constructor, index)` | ghi metadata inject / param binding |

**Decorator factory**: hàm trả về decorator → `@Get(':id')`, `@Roles('admin')`.

## 3. Thứ tự
- Decorator chạy **một lần khi class được định nghĩa** (lúc module được import), không phải mỗi lần gọi method.
- Trên cùng một method, decorator được **áp dụng từ dưới lên**: `@A @B m()` = `A(B(m))` → `A` bọc ngoài cùng.
- Biểu thức factory (`@A()`) được **tính** từ trên xuống, nhưng decorator trả về được **áp dụng** từ dưới lên.

## 4. reflect-metadata
```ts
import 'reflect-metadata';
Reflect.defineMetadata('roles', ['admin'], OrdersController.prototype, 'remove');
Reflect.getMetadata('roles', OrdersController.prototype, 'remove');   // ['admin'] (tìm cả lớp cha)
Reflect.getOwnMetadata(...);                                         // chỉ chính nó
```
Với `emitDecoratorMetadata`, TS tự ghi cho mọi chỗ có decorator:
- `design:type` — kiểu của property (`String`, `Number`, `Date`, class…)
- `design:paramtypes` — mảng kiểu tham số của constructor/method → **đây là cách Nest biết cần inject gì**
- `design:returntype`
⚠️ Kiểu chỉ có ở lúc biên dịch (interface, union, `string | null`) ghi ra thành `Object` → Nest cần `@Inject(TOKEN)` cho interface.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| Wrapper bằng arrow function | mất `this` |
| Quên `import 'reflect-metadata'` (đúng 1 lần, ở entry) | `Reflect.getMetadata is not a function` |
| Inject theo interface không có token | Nest báo "can't resolve dependencies… (?)" |
| Import vòng giữa 2 file có class decorator dùng nhau | `design:paramtypes` chứa `undefined` → cần `forwardRef` |
| Decorator làm việc nặng | chạy lúc import → chậm khởi động |

## Bên trong NestJS dùng cái này ở đâu
- `@Controller/@Get` = ex08; `@Roles` + `Reflector.getAllAndOverride` = ex05; `@Inject` + `design:paramtypes` = ex04 (C03); `@Column` của TypeORM = ex03 (B01); class-validator = ex06 (C05); interceptor timeout/retry = ex07 (C08, P09).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/T06-decorators-metadata NN`.
