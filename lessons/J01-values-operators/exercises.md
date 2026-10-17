# J01 · Bài tập

Mỗi bài viết vào `answers/exNN.js` dưới dạng ES module (`export function ...`).
Chấm (từ thư mục gốc workspace): `bash lessons/check.sh lessons/J01-values-operators 01`.
Đáp án best practice ở `solutions/` — **chỉ mở sau khi đã qua test, hoặc đã bí sau 3 lần thử**.

**Pass:** 8/10 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · `typeOf` chính xác
`export function typeOf(value)` trả về chuỗi mô tả kiểu, sửa các chỗ `typeof` "nói dối":
- `null` → `'null'`, mảng → `'array'`, `NaN` → `'nan'`
- còn lại trả đúng như `typeof` (`'string'`, `'number'`, `'object'`, `'function'`, `'bigint'`…)

```js
typeOf(null)        // 'null'
typeOf([1, 2])      // 'array'
typeOf(NaN)         // 'nan'
typeOf({})          // 'object'
typeOf(() => {})    // 'function'
```

### ex02 · `isBlank`
`export function isBlank(value)` trả `true` khi `value` là `null`, `undefined`, chuỗi rỗng hoặc chuỗi chỉ gồm khoảng trắng. Mọi giá trị khác (kể cả `0`, `false`, `[]`, `NaN`) là `false`.
```js
isBlank('   ')   // true
isBlank(0)       // false
isBlank(false)   // false
isBlank(' a ')   // false
```

### ex03 · `parseLimit` từ query string
API danh sách nhận `?limit=...`. Viết `export function parseLimit(raw)` (`raw` là `string | undefined`):
- Thiếu, rỗng (sau khi trim) hoặc **không phải số nguyên hợp lệ** → `20`
- Nhỏ hơn 1 → `1`; lớn hơn 100 → `100`; còn lại trả về số đó
```js
parseLimit(undefined) // 20
parseLimit('50')      // 50
parseLimit(' 7 ')     // 7
parseLimit('12abc')   // 20   ← parseInt sẽ cho 12, sai
parseLimit('3.5')     // 20
parseLimit('0')       // 1
parseLimit('1000')    // 100
```

### ex04 · 🔮 Đoán output: coercion
**Không chạy code.** Ghi vào `answers/ex04.txt` 10 dòng, mỗi dòng là kết quả của biểu thức tương ứng, **viết đúng như Node REPL hiển thị** (chuỗi có nháy đơn, vd. `'52'`; số viết thường; boolean `true`/`false`).
```
1.  [] + []
2.  [] == false
3.  null == 0
4.  null >= 0
5.  '5' * '2'
6.  '5' + 2
7.  NaN === NaN
8.  0.1 + 0.2 === 0.3
9.  typeof NaN
10. !!'false'
```
Chỉ ghi kết quả (có thể giữ số thứ tự `1.` ở đầu dòng, test tự bỏ qua). Test tự tính giá trị thật và so từng dòng.

---

## 🟡 Kết hợp

### ex05 · Cộng tiền không lệch
`export function sumMoney(amounts)` nhận mảng số tiền (USD, tối đa 2 chữ số thập phân, có thể âm) và trả về tổng **chính xác tới cent**, dạng `number`. Không được mutate mảng đầu vào.
```js
sumMoney([0.1, 0.2])            // 0.3   (không phải 0.30000000000000004)
sumMoney([19.99, 5.01, 0.15])   // 25.15
sumMoney([])                    // 0
```

### ex06 · `safeDivide`
`export function safeDivide(a, b)` trả về `a / b`, nhưng trả `null` nếu: `a` hoặc `b` không phải `number` hữu hạn (kể cả chuỗi số như `'10'`, `NaN`, `Infinity`), hoặc `b` bằng 0.
```js
safeDivide(10, 4)     // 2.5
safeDivide(1, 0)      // null
safeDivide('10', 2)   // null
safeDivide(NaN, 2)    // null
```

### ex07 · Thành phố giao hàng
Đơn hàng có thể thiếu bất kỳ tầng nào. Viết `export function getShippingCity(order)`:
trả về `city` của địa chỉ **đầu tiên** có `isDefault === true` trong `order.customer.addresses`; nếu không tìm được (thiếu tầng, mảng rỗng, không có default, `city` là `null`/`undefined`) → `'N/A'`. Chuỗi rỗng `''` là giá trị hợp lệ, giữ nguyên.
```js
getShippingCity({ customer: { addresses: [{ city: 'Huế', isDefault: false }, { city: 'Hà Nội', isDefault: true }] } }) // 'Hà Nội'
getShippingCity({ customer: null })  // 'N/A'
getShippingCity(undefined)           // 'N/A'
```

### ex08 · So sánh version
`export function compareVersions(a, b)` so sánh 2 chuỗi version dạng `MAJOR.MINOR.PATCH` (chỉ gồm số). Trả `1` nếu `a > b`, `-1` nếu `a < b`, `0` nếu bằng nhau.
```js
compareVersions('1.10.0', '1.9.3') // 1     ← so chuỗi sẽ ra sai
compareVersions('2.0.0', '2.0.0')  // 0
compareVersions('0.9.9', '1.0.0')  // -1
```

---

## 🔴 Thực tế

### ex09 · ID bigint từ database
Bảng `orders` dùng id `bigint`; driver trả id về dạng **chuỗi**. Viết `export function nextId(id)` trả về chuỗi id kế tiếp (`id + 1`), chính xác cả khi vượt `Number.MAX_SAFE_INTEGER`.
Nếu `id` không phải **chuỗi chỉ gồm chữ số** (vd. `'abc'`, `'-1'`, `'1.5'`, `''`, `' 1'`, `'0x10'`, số `5`) → `throw new TypeError(...)`.
```js
nextId('41')                  // '42'
nextId('9007199254740993')    // '9007199254740994'
nextId('1.5')                 // TypeError
```

### ex10 · Đọc cờ bật/tắt từ env
Team DevOps cấu hình cờ qua biến môi trường kiểu `FEATURE_X=...`. Viết `export function parseFlag(value, defaultValue = false)`:
- `undefined` → `defaultValue`
- `boolean` → trả nguyên
- chuỗi (không phân biệt hoa thường, bỏ khoảng trắng 2 đầu): `'true' '1' 'yes' 'on'` → `true`; `'false' '0' 'no' 'off' ''` → `false`
- mọi thứ khác (chuỗi lạ như `'enable'`, số, `null`…) → `throw new TypeError(...)` có nhắc tới giá trị sai, để app **chết ngay lúc khởi động** thay vì chạy sai âm thầm.
```js
parseFlag(' TRUE ')        // true
parseFlag('0')             // false
parseFlag(undefined, true) // true
parseFlag('enable')        // TypeError
```
