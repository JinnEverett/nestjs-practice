# J05 · Object & array: tham chiếu vs giá trị

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Giải thích vì sao sửa "bản sao" lại làm hỏng bản gốc (reference), và khi nào copy nông là đủ.
- Dùng thành thạo destructuring, spread/rest, shorthand, computed key.
- Cập nhật dữ liệu **bất biến** (immutable update) mà vẫn chia sẻ phần không đổi.
- Chọn đúng giữa spread, `structuredClone`, `JSON.parse(JSON.stringify())`.
- Map entity → response DTO an toàn (không lộ field nhạy cảm) và chặn prototype pollution khi merge input.

---

## 1. Biến giữ tham chiếu tới object
```js
const a = { n: 1 };
const b = a;          // b và a trỏ CÙNG object
b.n = 2;              // a.n cũng là 2
{ n: 1 } === { n: 1 } // false — hai object khác nhau
```
Truyền object vào hàm = truyền **tham chiếu**: hàm sửa thuộc tính thì caller thấy; hàm gán lại tham số (`u = {...}`) thì caller không thấy.

## 2. Copy nông vs copy sâu
| Cách | Độ sâu | Giữ Date/Map/Set | Ghi chú |
|---|---|---|---|
| `{ ...obj }`, `[...arr]`, `Object.assign({}, obj)` | 1 tầng | tham chiếu cũ | nhanh, đủ cho update bất biến |
| `structuredClone(obj)` | sâu | ✅ | không clone được function, class instance mất prototype |
| `JSON.parse(JSON.stringify(obj))` | sâu | ❌ Date → chuỗi, mất `undefined`, `NaN` → `null`, lỗi với BigInt/vòng | chỉ dùng cho dữ liệu JSON thuần |

## 3. Destructuring & spread
```js
const { id, profile: { fullName }, roles = [], ...rest } = user;   // đổi tầng, default, rest
const [first, , third = 'z', ...others] = list;
const merged = { ...defaults, ...overrides };   // vế sau thắng
const key = 'status';
const patch = { [key]: 'paid', updatedAt };      // computed key + shorthand
```
- Default trong destructuring chỉ áp dụng khi giá trị là `undefined` (không phải `null`).
- Spread copy **giá trị hiện tại** của getter, không copy getter.

## 4. Update bất biến
Thay vì sửa tại chỗ, tạo object mới **dọc theo đường bị đổi** và giữ nguyên tham chiếu các nhánh còn lại (structural sharing):
```js
const next = {
  ...state,
  cart: {
    ...state.cart,
    items: state.cart.items.map((it) => (it.id === id ? { ...it, qty: it.qty + 1 } : it)),
  },
};
```
Lợi ích: không có hiệu ứng phụ bất ngờ, so sánh thay đổi bằng `===`, dễ test.

## 5. `Object.freeze` là nông
```js
const cfg = Object.freeze({ db: { host: 'x' } });
cfg.db.host = 'y';   // vẫn sửa được! freeze chỉ khóa 1 tầng
```

## 6. Prototype pollution
Merge đệ quy object từ input người dùng mà không lọc key `__proto__` → có thể gắn thuộc tính vào `Object.prototype` của **toàn bộ process**:
```js
const evil = JSON.parse('{"__proto__": {"isAdmin": true}}');
naiveMerge({}, evil);
({}).isAdmin;   // true 😱
```
Luôn bỏ qua `__proto__`, `constructor`, `prototype` khi merge; dùng `Object.hasOwn`; hoặc dùng `Map`/`Object.create(null)`.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| Default param là object dùng chung ở module scope | mọi lần gọi sửa cùng một object |
| `arr.sort()`, `arr.reverse()`, `arr.splice()` | sửa mảng gốc (J06: dùng `toSorted`, `toReversed`, `toSpliced`) |
| Trả thẳng entity ra API | lộ `passwordHash` và field nội bộ |
| Copy nông rồi sửa mảng/object con | bản gốc bị sửa theo |

## Bên trong NestJS dùng cái này ở đâu
- Response DTO / `ClassSerializerInterceptor` (A01) giải quyết đúng bài toán ex06: không trả entity thô.
- `ValidationPipe({ whitelist: true })` (C05) loại field lạ trong body — một lớp phòng thủ cho ex07.
- Config namespace của `@nestjs/config` merge default + env (ex07).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J05-objects-arrays NN`.
