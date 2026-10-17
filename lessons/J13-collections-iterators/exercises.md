# J13 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/J13-collections-iterators 01`. Đáp án: `solutions/`.

**Pass:** 8/10 bài, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🔮 Map, Set, iterator
Đọc `starter/ex01.js`, ghi 10 dòng output vào `answers/ex01.txt`.

### ex02 · Phép toán tập hợp
Export `union(a, b)`, `intersection(a, b)`, `difference(a, b)` (có trong a, không có trong b), `symmetricDifference(a, b)`, `isSubsetOf(a, b)`. `a`, `b` là **iterable bất kỳ** (mảng, Set, chuỗi…); 4 hàm đầu trả `Set` mới, giữ thứ tự xuất hiện; hàm cuối trả boolean.

### ex03 · Iterable tự viết (không dùng generator)
`range(start, end, step = 1)` trả **iterable** sinh các số từ `start` tới **trước** `end`; `step` âm thì đếm lùi; `step = 0` → `RangeError`. Duyệt được **nhiều lần**. Không dùng `function*`.
```js
[...range(0, 5)]        // [0, 1, 2, 3, 4]
[...range(5, 0, -2)]    // [5, 3, 1]
```

---

## 🟡 Kết hợp

### ex04 · Xử lý lười bằng generator
Export các generator function:
- `naturals()` — 0, 1, 2, … vô hạn
- `mapLazy(iterable, fn)`, `filterLazy(iterable, predicate)`, `take(iterable, n)`
Phải **lười**: `take(mapLazy(naturals(), f), 3)` chỉ gọi `f` đúng 3 lần.

### ex05 · Duyệt API phân trang
`async function* paginate(fetchPage)` — `fetchPage(cursor)` → `Promise<{ items, nextCursor }>`; lần đầu `cursor = null`; `nextCursor` là `null` thì hết. Yield **từng item**. Dừng sớm (`break`) thì không tải thêm trang.

### ex06 · Chỉ mục tìm kiếm
- `buildIndex(docs)` — `docs`: `[{ id, text }]` → `Map<word, Set<id>>`; từ = chuỗi chữ cái liên tiếp (kể cả chữ tiếng Việt có dấu — dùng `\p{L}` với cờ `u`), chữ thường.
- `search(index, query)` → mảng id (tăng dần) chứa **tất cả** các từ trong `query`; query không có từ nào → `[]`.

### ex07 · Memoize theo object bằng WeakMap
`memoizeByObject(fn)` → hàm `(obj, ...rest) => fn(obj, ...rest)` nhớ kết quả **theo object `obj`** (bỏ qua `rest`), dùng `WeakMap` để không giữ object sống. `obj` không phải object/function → `TypeError`.

---

## 🔴 Thực tế

### ex08 · Gom lô từ luồng dữ liệu
Import 1 triệu dòng từ file vào DB: insert từng dòng quá chậm, nạp hết vào RAM thì sập. Viết `async function* batch(source, size)`:
- `source` là iterable **đồng bộ hoặc bất đồng bộ**
- yield các mảng `size` phần tử (mảng cuối có thể ngắn hơn, không yield mảng rỗng)
- **lười**: chỉ đọc từ `source` đủ cho lô đang yield
- `size` không phải số nguyên dương → `RangeError`

### ex09 · Top K từ khóa
`topKFrequent(words, k)` — `words` là iterable (có thể là generator chỉ duyệt được **một lần**). Trả `[[word, count], …]` k phần tử, sắp `count` giảm dần, bằng nhau thì `word` tăng dần (`localeCompare 'vi'`).

### ex10 · 🔮 Generator
Đọc `starter/ex10.js`, ghi 13 dòng output vào `answers/ex10.txt`.
