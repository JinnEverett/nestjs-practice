# J07 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J07-builtins 01`. Đáp án: `solutions/`.
**Không được phụ thuộc múi giờ của máy chạy** — test chạy bài của bạn với `TZ` khác nhau.

**Pass:** 8/10 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Định dạng tiền VND
`export function formatVnd(amount)` → chuỗi kiểu `'1.250.000 ₫'` (dấu chấm phân cách nghìn, không có số lẻ — làm tròn về đồng gần nhất). Số âm: `'-50.000 ₫'`. Khoảng trắng trước `₫` có thể là space thường hoặc non-breaking space.

### ex02 · Slug tiếng Việt
`export function slugify(title)`:
```js
slugify('Áo Thun Nam Đẹp 2026!')   // 'ao-thun-nam-dep-2026'
slugify('  Điện thoại -- Giá rẻ  ') // 'dien-thoai-gia-re'
slugify('!!!')                      // ''
```
Bỏ dấu (kể cả `đ/Đ`), chữ thường, mọi chuỗi ký tự không phải `a-z0-9` thành **một** dấu `-`, bỏ `-` ở 2 đầu.

### ex03 · Parse ngày kiểu Việt Nam
`export function parseVnDate(text)` nhận `'dd/MM/yyyy'`, trả `Date` là **00:00 giờ Việt Nam** của ngày đó. Sai định dạng hoặc ngày không tồn tại (`'31/02/2026'`, `'00/10/2026'`, `'17/13/2026'`) → `null`.
```js
parseVnDate('17/10/2026').toISOString() // '2026-10-16T17:00:00.000Z'
```

### ex04 · Khoảng thời gian của một ngày (giờ VN)
`export function vnDayRange(isoDate)` nhận `'YYYY-MM-DD'`, trả `{ from, to }` (đều là `Date`): nửa mở `[00:00 ngày đó, 00:00 ngày hôm sau)` theo giờ Việt Nam. Sai định dạng → `RangeError`.
```js
const { from, to } = vnDayRange('2026-10-17');
from.toISOString() // '2026-10-16T17:00:00.000Z'
to.toISOString()   // '2026-10-17T17:00:00.000Z'
// Dùng cho: WHERE created_at >= $from AND created_at < $to
```

---

## 🟡 Kết hợp

### ex05 · 🔮 Date, JSON, Number
Đọc `starter/ex05.js` (đầu file đặt `TZ = Asia/Ho_Chi_Minh`), ghi 11 dòng output vào `answers/ex05.txt`.

### ex06 · Che email
`export function maskEmail(email)`:
- Phần trước `@` dài ≥ 4: giữ 2 ký tự đầu và 1 ký tự cuối, giữa thay bằng `*` (đúng số ký tự bị che)
- Dài 1–3: giữ ký tự đầu + `'***'`
- Phần domain giữ nguyên. Không đúng dạng `local@domain.tld` (thiếu `@`, nhiều `@`, có khoảng trắng, domain không có dấu chấm) → `TypeError`
```js
maskEmail('nguyenvana@gmail.com') // 'ng*******a@gmail.com'
maskEmail('an@x.vn')              // 'a***@x.vn'
```

### ex07 · Parse thời lượng
`export function parseDuration(text)` → số mili giây. Chuỗi gồm một hoặc nhiều cặp `<số><đơn vị>`, đơn vị `ms`, `s`, `m`, `h`, `d`, có thể cách nhau bởi khoảng trắng: `'15m'`, `'1h30m'`, `'2d 4h'`, `'500ms'`. Chuỗi rỗng, sai đơn vị, có ký tự thừa (`'10x'`, `'1h abc'`, `'h'`) → `TypeError`.

### ex08 · JSON có Date
`export function parseJsonWithDates(text)` như `JSON.parse` nhưng mọi **chuỗi** đúng dạng ISO 8601 đầy đủ (ngày + giờ + `Z` hoặc offset `±HH:MM`, có/không phần mili giây) được đổi thành `Date`. Chuỗi khác (kể cả `'2026-10-17'` chỉ có ngày) giữ nguyên. Áp dụng ở mọi độ sâu.

---

## 🔴 Thực tế

### ex09 · "5 phút trước"
`export function formatRelativeVN(date, now = new Date())` cho trang lịch sử đơn:
- chênh lệch < 60 giây → `'vừa xong'`
- < 60 phút → `'<n> phút trước'` (làm tròn xuống)
- < 24 giờ → `'<n> giờ trước'`
- nếu `date` thuộc **ngày hôm qua theo lịch Việt Nam** (so với `now`) → `'hôm qua'`
- còn lại → `'dd/MM/yyyy'` theo giờ Việt Nam

### ex10 · Báo cáo đơn theo ngày (giờ VN)
`export function dailyReport(orders)` — `orders`: `[{ createdAt: '<ISO UTC>', total }]`. Trả `[{ date: 'YYYY-MM-DD', count, revenue }]` gom theo **ngày lịch Việt Nam**, sắp `date` tăng dần.
Ví dụ: đơn lúc `2026-10-16T18:30:00Z` là 01:30 sáng 17/10 giờ VN → thuộc ngày `'2026-10-17'`.
