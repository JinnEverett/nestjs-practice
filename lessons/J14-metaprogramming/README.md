# J14 · Metaprogramming: Symbol, property descriptor, Proxy, Reflect

Đọc khoảng 10 phút. Đây là "phép màu" bên dưới decorator, DI container, ORM, thư viện mock — học để **hiểu** framework, không phải để dùng hằng ngày trong code nghiệp vụ.

## Mục tiêu: sau buổi này bạn làm được
- Điều khiển thuộc tính bằng descriptor (`writable`, `enumerable`, `configurable`, getter/setter).
- Dùng `Symbol` làm key ẩn và các well-known symbol (`Symbol.iterator`, `Symbol.toPrimitive`, `Symbol.toStringTag`).
- Viết `Proxy` chặn đọc/ghi/xóa: validate, read-only view, theo dõi thay đổi (dirty checking), auto-mock.
- Dùng `Reflect` để chuyển tiếp thao tác mặc định trong trap.
- Tự viết một metadata registry kiểu `reflect-metadata` — chuẩn bị cho T06.

---

## 1. Property descriptor
```js
Object.defineProperty(user, 'id', {
  value: 7,
  writable: false,      // không gán lại được
  enumerable: false,    // không hiện trong Object.keys / JSON / for...in
  configurable: false,  // không xóa / defineProperty lại được
});
Object.getOwnPropertyDescriptor(user, 'id');
```
Thuộc tính tạo bằng gán thường có cả 3 cờ `true`; bằng `defineProperty` thì mặc định `false`.
| | Thêm key mới | Xóa | Sửa giá trị |
|---|---|---|---|
| `Object.preventExtensions` | ❌ | ✅ | ✅ |
| `Object.seal` | ❌ | ❌ | ✅ |
| `Object.freeze` | ❌ | ❌ | ❌ |

## 2. Symbol
```js
const SECRET = Symbol('secret');      // luôn duy nhất
obj[SECRET] = 'x';                    // không đụng key chuỗi nào; ẩn khỏi Object.keys và JSON
Symbol.for('app.id') === Symbol.for('app.id');   // registry toàn cục → true
Reflect.ownKeys(obj);                 // mọi key, cả symbol
```
Well-known symbol: `Symbol.iterator` (J13), `Symbol.asyncIterator`, `Symbol.toPrimitive` (ép kiểu), `Symbol.toStringTag` (`Object.prototype.toString`).

## 3. Proxy & Reflect
```js
const logged = new Proxy(target, {
  get(target, key, receiver) {
    console.log('đọc', key);
    return Reflect.get(target, key, receiver);   // hành vi mặc định
  },
  set(target, key, value, receiver) {
    if (key === 'age' && typeof value !== 'number') throw new TypeError('age');
    return Reflect.set(target, key, value, receiver);   // trap set phải trả true/false
  },
  deleteProperty(target, key) { /* ... */ },
  has(target, key) { /* toán tử in */ },
});
```
- Mỗi trap có một hàm `Reflect.*` cùng tên cùng tham số → luôn dùng `Reflect` để "làm như bình thường".
- Proxy chỉ chặn thao tác **đi qua proxy**; code giữ tham chiếu object gốc thì không bị chặn.
- Proxy có chi phí: không dùng trong vòng lặp nóng.

## 4. Metadata — nền của decorator
Framework cần "ghi chú" lên class/method: route path, kiểu tham số constructor, role được phép… `reflect-metadata` cung cấp `Reflect.defineMetadata(key, value, target, propertyKey)` và `Reflect.getMetadata(...)` (tra cả chuỗi prototype → lớp con thừa hưởng metadata của lớp cha). Bên dưới chỉ là `WeakMap<target, Map<propertyKey, Map<key, value>>>` — bạn tự viết ở ex07.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| `defineProperty` quên `enumerable: true` | field biến mất khỏi JSON response |
| Proxy không xử lý `then` | `await proxy` treo hoặc gọi nhầm (ex08) |
| Trap `set` không `return true` | strict mode ném TypeError |
| Dùng Proxy cho business logic thường | khó debug, chậm — chỉ dùng cho hạ tầng/thư viện |

## Bên trong NestJS dùng cái này ở đâu
- `@Controller('orders')`, `@Get(':id')`, `@Roles('admin')` = ghi metadata lên class/method; Nest đọc lại bằng `Reflector` (C08).
- DI đọc `design:paramtypes` (metadata TypeScript sinh ra) để biết constructor cần inject gì (T06, T07, C03).
- TypeORM theo dõi thay đổi entity (dirty checking — ex05); thư viện mock tự sinh method (ex08, Q01).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J14-metaprogramming NN`.
