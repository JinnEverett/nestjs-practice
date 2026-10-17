# J07 · Builtins thực dụng: String, Number, Date, Intl, JSON, RegExp

Đọc khoảng 12 phút. Phần **Date & timezone** là phần quan trọng nhất — nó là nguồn bug số 1 của backend Việt Nam (đơn 23h bị tính sang ngày hôm sau).

## Mục tiêu: sau buổi này bạn làm được
- Xử lý chuỗi tiếng Việt: bỏ dấu, slug, so sánh, cắt chuỗi an toàn với emoji.
- Định dạng số/tiền/ngày bằng `Intl` thay vì tự ghép chuỗi.
- Hiểu `Date` lưu **một thời điểm UTC**; chuyển đúng giữa "ngày lịch Việt Nam" và khoảng thời gian UTC.
- Biết `JSON` làm mất gì (Date, undefined, BigInt, NaN) và dùng reviver.
- Viết regex cơ bản với nhóm, cờ `g`/`i`/`u`, `matchAll`.

---

## 1. String
```js
'  Áo thun  '.trim();                 // 'Áo thun'
'abc'.at(-1);  'abc'.slice(-2);        // 'c', 'bc'
'a,b,,c'.split(',');                   // ['a', 'b', '', 'c']
'x'.padStart(3, '0');                  // '00x'
'Hello'.replaceAll('l', 'L');          // 'HeLLo'
// bỏ dấu tiếng Việt
'Đặt hàng'.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D'); // 'Dat hang'
```
`length` đếm UTF-16 code unit: `'👋'.length === 2`. Cắt theo ký tự hiển thị: `[...str]` hoặc `Intl.Segmenter`.

## 2. Number & làm tròn
- `toFixed` trả **chuỗi** và làm tròn theo biểu diễn nhị phân: `(1.005).toFixed(2) === '1.00'`.
- Tiền: tính bằng số nguyên đơn vị nhỏ nhất (đồng, cent) — J01 ex05. VND không có số lẻ.
- `Number.parseFloat`, `Number(...)`, `Number.isInteger`, `Number.isSafeInteger`.

## 3. Intl — định dạng theo locale
```js
new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(1250000); // '1.250.000 ₫'
new Intl.NumberFormat('vi-VN').format(1234.5);                                          // '1.234,5'
new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' }).format(d);
new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);            // 'YYYY-MM-DD'
```
⚠️ Output của Intl có thể chứa **non-breaking space** (` `) — so sánh chuỗi trong test cần lưu ý.

## 4. Date & timezone — đọc kỹ
- Một `Date` = **một thời điểm** (số mili giây từ 1970-01-01T00:00:00Z). Nó **không** mang múi giờ.
- "Múi giờ" chỉ xuất hiện khi **parse** chuỗi hoặc **hiển thị**.

| Viết | Hiểu là |
|---|---|
| `new Date('2026-10-01')` | 00:00 **UTC** (chuỗi chỉ có ngày → UTC) |
| `new Date('2026-10-01T00:00')` | 00:00 theo **TZ của process** (chuỗi có giờ, không có offset → local) |
| `new Date('2026-10-01T00:00:00+07:00')` | 00:00 giờ Việt Nam ✅ tường minh |
| `new Date(2026, 9, 1)` | 00:00 local; **tháng tính từ 0** (9 = tháng 10) |
| `d.toISOString()` | luôn in UTC, kết thúc bằng `Z` |
| `d.getDate()`, `getHours()` | theo TZ của **máy chạy** ❌ (server production thường để UTC) |

Quy tắc backend:
1. Lưu DB bằng `timestamptz`, truyền qua API bằng ISO 8601 có `Z` hoặc offset.
2. "Ngày 17/10 giờ Việt Nam" là **khoảng** `[2026-10-16T17:00Z, 2026-10-17T17:00Z)` → query `>= from AND < to` (nửa mở). Giống hệt bài `AT TIME ZONE` bên SQL.
3. Không dùng `toISOString().slice(0, 10)` để lấy "ngày" — đó là ngày **UTC**.
4. Việt Nam là UTC+7 cố định (không có giờ mùa hè), nhưng vẫn nên dùng tên `Asia/Ho_Chi_Minh` qua Intl thay vì cộng 7 giờ tay khi hiển thị.
5. Tính toán lịch phức tạp (cộng tháng, DST các nước): dùng thư viện (`date-fns-tz`, `Luxon`) hoặc `Temporal` khi có.

## 5. JSON
```js
JSON.stringify({ at: new Date(0), u: undefined, f() {}, n: NaN }); // '{"at":"1970-01-01T00:00:00.000Z","n":null}'
JSON.stringify({ id: 1n });                                        // TypeError: Do not know how to serialize a BigInt
JSON.parse(text, (key, value) => /* reviver: biến đổi từng giá trị */ value);
```
Date đi qua JSON thành **chuỗi** và không tự quay lại thành Date.

## 6. RegExp
```js
const DURATION = /(\d+)(ms|s|m|h|d)/g;
for (const [, n, unit] of '1h30m'.matchAll(DURATION)) { /* '1','h' rồi '30','m' */ }
/^\d{2}\/\d{2}\/\d{4}$/.test('17/10/2026');  // neo ^ $ để khớp TOÀN BỘ chuỗi
```
- Cờ: `g` (tìm tất cả), `i` (không phân biệt hoa thường), `u` (Unicode, cần cho `\p{...}`).
- Regex có `g` giữ `lastIndex` → gọi `.test()` lặp lại trên cùng regex cho kết quả xen kẽ true/false. Đừng dùng regex có `g` với `.test()`.

## Bên trong NestJS dùng cái này ở đâu
- `class-transformer` biến chuỗi ISO thành `Date` trong DTO (C05) — giống reviver ở ex08.
- `expiresIn: '15m'` của JWT (A02) — giống ex07.
- Báo cáo theo ngày, lọc đơn theo ngày (R09) — ex04, ex10.

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J07-builtins NN`.
