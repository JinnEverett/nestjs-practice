# N07 · Bài tập

Viết vào `answers/exNN.js` (ES module). Bài 🐞 có code lỗi trong `starter/exNN.js`: copy sang `answers/` rồi sửa (giữ nguyên tên export). Bài 🔮 ghi vào `answers/exNN.txt`.
Chấm: `bash lessons/check.sh lessons/N07-debug 01`. Đáp án: `solutions/`.

**Pass:** 7/8 bài, trong đó cả 3 bài 🐞 (ex01–ex03) phải đạt — đây là tiêu chí "debug được 3 bug cài sẵn". Dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · 🐞 "Đơn xác nhận nhưng email không đi"
Team CSKH báo: sau khi gọi `confirmOrders`, hàm trả `0` ngay và có email bị mất, thỉnh thoảng process chết với `unhandledRejection`. Mở `starter/ex01.js`, tìm lỗi bằng debugger/logpoint (đừng chỉ đọc!), rồi sửa trong `answers/ex01.js` để hàm có hợp đồng:
`confirmOrders(orders, mailer)` → `Promise<{ sent, failed }>` với `failed: [{ id, error }]` theo thứ tự đơn.
- Gửi tối đa **3 email song song**; một email lỗi **không** làm dừng các email khác.
- Chỉ resolve khi **mọi** email đã xong. Không để lại rejection chưa xử lý.

### ex02 · 🐞 "RAM tăng mãi"
`starter/ex02.js` có hai nguồn rò: `createHub()` (pub/sub, không cách nào gỡ listener) và `memoize(fn)` (cache không giới hạn, cache cả promise bị reject). Sửa trong `answers/ex02.js`:
- `createHub({ onError, maxListeners = 10, onWarn })`: `on(event, handler)` **trả về hàm hủy đăng ký** (gọi nhiều lần vô hại); `once`; `emit(event, ...args)` gọi handler theo thứ tự đăng ký, trả số handler đã gọi, **một handler ném lỗi không làm các handler khác bị bỏ qua** (báo qua `onError(err, event)`); gỡ listener ngay trong lúc `emit` không làm hỏng vòng lặp; `listenerCount(event)`. Số listener của một event vượt `maxListeners` → gọi `onWarn(event, count)` **một lần** cho event đó.
- `memoizeLru(fn, { max = 100 })`: cache theo đối số đầu tiên (`String(arg)`), loại phần tử **ít dùng gần đây nhất** khi vượt `max`; hàm `async` thì cache promise nhưng **xóa khỏi cache khi reject**; có `.size()` và `.clear()`.

### ex03 · 🐞 "Bán vượt tồn kho"
Flash sale: 10 sản phẩm nhưng có 14 đơn thành công. `starter/ex03.js` đọc–kiểm tra–ghi qua `await` (race condition). Sửa để `createInventory(db).reserve(sku, qty)`:
- Với 50 lời gọi **đồng thời** `reserve('A', 1)` khi tồn 10 → đúng 10 `true`, 40 `false`; tồn cuối = 0.
- Hai SKU khác nhau vẫn chạy **song song** (không khóa toàn cục).
- `db.get/set` ném lỗi thì khóa của SKU đó vẫn được nhả (không deadlock), lỗi được ném lại cho caller.
- `qty` không phải số nguyên dương → `RangeError`.

---

## 🟡 Kết hợp

### ex04 · `createLogger(options)` — JSON có cấu trúc
`options`: `{ level = 'info', sink, base = {}, redact, now = Date.now }`.
- Phương thức `trace/debug/info/warn/error/fatal(msg, fields?)`. Mỗi lần ghi gọi `sink(line)` với `line` là **một chuỗi JSON** có `level` (tên chữ), `time` (ISO từ `now()`), `msg`, rồi `...base`, rồi `...fields`. Dưới level bị bỏ qua. `isLevelEnabled(level)`.
- `child(bindings)` → logger mới cùng sink/level/redact, `base` gộp thêm `bindings`.
- Giá trị là `Error` (ở bất kỳ vị trí nào trong `fields`) → `{ type: <name>, message, stack, cause? }` (đệ quy theo `cause`; thêm `code` nếu có).
- Redact (không phân biệt hoa thường, mọi độ sâu, kể cả trong mảng): các khóa mặc định `password, token, authorization, cookie, secret, apikey, api_key` (+ `redact` nếu truyền thêm) → `"[REDACTED]"`.
- Vòng tham chiếu → `"[Circular]"`; `BigInt` → chuỗi; `Date` → ISO; `undefined` bị bỏ; không bao giờ ném lỗi khi serialize.
- `fields` không được ghi đè `level`, `time`, `msg`.

