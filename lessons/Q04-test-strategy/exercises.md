# Q04 · Bài tập

Tiếp tục `shop-api` sau Q03. Chấm: `bash lessons/check.sh lessons/Q04-test-strategy NN|all`. Một số bài dùng tệp trong `starter/src/demo/`: sao chép thư mục này vào `shop-api/src/demo/` trước.

**Pass:** 5/6 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Chọn tầng test
Với mỗi tình huống, ghi một trong `unit`, `component`, `e2e`, `none` (không đáng test riêng) vào `lessons/Q04-test-strategy/answers/ex01.txt`, mỗi dòng `N: tầng`:
1. Công thức giảm 10% làm tròn xuống của `PricingService.quote`.
2. `ValidationPipe` toàn cục từ chối field lạ ở `POST /v1/orders`.
3. `ParseIdPipe` từ chối `'1e3'`.
4. `POST /v1/products` phải yêu cầu `X-Api-Key` (decorator gắn đúng route).
5. Getter `get requestId()` chỉ trả `req.headers['x-request-id']`.
6. `GetCacheInterceptor` hết hạn đúng biên TTL.
7. Đặt hàng trừ tồn kho và trả `409` khi hết hàng, qua HTTP.
8. Chuỗi tiếng Việt trong thông báo lỗi `Sản phẩm #7 không đủ tồn kho`.
9. Thứ tự middleware → guard → interceptor → pipe → handler.
10. `AllExceptionsFilter` không lộ stack ở lỗi 5xx.

Pass: đúng ≥ 8/10 và dùng ít nhất 3 tầng khác nhau. Hãy ghi lý do một dòng cho mỗi câu vào ghi chú riêng của bạn; coach sẽ hỏi.

### ex02 · Coverage 100% mà không kiểm gì
Sao chép `starter/src/demo/discount.ts` và `discount.spec.ts`. Spec hiện tại đạt coverage đầy đủ nhưng chỉ `expect(true).toBe(true)`.
- Viết lại `src/demo/discount.spec.ts` kiểm thật (biên 9/10/49/50, làm tròn xuống, trần 20000 và đúng trần, đơn giá 0, đầu vào sai ném `RangeError`...). **Không sửa `discount.ts`.**
- Bộ chấm: mỗi test có assertion; coverage nhánh vẫn `>= 90%`; spec bắt `>= 80%` lỗi cài sẵn. Đây là thước đo "test có nghĩa", không phải coverage.

---

## 🟡 Kết hợp

### ex03 · TDD một tính năng: `selectLowStock`
Viết **test trước**, qua ít nhất 3 vòng Red → Green → Refactor, hàm thuần `selectLowStock(products, threshold = 5)` trong `src/products/low-stock.ts`:
- Export `selectLowStock`, `LOW_STOCK_DEFAULT = 5`, `LOW_STOCK_MAX = 1000`.
- Trả sản phẩm **đang bán** (`isActive`) có `stock <= threshold`, ít hàng nhất trước, hòa thì `id` nhỏ trước. Không đổi mảng đầu vào; trả **bản sao** từng sản phẩm. `threshold` phải là số nguyên `0..1000`, nếu không ném `RangeError`.
- Spec của bạn: `src/products/low-stock.spec.ts`. Bộ chấm: xanh, mỗi test có assertion, `>= 90%` nhánh, bắt `>= 80%` lỗi cài sẵn.
- Ghi nhật ký vào `lessons/Q04-test-strategy/answers/ex03.md`: ít nhất 3 mục `## Vòng N`, mỗi mục có **Red** (tên test và kết quả đỏ thật, dán `FAIL`/`Expected`/`Received`), **Green** (mã tối thiểu), **Refactor**; cuối file mục `## Nhận xét` (≥ 600 ký tự): TDD đã đổi thiết kế hàm thế nào, và điều gì bạn chưa chắc.

### ex04 · Nối vào HTTP: `GET /v1/products/low-stock`
- `@AdminOnly()`, query `threshold` (nguyên `0..1000`, mặc định 5; sai → `400 validation`, tham số lạ cũng `400`), trả `{ data: Product[], meta: { threshold, total } }`. Dùng `selectLowStock` (không viết lại logic).
- Route tĩnh đứng trước `:id`. Không cache: sau khi đặt hàng làm tồn kho giảm, lần gọi sau thấy ngay. Phản hồi là bản sao mới mỗi lần.
- Đây là bài e2e *duy nhất* của tính năng: logic đã được unit test ở ex03, tầng HTTP chỉ kiểm lắp ghép (quyền, validate, thứ tự route, cache).

---

## 🔴 Thực tế

### ex05 · "Test xanh ở máy dev, đỏ ở CI và đỏ lúc nửa đêm"
Sao chép `starter/src/demo/order-window.ts` và `order-window.spec.ts`. Hàm cho biết có nhận đặt hàng không (thứ Hai–thứ Bảy, 08:00 gồm đến 22:00 không gồm, **giờ Việt Nam**). Spec tác giả viết xanh trên máy ở Việt Nam, đỏ trên CI chạy UTC, và thỉnh thoảng đỏ vào ban đêm.
- Sửa **spec** (không sửa `order-window.ts`): bỏ giờ địa phương (`new Date(năm, tháng, ...)`, `getHours()`), bỏ phụ thuộc `new Date()` thật (nếu cần thì giả đồng hồ bằng `jest.useFakeTimers().setSystemTime`), bỏ biến `calls` dùng chung.
- Bộ chấm chạy spec của bạn ở 4 múi giờ (`UTC`, `Asia/Ho_Chi_Minh`, `America/Los_Angeles`, `Pacific/Kiritimati`), ở 3 seed ngẫu nhiên, và kiểm bạn vẫn bắt `>= 80%` lỗi cài sẵn (biên 07:59/08:00/21:59/22:00, Chủ nhật, múi giờ, phút...).

---

## 📏 Đo

### ex06 · Ngân sách kim tự tháp
Đếm test của `shop-api` theo ba tầng, chạy riêng từng tầng để lấy thời gian (`npm test` cho unit+component, `npm run test:e2e` cho e2e). Viết `lessons/Q04-test-strategy/answers/ex06.md`:
- Mục **Dự đoán** (viết trước khi đếm): tỉ lệ số test và tỉ lệ thời gian của ba tầng.
- Bảng `| tầng | số test | tổng giây | giây/test |` với ba dòng `unit`, `component`, `e2e` (số thật).
- So với 70/20/10 (kim tự tháp); nêu ít nhất một test **nên xóa hoặc không nên viết** và lý do chi phí–giá trị. Nội dung ≥ 500 ký tự.

---

> Câu hỏi mở (không chấm): nếu CI chỉ cho phép 60 giây cho toàn bộ test, bạn sẽ bỏ những test nào trước? Với B01 sắp thêm DB thật, tầng nào sẽ phình ra nhiều nhất và bạn sẽ giữ nó trong ngân sách bằng cách nào (gợi ý: Q02)?
