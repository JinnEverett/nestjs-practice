# T04 · Class, OOP & SOLID trong TypeScript

Đọc khoảng 12 phút.

## Mục tiêu: sau buổi này bạn làm được
- Dùng access modifier (`public/private/protected`), `readonly`, parameter property, `abstract`, `implements`.
- Hiểu **structural typing**: TS so hình dạng, không so tên class.
- Áp dụng SOLID ở mức thực dụng — đặc biệt **Dependency Inversion**: phụ thuộc vào interface, nhận dependency qua constructor. Đây chính là nền của DI trong NestJS.
- Nhận ra và dùng các pattern hay gặp: Strategy, Template Method, Factory, Adapter, Decorator (object).

---

## 1. Class trong TypeScript
```ts
class BankAccount {
  // parameter property: khai báo + gán field ngay trong constructor
  constructor(private readonly owner: string, private balanceVnd = 0) {}
  get balance(): number { return this.balanceVnd; }
  deposit(amount: number): void { this.balanceVnd += amount; }
}
```
| Modifier | Truy cập từ | Ghi chú |
|---|---|---|
| `public` (mặc định) | mọi nơi | |
| `protected` | class + lớp con | |
| `private` | chỉ class đó | **chỉ lúc biên dịch** — runtime vẫn đọc được; cần ẩn thật thì dùng `#field` |
| `readonly` | gán trong constructor rồi khóa | |

`abstract class` không `new` được, có thể có method `abstract` (lớp con bắt buộc cài đặt). `implements Interface` buộc class có đủ thành viên của interface.

## 2. Structural typing
```ts
interface Mailer { send(to: string, body: string): Promise<void> }
const fake: Mailer = { send: async () => {} };   // OK — không cần "implements"
```
Bất kỳ object nào có đủ hình dạng đều dùng được → **viết fake cho test rất dễ**.

## 3. SOLID thực dụng
| Nguyên tắc | Ý chính | Dấu hiệu vi phạm |
|---|---|---|
| **S**ingle responsibility | một lý do để thay đổi | service vừa tính giá, vừa gửi mail, vừa ghi file |
| **O**pen/closed | thêm hành vi bằng cách thêm code, không sửa code cũ | `if (type === 'a') ... else if (type === 'b')` dài ra mãi |
| **L**iskov substitution | lớp con dùng thay lớp cha được | lớp con ném "not supported" cho method của cha |
| **I**nterface segregation | interface nhỏ, đúng nhu cầu | interface 20 method, ai implement cũng phải giả 15 cái |
| **D**ependency inversion | phụ thuộc vào abstraction, nhận dependency từ ngoài | `new PostgresDb()`, `Date.now()` cứng bên trong service |

```ts
// ❌ khó test, khó thay
class OrderService { private db = new PostgresDb(); place() { /* ... */ Date.now() } }
// ✅ dependency được tiêm vào (constructor injection)
class OrderService {
  constructor(private readonly orders: OrderRepository, private readonly mailer: Mailer, private readonly clock: Clock) {}
}
```
NestJS làm phần "tiêm" tự động: bạn khai báo constructor, container tạo và truyền dependency (C03).

## 4. Pattern hay gặp
| Pattern | Dùng khi | Ví dụ |
|---|---|---|
| Strategy | nhiều thuật toán thay thế nhau | phí ship theo gói |
| Template Method | khung xử lý cố định, vài bước khác nhau | gửi thông báo: validate → format → send |
| Factory | tạo đúng implementation theo config | chọn email/SMS |
| Adapter | ghép thư viện có API khác vào interface của mình | SDK thanh toán cũ |
| Decorator (object) | bọc thêm hành vi (cache, log, retry) mà không sửa class gốc | repository có cache |

**Composition over inheritance**: ưu tiên ghép object (truyền vào) hơn kế thừa nhiều tầng.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| `private` tưởng là bảo mật | runtime vẫn đọc được — dữ liệu nhạy cảm cần `#private` hoặc không đưa vào object |
| Kế thừa để tái sử dụng tiện ích | cây kế thừa cứng nhắc → dùng composition |
| `new` dependency bên trong | không test, không thay được |
| Interface "cho có" với 1 implementation mãi mãi | trừu tượng thừa — chỉ tách khi cần thay/fake |

## Bên trong NestJS dùng cái này ở đâu
- Service nhận repository/client qua constructor; test thay bằng fake (Q01).
- Interface + injection token để đổi implementation (C03: `{ provide: PAYMENT_GATEWAY, useClass: StripeGateway }`).
- Strategy của Passport (A02), adapter Express/Fastify (P04), decorator pattern cho cache repository (B07).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/T04-oop-solid NN`.
