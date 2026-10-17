# T01 · TypeScript cơ bản & tooling

Đọc khoảng 12 phút.

## Mục tiêu: sau buổi này bạn làm được
- Chạy TypeScript: `tsc`, `tsconfig.json`, chế độ `strict`; biết `tsx`/SWC/type stripping của Node khác `tsc` ở đâu.
- Khai báo kiểu cho biến, tham số, giá trị trả về; để TS tự suy luận (inference) khi đủ rõ.
- Phân biệt `any` / `unknown` / `never`; dùng `unknown` cho dữ liệu từ bên ngoài.
- Dùng object type, optional/readonly, tuple, literal type, `as const`, overload.
- Đọc hiểu lỗi kiểu thường gặp dưới `strictNullChecks` và `noUncheckedIndexedAccess`.

---

## 1. TypeScript là gì, chạy thế nào
TypeScript = JavaScript + **hệ thống kiểu kiểm tra lúc biên dịch**. Kiểu bị **xóa** khi chạy: không có kiểm tra kiểu lúc runtime (validate input vẫn phải tự làm — C05).

| Công cụ | Kiểm kiểu? | Dùng khi |
|---|---|---|
| `tsc` | ✅ | build production, CI (`tsc --noEmit` để chỉ kiểm) |
| `node file.ts` (Node 23.6+ type stripping) | ❌ chỉ xóa kiểu | script nhanh; không hỗ trợ `enum`, parameter property, decorator |
| `tsx`, `ts-node` | ❌ / tùy chọn | chạy dev nhanh |
| SWC / esbuild | ❌ | biên dịch rất nhanh (Nest CLI có tùy chọn SWC) |

→ Luôn có **một bước `tsc --noEmit` trong CI**; công cụ nhanh chỉ để chạy.

`tsconfig.json` quan trọng nhất:
```jsonc
{
  "compilerOptions": {
    "strict": true,                     // bật mọi kiểm tra nghiêm: null, any ngầm, this...
    "noUncheckedIndexedAccess": true,   // arr[i], obj[key] có thể undefined
    "target": "ES2023",                 // cú pháp JS đầu ra
    "module": "nodenext",               // hệ module (Nest mặc định "commonjs")
    "outDir": "dist"
  }
}
```
Bài tập ở Tier T dùng `lessons/tsconfig.base.json` (strict + noUncheckedIndexedAccess).

## 2. Annotation vs inference
```ts
let count = 0;                         // suy ra number — không cần ghi
const status = 'paid';                 // kiểu literal 'paid' (const không đổi được)
function total(items: LineItem[]): number {   // GHI kiểu cho tham số và (nên) giá trị trả về của hàm public
  return items.reduce((s, i) => s + i.qty * i.unitPrice, 0);   // i được suy ra là LineItem
}
```
Quy tắc: ghi kiểu ở **biên** (tham số, giá trị trả về của hàm export, field của class); bên trong để TS suy luận.

## 3. `any`, `unknown`, `never`
| | Gán gì vào được | Dùng được ngay | Khi nào |
|---|---|---|---|
| `any` | mọi thứ | ✅ mọi thao tác (tắt kiểm tra) | gần như không bao giờ |
| `unknown` | mọi thứ | ❌ phải thu hẹp (narrow) trước | dữ liệu từ ngoài: `JSON.parse`, body, `catch (e)` |
| `never` | không gì | — | nhánh không thể xảy ra (T02) |

```ts
function parsePort(value: unknown): number {
  if (typeof value === 'number') return value;          // ở đây value: number
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  throw new TypeError('Invalid port');
}
```

## 4. Object type, optional, readonly, tuple
```ts
interface User {            // hoặc type User = { ... } (T02 so sánh)
  readonly id: number;      // gán lại → lỗi biên dịch
  name: string;
  email?: string;           // có thể thiếu: string | undefined
}
type MinMax = [min: number, max: number];          // tuple có nhãn
function sum(xs: readonly number[]) { /* không push được */ }
```

## 5. Literal type & `as const`
```ts
const STATUSES = ['pending', 'paid', 'shipped'] as const;   // readonly ['pending', 'paid', 'shipped']
type Status = (typeof STATUSES)[number];                   // 'pending' | 'paid' | 'shipped'
function isStatus(v: string): v is Status { return (STATUSES as readonly string[]).includes(v); }   // type guard
```
Một danh sách giá trị → vừa có mảng dùng lúc chạy, vừa có kiểu union lúc biên dịch.

## 6. Overload
```ts
function getEnv(key: string): string | undefined;
function getEnv(key: string, fallback: string): string;
function getEnv(key: string, fallback?: string) { return process.env[key] ?? fallback; }
```

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| `JSON.parse(x) as User` | "nói dối" compiler: dữ liệu sai vẫn lọt, lỗi xuất hiện xa nơi gây ra |
| `catch (e) { e.message }` | `e` là `unknown` dưới strict → phải `e instanceof Error` |
| `arr[0].name` với `noUncheckedIndexedAccess` | lỗi: phần tử có thể `undefined` — kiểm tra trước |
| Tắt `strict` cho "đỡ lỗi" | mất gần hết giá trị của TS |
| Tin `node file.ts` đã kiểm kiểu | không — chỉ xóa kiểu |

## Bên trong NestJS dùng cái này ở đâu
- Mọi file Nest là `.ts`; `nest build` gọi `tsc` (hoặc SWC). `tsconfig.json` của Nest cần `experimentalDecorators` + `emitDecoratorMetadata` (T06).
- DTO là class TS, nhưng **kiểu không validate gì lúc chạy** — vì thế mới có `class-validator` (C05).

## Bài tập
Xem `exercises.md`. File bài là `answers/exNN.ts`. Chấm: `bash lessons/check.sh lessons/T01-ts-basics NN` (tự chạy `tsc` strict trước, lỗi kiểu = SAI).
