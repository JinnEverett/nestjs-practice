# T02 · Bài tập

Viết vào `answers/exNN.ts`. Chấm: `bash lessons/check.sh lessons/T02-union-narrowing 01`. Đáp án: `solutions/`.
**Không dùng `any`, không dùng `as` để ép kiểu** (trừ `as const`; riêng ex07 được phép **một** lần ép kiểu bên trong hàm, kèm comment giải thích vì sao an toàn).

**Pass:** 6/8 bài, `tsc` sạch, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Narrowing bằng typeof
`describeValue(v: string | number | boolean | null | undefined): string`:
- `null`/`undefined` → `'(trống)'`; boolean → `'có'`/`'không'`; số → làm tròn 2 chữ số (`'3.14'`); chuỗi → trim, rỗng sau trim → `'(trống)'`.

### ex02 · Discriminated union + exhaustive
Export:
```ts
type Shape = { kind: 'circle'; radius: number } | { kind: 'rect'; width: number; height: number } | { kind: 'triangle'; base: number; height: number };
function area(s: Shape): number
function assertNever(x: never): never   // ném Error
```
`area` dùng `switch (s.kind)` với nhánh `default` gọi `assertNever`.

### ex03 · `Result` thay cho throw
Export:
```ts
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
ok(value), err(error), unwrapOr(result, fallback), parseQuantity(input: string): Result<number>
```
`parseQuantity`: số nguyên 1–99 → `ok`; ngược lại `err('…')` (message tùy ý, không rỗng).

---

## 🟡 Kết hợp

### ex04 · Phương thức thanh toán
```ts
type Payment = { type: 'card'; last4: string } | { type: 'bank'; bankCode: string; accountNo: string } | { type: 'cod' };
describePayment(p: Payment): string   // 'Thẻ •••• 4242' | 'Chuyển khoản VCB - ****6789' (4 số cuối) | 'Thanh toán khi nhận hàng'
feeFor(p: Payment, amount: number): number  // card: 2% làm tròn; bank: 0; cod: 15000 cố định
```
Tạo `{ type: 'card', bankCode: 'x' }` phải là lỗi biên dịch.

### ex05 · Type guard cho dữ liệu ngoài
```ts
interface User { id: number; email: string; name?: string }
isUser(x: unknown): x is User           // id số nguyên dương, email có '@', name (nếu có) là string
parseUsers(json: string): User[]        // JSON là mảng; bỏ phần tử không hợp lệ; JSON sai / không phải mảng → []
```

### ex06 · Lỗi `unknown` → HTTP status
Export các class `NotFoundError`, `ValidationError` (kế thừa `Error`) và `toHttpStatus(e: unknown): number`:
- `NotFoundError` → 404, `ValidationError` → 400
- object (bất kỳ) có thuộc tính `status` là **số** 400–599 → giá trị đó
- còn lại → 500

---

## 🔴 Thực tế

### ex07 · Event dispatcher có kiểu
```ts
type AppEvent =
  | { type: 'order.created'; orderId: number; total: number }
  | { type: 'user.registered'; email: string };
createDispatcher(handlers) → (event: AppEvent) => void
```
`handlers` là object có **đúng một handler cho mỗi `type`**, mỗi handler nhận **đúng kiểu event** của nó (`handlers['order.created']` nhận event có `orderId`). Thiếu handler, hoặc handler đọc field không có → lỗi biên dịch. Gợi ý: `Extract<AppEvent, { type: K }>`.

### ex08 · Reducer trạng thái tải dữ liệu
```ts
type FetchState<T> = { status: 'idle' } | { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: string };
type FetchAction<T> = { type: 'start' } | { type: 'resolve'; data: T } | { type: 'reject'; error: string } | { type: 'reset' };
reduceFetch<T>(state: FetchState<T>, action: FetchAction<T>): FetchState<T>
```
- `start`: từ `idle`/`success`/`error` → `loading`; đang `loading` thì giữ nguyên **chính object state**
- `resolve`/`reject`: chỉ có tác dụng khi đang `loading` (ngược lại trả nguyên state)
- `reset` → `idle`
- switch trên `action.type` có exhaustive check.