### ex05 · Ngữ cảnh request bằng `AsyncLocalStorage`
- `runWithContext(ctx, fn)` → trả kết quả của `fn` (sync hay Promise). Lồng nhau thì **gộp** (`{...ngoài, ...trong}`), thoát ra thì ngữ cảnh ngoài trở lại.
- `getContext()` → bản sao nông của ngữ cảnh hiện tại hoặc `undefined` khi ở ngoài.
- `setContextValue(key, value)` bổ sung vào ngữ cảnh hiện tại (vd. `userId` sau khi xác thực), ném `Error('No active context')` nếu ở ngoài.
- `createContextLogger(logger)`: trả object có `trace…fatal(msg, fields)` gọi `logger.<level>(msg, { ...getContext(), ...fields })` **tại thời điểm ghi log**.
- Phải đúng với `await`, `setTimeout`, `Promise.all`, và **50 request đồng thời** không lẫn ngữ cảnh.

### ex06 · Đọc stack trace: `parseStack`, `errorChain`, `firstAppFrame`
- `parseStack(stack)` → mảng `{ fn, file, line, col, async, internal, vendor }` cho từng dòng `at …` (bỏ dòng khác). Hỗ trợ: `at fn (file:L:C)`, `at file:L:C`, `at async fn (…)`, `at new Foo (…)`, `at Object.<anonymous> (…)`, `at fn [as alias] (…)`, đường dẫn Windows (`C:\x\y.js:3:5`) và `file:///…`. `fn` là `null` khi không có tên. `internal`: file bắt đầu `node:` hoặc là `<anonymous>`; `vendor`: đường dẫn chứa `node_modules` (cả `/` lẫn `\`). Frame không có vị trí dòng/cột (vd. `at Array.map (<anonymous>)`) có `line` và `col` là `null`.
- `errorChain(err)` → mảng `{ name, message, code?, depth }` đi theo `cause` (tối đa 10 tầng, chống vòng). Với `AggregateError`, sau chính nó (và chuỗi `cause` nếu có) là chuỗi của từng phần tử trong `errors` (depth + 1), theo thứ tự. `cause` không phải object (vd. chuỗi) → `{ name: 'NonError', message: String(cause), depth }`.
- `firstAppFrame(err, { root })` → frame đầu tiên của `err.stack` không `internal`, không `vendor` và (nếu có `root`) có `file` bắt đầu bằng `root`; không có → `null`.

---

## 🔴 Thực tế

### ex07 · 🔮 Process thoát thế nào?
`starter/ex07.js` chạy 6 kịch bản con và in mỗi kịch bản một dòng `tên: code=<mã thoát> stdout=<…> stderrCoLoi=<true|false>`. Đoán trước 6 dòng output (đúng thứ tự) và ghi vào `answers/ex07.txt`, **rồi mới chạy**.

### ex08 · `diagnose(samples)` — phân loại sự cố từ số đo
`samples`: mảng điểm đo (mỗi giây/phút một điểm) với các trường số, trường nào cũng có thể thiếu: `heapMb, loopLagMs, cpuPct, dbPoolWaiting, p99Ms, upstreamMs`. Trả `{ verdict, evidence }` (`evidence` mảng chuỗi mô tả bằng chứng, có nêu tên số đo; rỗng khi `healthy`).
Thứ tự ưu tiên:
1. `< 5` điểm → `insufficient-data`.
2. `memory-leak`: ≥ 10 điểm có `heapMb`; hồi quy tuyến tính `heapMb` theo chỉ số có độ dốc > 0.5 MB/điểm, `R² ≥ 0.9`, và điểm cuối ≥ 1.3× điểm đầu.
3. `event-loop-blocked`: ≥ 3 điểm có `loopLagMs > 100`.
4. `pool-exhausted`: ≥ 30% điểm có `dbPoolWaiting > 0` **và** trung bình `cpuPct` < 60.
5. `slow-upstream`: trung vị `p99Ms` > 1000, trung vị `upstreamMs` ≥ 0.6 × trung vị `p99Ms`, trung bình `loopLagMs` < 50.
6. còn lại `healthy`.

> 📏 Câu hỏi quy mô (không chấm): `memoizeLru` với `max = 100000` và mỗi giá trị 5KB. Bộ nhớ tối đa? Nếu key có thể là input người dùng (`/search?q=…`), kẻ tấn công làm gì? Gợi ý: giới hạn theo kích thước, TTL, và Redis (B07).
