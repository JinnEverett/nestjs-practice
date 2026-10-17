# T01 · Bài tập

Viết vào `answers/exNN.ts`. Import giữa các file dùng đuôi `.js` (`import { x } from './ex01.js'`) — quy ước của `module: nodenext`.
Chấm: `bash lessons/check.sh lessons/T01-ts-basics 01`. Test gồm 2 phần: **kiểm kiểu** (tsc strict — kiểu quá lỏng như `any` sẽ bị bắt) và **kiểm hành vi** (node --test).
Đáp án: `solutions/`.

**Pass:** 6/8 bài, `tsc` sạch, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Kiểu cho dòng hàng
Export:
- `interface LineItem { name: string; qty: number; unitPrice: number }`
- `function lineTotal(item: LineItem): number` — `qty × unitPrice`
- `function formatLine(item: LineItem): string` → `'2 × Áo thun = 300000'`
Truyền thiếu field / sai kiểu phải là **lỗi biên dịch**.

### ex02 · `unknown` thay vì `any`
`function parsePort(value: unknown): number` — nhận `number` hoặc chuỗi chỉ gồm chữ số; phải là số nguyên 1–65535; còn lại → `TypeError`. Tham số phải là `unknown` (nhận được mọi thứ), giá trị trả về là `number`.

### ex03 · Tuple
`function minMax(nums: readonly number[]): [min: number, max: number] | undefined` — mảng rỗng → `undefined`. Không mutate input (tham số là `readonly` nên `sort` trên nó sẽ lỗi biên dịch).

---

## 🟡 Kết hợp

### ex04 · Readonly & optional
Export:
```ts
interface User { readonly id: number; name: string; email?: string }
type UserPatch = /* tự định nghĩa: mọi field của User trừ id, đều tùy chọn */;
function updateUser(user: User, patch: UserPatch): User   // trả object mới, không mutate
```
Patch có `id` hoặc field lạ → lỗi biên dịch. Field trong patch có giá trị `undefined` thì **không** ghi đè.

### ex05 · `as const` + type guard
Export `ORDER_STATUSES` (mảng `as const`: `'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'`), `type OrderStatus` suy ra từ mảng, và `function isOrderStatus(value: string): value is OrderStatus`.

### ex06 · Overload
`getEnv(env, key)` → `string | undefined`; `getEnv(env, key, fallback)` → `string` (kiểu trả về **phụ thuộc** vào việc có fallback). `env` có kiểu `Record<string, string | undefined>`. Chuỗi rỗng coi như thiếu.

### ex07 · 🐞 Sửa lỗi strict null
`starter/ex07.ts` viết kiểu JavaScript, bật strict thì lỗi kiểu khắp nơi và có bug thật (mảng rỗng). Viết lại vào `answers/ex07.ts`:
- `interface Product { id: number; name: string; price: number; salePrice?: number }`
- `effectivePrice(p: Product): number` — `salePrice` nếu có, ngược lại `price`
- `findCheapest(products: readonly Product[]): Product | undefined` (theo effectivePrice)
- `averagePrice(products: readonly Product[]): number | null` — rỗng → `null`, làm tròn số nguyên

---

## 🔴 Thực tế

### ex08 · Config có kiểu
```ts
interface AppConfig {
  port: number;
  databaseUrl: string;
  nodeEnv: 'development' | 'production' | 'test';
  corsOrigins: string[];
}
function loadConfig(env: Record<string, string | undefined>): Readonly<AppConfig>
```
- `PORT` mặc định 3000, phải là số nguyên 1–65535
- `DATABASE_URL` bắt buộc
- `NODE_ENV` mặc định `'development'`; giá trị khác 3 giá trị hợp lệ → lỗi
- `CORS_ORIGINS` dạng `'https://a.vn, https://b.vn'` → mảng đã trim, bỏ phần rỗng; thiếu → `[]`
- Lỗi: ném **một** `Error` liệt kê **mọi** biến sai (message chứa tên từng biến)
- Không dùng `any`, không dùng `as` để ép kiểu `nodeEnv`.
