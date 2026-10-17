# T04 · Bài tập

Viết vào `answers/exNN.ts`. Chấm: `bash lessons/check.sh lessons/T04-oop-solid 01`. Đáp án: `solutions/`.

**Pass:** 6/8 bài, `tsc` sạch, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Access modifier & parameter property
`class BankAccount`:
- `constructor(owner: string, initialBalance = 0)` — dùng **parameter property** cho `owner` (`readonly`, public)
- getter `balance` (chỉ đọc từ ngoài — gán `account.balance = …` là lỗi biên dịch)
- `deposit(amount)`, `withdraw(amount)` — amount phải là số nguyên dương (`RangeError`); rút quá số dư → `InsufficientFundsError` (export class, kế thừa `Error`, có field `shortBy`)
- `history` (getter) → bản copy mảng `{ type: 'deposit' | 'withdraw', amount }`

### ex02 · Abstract class & Template Method
`abstract class Notifier`:
- `async notify(to: string, message: string): Promise<void>` — **template method**: trim `message`; rỗng → `Error`; gọi `this.validateRecipient(to)` (sai → `Error`), rồi `await this.send(to, this.format(message))`
- `protected abstract validateRecipient(to: string): boolean`
- `protected abstract send(to: string, body: string): Promise<void>`
- `protected format(message: string): string` mặc định trả nguyên message

`class EmailNotifier extends Notifier` (`constructor(transport: (to, body) => Promise<void>)`; email phải có `@`; format thêm chữ ký `'\n--\nShop'`), `class SmsNotifier extends Notifier` (số VN `/^0\d{9}$/`; format cắt tối đa 160 ký tự).

### ex03 · Interface & Dependency Inversion
```ts
interface PaymentGateway { charge(amount: number, token: string): Promise<{ transactionId: string }> }
class PaymentService { constructor(gateway: PaymentGateway) ... pay(orderId: number, amount: number, token: string): Promise<PaymentRecord> }
interface PaymentRecord { orderId: number; amount: number; transactionId: string }
```
`pay`: amount ≤ 0 → `RangeError` (không gọi gateway); thành công → record. `PaymentService` **không** được import implementation cụ thể nào.

---

## 🟡 Kết hợp

### ex04 · Strategy: phí vận chuyển
```ts
interface Order { subtotal: number; weightKg: number }
interface ShippingStrategy { readonly name: string; calculate(order: Order): number }
```
Cài: `StandardShipping` (20 000 + 5 000/kg, làm tròn lên kg), `ExpressShipping` (gấp đôi Standard), `FreeShippingOver` (`constructor(threshold, fallback: ShippingStrategy)` — subtotal ≥ threshold → 0, ngược lại dùng fallback).
`class ShippingCalculator` — `constructor(strategies: ShippingStrategy[])`, `quote(order)` → `[{ name, fee }]` sắp phí tăng dần, `cheapest(order)`.

### ex05 · Factory theo config
```ts
type NotifierConfig = { type: 'console'; prefix: string } | { type: 'memory' } | { type: 'webhook'; url: string };
interface SimpleNotifier { send(to: string, body: string): Promise<string> }   // trả mô tả
createNotifier(config: NotifierConfig): SimpleNotifier
```
`console` → trả `'<prefix> <to>: <body>'`; `memory` → lưu vào mảng, trả `'stored #<n>'` (n bắt đầu 1, riêng từng notifier); `webhook` → trả `'POST <url>'`. switch exhaustive.

### ex06 · Adapter cho SDK cũ
`starter/legacy-pay.ts` là SDK cũ kiểu callback với tên field khác (`amt`, `cardToken`, kết quả `{ txn_id }`, lỗi `{ code, msg }`). Viết `class LegacyPayAdapter implements PaymentGateway` (dùng lại interface của ex03 — **import từ `./ex03.js`**): bọc SDK thành Promise, đổi tên field; lỗi SDK → reject `Error` có message `'<code>: <msg>'`.

---

## 🔴 Thực tế

### ex07 · 🐞 Refactor service không test được
`starter/ex07.ts` có `OrderService` tự `new` DB, mailer và gọi `new Date()` — không test được. Viết lại:
```ts
interface Order { id: number; customerEmail: string; total: number; createdAt: Date }
interface OrderRepository { save(data: Omit<Order, 'id'>): Promise<Order> }
interface Mailer { send(to: string, subject: string): Promise<void> }
interface Clock { now(): Date }
class OrderService { constructor(orders, mailer, clock) ; placeOrder(input: { customerEmail: string; total: number }): Promise<Order> }
```
`placeOrder`: total ≤ 0 → `RangeError`; lưu với `createdAt = clock.now()`; gửi mail `subject = 'Đơn #<id> đã được tạo'`; **mail lỗi không làm hỏng đơn đã lưu** (vẫn trả order).

### ex08 · Decorator: repository có cache
```ts
interface Product { id: number; name: string; price: number }
interface ProductRepository { findById(id: number): Promise<Product | null>; update(id: number, patch: Partial<Omit<Product, 'id'>>): Promise<Product> }
```
`class CachedProductRepository implements ProductRepository` — `constructor(inner: ProductRepository, ttlMs: number, now = () => Date.now())`:
- `findById` cache kết quả (cả `null`) trong `ttlMs`
- `update` gọi inner rồi **cập nhật cache** bằng kết quả mới
Bọc nhiều lớp được: `new CachedProductRepository(new LoggingProductRepository(db), …)` — viết thêm `LoggingProductRepository` ghi `'findById <id>'` / `'update <id>'` vào `logger: string[]` truyền vào constructor.
