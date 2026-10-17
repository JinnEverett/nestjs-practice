# J01 · Giá trị, kiểu & toán tử

Đọc khoảng 10 phút. Mọi ví dụ chạy được bằng `node` (REPL) hoặc `node -e "..."`.

## Mục tiêu: sau buổi này bạn làm được
- Phân biệt 7 kiểu primitive và object; kiểm tra kiểu đúng cách (`typeof`, `Array.isArray`, `Number.isNaN`).
- Biết giá trị nào là falsy và vì sao `if (value)` hay gây bug với `0` và `''`.
- Dùng `===` mặc định; giải thích được kết quả lạ của `==` và phép `+` với chuỗi.
- Chọn đúng giữa `??` và `||`; dùng `?.` để đọc dữ liệu lồng nhau an toàn.
- Biết giới hạn của `number` (`0.1 + 0.2`, `MAX_SAFE_INTEGER`) và khi nào dùng `BigInt`.

---

## 1. Primitive vs object
| Kiểu | Ví dụ | `typeof` |
|---|---|---|
| `string` | `'abc'` | `'string'` |
| `number` | `42`, `3.14`, `NaN`, `Infinity` | `'number'` |
| `bigint` | `9007199254740993n` | `'bigint'` |
| `boolean` | `true` | `'boolean'` |
| `undefined` | `undefined` | `'undefined'` |
| `null` | `null` | `'object'` ⚠️ (lỗi lịch sử của JS) |
| `symbol` | `Symbol('id')` | `'symbol'` |
| object (gồm array, function, Date…) | `{}`, `[]`, `new Date()` | `'object'` (function là `'function'`) |

- Primitive **bất biến** và so sánh **theo giá trị**. Object so sánh **theo tham chiếu**: `{} === {}` là `false`.
- Kiểm tra mảng: `Array.isArray(x)`. Kiểm tra `null`: `x === null`. Kiểm tra NaN: `Number.isNaN(x)` (không dùng `x === NaN`, vì `NaN !== NaN`).

## 2. Truthy / falsy
Chỉ có 8 giá trị falsy: `false`, `0`, `-0`, `0n`, `''`, `null`, `undefined`, `NaN`. **Mọi thứ khác là truthy**, kể cả `'0'`, `'false'`, `[]`, `{}`.
```js
const qty = 0;
if (!qty) console.log('thiếu số lượng');   // ❌ in ra dù 0 là giá trị hợp lệ
if (qty == null) console.log('thiếu');     // ✅ chỉ bắt null/undefined
```

## 3. `===` vs `==` và coercion
- `===` so sánh **không ép kiểu**. Dùng nó mặc định.
- `==` ép kiểu theo luật phức tạp: `'1' == 1` → `true`, `[] == false` → `true`, `null == undefined` → `true`, nhưng `null == 0` → `false`.
- Ngoại lệ được chấp nhận: `x == null` là cách ngắn để kiểm tra "null hoặc undefined".
- Phép `+`: nếu một vế là chuỗi → nối chuỗi (`'5' + 2` → `'52'`). Các phép `- * /` luôn ép về số (`'5' * '2'` → `10`).
- Chuyển chuỗi sang số:

  | | `Number(s)` | `parseInt(s, 10)` |
  |---|---|---|
  | `'42'` | 42 | 42 |
  | `'12abc'` | `NaN` | 12 ⚠️ (đọc tới đâu hay tới đó) |
  | `''` | 0 ⚠️ | `NaN` |
  | `'3.5'` | 3.5 | 3 |

  Validate input từ người dùng: dùng `Number()` + `Number.isInteger()` / `Number.isFinite()`, và xử lý riêng chuỗi rỗng.

## 4. `??`, `||`, `?.`
```js
const limit = query.limit || 20;   // ❌ limit = 0 cũng thành 20
const limit2 = query.limit ?? 20;  // ✅ chỉ thay khi null/undefined
const city = user?.address?.city;  // undefined thay vì TypeError nếu thiếu address
const first = list?.[0];           // dùng với index
const r = obj.method?.();          // gọi nếu method tồn tại
```

## 5. Số: float, safe integer, BigInt
- `number` là IEEE-754 double: `0.1 + 0.2` ra `0.30000000000000004`. **Không cộng tiền bằng float**: đổi sang đơn vị nhỏ nhất (cent, đồng) là số nguyên rồi mới tính.
- Số nguyên chính xác tới `Number.MAX_SAFE_INTEGER` = 9007199254740991. Quá mức đó: `9007199254740993` bị làm tròn thành `...992`.
- ID kiểu `bigint` trong Postgres có thể vượt mức này → driver `pg` trả về **chuỗi**. Muốn tính toán thì dùng `BigInt('9007199254740993') + 1n`. `BigInt` không trộn được với `number` (`1n + 1` → TypeError).

## Bẫy hay gặp
| Bẫy | Sai | Đúng |
|---|---|---|
| Kiểm tra mảng | `typeof x === 'object'` | `Array.isArray(x)` |
| Giá trị 0 hợp lệ | `if (!price)` | `if (price == null)` |
| Mặc định | `x \|\| 10` | `x ?? 10` |
| Parse số | `parseInt('12abc')` → 12 | `Number('12abc')` → NaN |
| So chuỗi số | `'10' < '9'` → `true` (so từng ký tự) | `Number(a) < Number(b)` |
| Cờ từ env | `Boolean('false')` → `true` | so sánh chuỗi tường minh |

## Bên trong NestJS dùng cái này ở đâu
- Mọi thứ đi vào từ HTTP (`query`, `params`, header) và từ `process.env` đều là **chuỗi**. `ParseIntPipe`, `ParseBoolPipe` và `ValidationPipe({ transform: true })` (C05) làm đúng việc ép kiểu cẩn thận bạn tập ở ex03, ex10.
- TypeORM trả cột `bigint`/`numeric` của Postgres về dạng **chuỗi** để không mất chính xác (B01) — liên quan ex05, ex09.

## Bài tập
Xem `exercises.md`. Viết bài vào `answers/exNN.js`, chấm bằng `bash lessons/check.sh lessons/J01-values-operators NN`.
