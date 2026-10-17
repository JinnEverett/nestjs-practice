# J08 · Prototype & class

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Giải thích prototype chain: method nằm ở đâu, `in` khác `Object.hasOwn` thế nào.
- Viết class đầy đủ: constructor, field, `#private`, getter/setter, `static`, `extends`/`super`.
- Thiết kế value object bất biến (Money) và entity có state machine (Order).
- Hiểu thứ tự khởi tạo field khi kế thừa (bẫy gọi method bị override trong constructor cha).
- Dùng mixin (hàm trả về class) — cùng ý tưởng với `PartialType()` của NestJS.

---

## 1. Prototype chain
Mỗi object có một liên kết ẩn tới **prototype** của nó. Đọc thuộc tính không có trên object → JS tìm tiếp lên prototype, rồi prototype của prototype… tới `null`.
```js
const base = { greet() { return 'hi ' + this.n; } };
const child = Object.create(base);   // prototype của child là base
child.n = 'An';
child.greet();                       // 'hi An' — greet tìm thấy trên base, this = child
Object.hasOwn(child, 'greet');       // false
'greet' in child;                    // true (in tìm cả prototype chain)
```

## 2. `class` là cú pháp gọn cho prototype
```js
class Animal {
  static count = 0;                  // thuộc về class
  #secret = 'x';                     // private thật sự (không truy cập được từ ngoài, kể cả lớp con)
  name;                              // field công khai, khởi tạo cho từng instance
  constructor(name) { this.name = name; Animal.count++; }
  speak() { return `${this.name} kêu`; }   // nằm trên Animal.prototype, dùng chung
  get upper() { return this.name.toUpperCase(); }
  static create(name) { return new this(name); }   // `this` = class đang gọi (lớp con → lớp con)
}
class Dog extends Animal {
  speak() { return super.speak() + ' gâu'; }       // gọi method của lớp cha
}
```
- Class bắt buộc gọi bằng `new`; thân class luôn **strict mode**.
- Lớp con có constructor thì phải gọi `super(...)` **trước** khi dùng `this`.
- `#private` khác quy ước `_private`: ngoài class không đọc được, `#x in obj` để kiểm tra.

## 3. Thứ tự khởi tạo khi kế thừa
1. Gọi `new Child()` → constructor Child chạy tới `super()`
2. Constructor **Base** chạy: field của Base được khởi tạo, rồi thân constructor Base
3. Quay lại Child: field của **Child** được khởi tạo, rồi phần còn lại constructor Child

⇒ Constructor cha gọi method bị lớp con override, method đó đọc field của lớp con → **`undefined`** (field con chưa khởi tạo). Tránh gọi method có thể bị override trong constructor.

## 4. Getter/setter & validation
```js
class Product {
  #price = 0;
  get price() { return this.#price; }
  set price(v) {
    if (!Number.isSafeInteger(v) || v < 0) throw new RangeError('price');
    this.#price = v;
  }
  toJSON() { return { price: this.#price }; }   // JSON.stringify gọi toJSON nếu có
}
```

## 5. Value object vs entity
| | Value object (Money, Email, DateRange) | Entity (Order, User) |
|---|---|---|
| Định danh | bằng **giá trị** (`equals`) | bằng **id** |
| Thay đổi | **bất biến** — thao tác trả object mới | có state, đổi theo vòng đời |
| Ví dụ | `price.add(tax)` | `order.pay()` |

## 6. Mixin: hàm nhận class, trả class
```js
const withTimestamps = (Base) => class extends Base {
  createdAt = new Date();
  touch() { this.updatedAt = new Date(); }
};
class Post extends withTimestamps(BaseEntity) {}
```
NestJS dùng đúng kỹ thuật này: `PartialType(CreateUserDto)` trả về một class mới được sinh ra lúc chạy (C05).

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| Arrow function field làm method, rồi lớp con gọi `super.method()` | `super.method` là `undefined` (arrow field nằm trên instance, không trên prototype) |
| Gọi method bị override trong constructor cha | đọc field lớp con → `undefined` |
| Getter không có setter + gán | TypeError (strict) |
| Lưu mảng nội bộ rồi trả thẳng ra ngoài | bên ngoài sửa được state (trả bản copy) |
| Kế thừa nhiều tầng để tái sử dụng code | khó đổi; ưu tiên **composition** (truyền dependency vào) — chính là DI |

## Bên trong NestJS dùng cái này ở đâu
- Mọi thứ trong Nest là class: module, controller, service, guard, pipe, DTO, entity.
- Custom exception kế thừa `HttpException` (C06), entity kế thừa base entity có timestamp (B01), DTO sinh bằng mapped types/mixin (C05).
- Value object + state machine là lõi của domain model sạch (B06, M01, D03).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J08-prototype-class NN`.
