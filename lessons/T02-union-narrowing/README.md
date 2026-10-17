# T02 · Union, narrowing & discriminated union

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Mô tả dữ liệu "một trong nhiều dạng" bằng union, và thu hẹp (narrow) an toàn bằng `typeof`, `in`, `instanceof`, `===`.
- Thiết kế **discriminated union** (union có trường `type`/`kind`/`status` chung) — công cụ mạnh nhất của TS cho nghiệp vụ.
- Viết type guard (`x is T`) cho dữ liệu `unknown` từ bên ngoài.
- Bắt buộc xử lý đủ mọi trường hợp bằng exhaustive check với `never`.
- Biết khi nào dùng `type` alias, khi nào `interface`.

---

## 1. Union & narrowing
```ts
function label(v: string | number | null): string {
  if (v === null) return 'trống';            // v: null
  if (typeof v === 'number') return v.toFixed(2); // v: number
  return v.toUpperCase();                    // v: string — TS loại dần các khả năng
}
```
Các cách thu hẹp: `typeof`, `===`/`!==`, truthiness, `in` (`'email' in x`), `instanceof`, `Array.isArray`, type guard tự viết, và **trường phân biệt**.

## 2. Discriminated union
```ts
type Payment =
  | { type: 'card'; last4: string }
  | { type: 'bank'; bankCode: string; accountNo: string }
  | { type: 'cod' };

function describe(p: Payment): string {
  switch (p.type) {
    case 'card': return `Thẻ •••• ${p.last4}`;      // p được thu hẹp, chỉ thấy last4
    case 'bank': return `CK ${p.bankCode}`;
    case 'cod':  return 'Thanh toán khi nhận';
    default:     return assertNever(p);              // thêm type mới mà quên case → LỖI BIÊN DỊCH
  }
}
function assertNever(x: never): never { throw new Error(`Unhandled: ${JSON.stringify(x)}`); }
```
So với một object có hàng loạt field optional (`last4?`, `bankCode?`…): union **không cho tạo** trạng thái vô lý (thẻ mà có bankCode), và compiler biết field nào tồn tại ở nhánh nào. *"Make illegal states unrepresentable."*

## 3. Type guard
```ts
function isUser(x: unknown): x is User {
  return typeof x === 'object' && x !== null
    && 'id' in x && typeof x.id === 'number'
    && 'email' in x && typeof x.email === 'string';
}
const users = JSON.parse(raw).filter(isUser);   // User[]
```
Type guard là **lời hứa** của bạn với compiler — viết sai là nói dối. Dữ liệu phức tạp → dùng thư viện schema (zod, class-validator) để vừa validate vừa có kiểu.

## 4. `type` vs `interface`
| | `interface` | `type` |
|---|---|---|
| Object shape | ✅ | ✅ |
| Union, tuple, mapped/conditional type | ❌ | ✅ |
| `extends` / gộp khai báo (declaration merging) | ✅ | ❌ (dùng `&`) |
Thực dụng: `interface` cho object/class contract; `type` cho union và kiểu tính toán. Quan trọng là **nhất quán** trong dự án.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| Nhiều field optional thay vì union | trạng thái vô lý, `!` khắp nơi |
| `default:` trả giá trị mặc định | thêm case mới không bị nhắc |
| `if (x)` để kiểm `number` | `0` bị coi là thiếu |
| Type guard chỉ kiểm 1 field | nói dối compiler |
| `as` để "sửa" lỗi union | che bug |

## Bên trong NestJS dùng cái này ở đâu
- Kết quả nghiệp vụ dạng `Result` (ok/error) thay vì ném lỗi (ex03); trạng thái đơn hàng (D03).
- Message pattern của microservice, event của event-emitter (M02, M06) là discriminated union theo `type`.
- `catch (e: unknown)` trong exception filter → narrowing bằng `instanceof HttpException` (ex06, C06).

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/T02-union-narrowing NN`.
