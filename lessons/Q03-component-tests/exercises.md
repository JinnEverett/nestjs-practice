# Q03 · Bài tập

Viết spec trong `shop-api/src/common/...` cạnh file được test, chạy bằng `npm test`. Chấm: `bash lessons/check.sh lessons/Q03-component-tests NN|all`.

**Cách chấm** giống Q01: bộ chấm chạy spec của bạn trên (1) code của bạn, đo coverage nhánh, rồi (2) trên các bản **cố ý sai** của thành phần; spec phải bắt được ít nhất 80% lỗi và cho biết hành vi nào chưa có test. Vì vậy các thành phần phải giữ đúng tên và đường dẫn đã làm ở C05–C08:

| Thành phần | Tệp | Dựng thế nào trong spec |
|---|---|---|
| `ParseIdPipe`, `ParseSkuPipe` | `src/common/pipes/` | `new ParseIdPipe()` |
| `ApiKeyGuard` | `src/common/guards/api-key.guard.ts` | nhận `authConfig.KEY` (C09): `new ApiKeyGuard({ adminApiKey })` hoặc `Test.createTestingModule` |
| `TimeoutInterceptor`, `Timeout`, `DEFAULT_TIMEOUT_MS` | `src/common/interceptors/timeout.interceptor.ts` | `new TimeoutInterceptor(new Reflector())` |
| `GetCacheInterceptor`, `CacheTtl`, `MAX_CACHE_ENTRIES` | `src/common/interceptors/get-cache.interceptor.ts` | `new GetCacheInterceptor(new Reflector(), clock)` với `clock = { now: () => date }` |
| `AllExceptionsFilter` | `src/common/filters/all-exceptions.filter.ts` | `new AllExceptionsFilter({ httpAdapter } as HttpAdapterHost)` với `httpAdapter` chỉ có `getRequestUrl`, `getRequestMethod`, `setHeader`, `reply` |
| `RequestIdMiddleware`, `httpLogger` | `src/common/middleware/` | gọi `use(req, res, next)` / `httpLogger(req, res, next)` với `req`, `res` giả (`res` là `EventEmitter`) |

Filter của bạn phải gọi `httpAdapter.setHeader(res, 'Content-Type', ...)` và `httpAdapter.reply(res, body, status)` (đó là cách C06 hướng dẫn). Nếu bạn làm khác, hãy refactor cho khớp.

**Pass:** 6/7 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Pipe tự viết
`src/common/pipes/parse-id.pipe.spec.ts` và `parse-sku.pipe.spec.ts`. Phủ: đầu vào hợp lệ (chuỗi và number), từng loại sai (`0`, âm, lẻ, `1e3`, `0x10`, số 0 đứng đầu, khoảng trắng, quá 2^53, rỗng), độ dài biên của SKU (2/3/20/21), đầu vào không phải chuỗi, thông báo lỗi nêu tên tham số (kể cả khi thiếu metadata).
Yêu cầu mỗi spec: xanh, `>= 90%` nhánh, bắt `>= 80%` lỗi cài sẵn.

### ex02 · Guard với `ExecutionContext` giả
`src/common/guards/api-key.guard.spec.ts`. Không dựng HTTP. Phủ: khóa đúng, thiếu, sai, khác hoa thường, ngắn/dài hơn, rỗng, header lặp (mảng), không phải chuỗi, khóa rất dài (không ném lỗi ngoài `UnauthorizedException`), và khóa **lấy từ config** (hai guard với hai config khác nhau).
Yêu cầu: xanh, `>= 70%` nhánh, bắt `>= 80%` lỗi.

---

## 🟡 Kết hợp

### ex03 · Interceptor timeout với fake timers
`src/common/interceptors/timeout.interceptor.spec.ts`. Dùng `jest.useFakeTimers()`. Phủ: nhanh hơn hạn → kết quả; chậm hơn → `RequestTimeoutException` (biên 99/100/101 ms); mặc định 5000 ms; `@Timeout` ở handler ghi đè controller, ở controller được thừa kế; lỗi khác đi qua nguyên vẹn; thông báo nêu thời hạn.
Yêu cầu: xanh, `>= 80%` nhánh, bắt `>= 80%` lỗi.

### ex04 · Interceptor cache với đồng hồ giả
`src/common/interceptors/get-cache.interceptor.spec.ts`. Không HTTP, không `sleep`: tự đổi `date` của đồng hồ giả. Phủ: MISS rồi HIT (handler không chạy lại), khóa gồm query, hết hạn đúng biên, route không `@CacheTtl`, lỗi không được cache, lưu và trả bản sao, ghi thành công xóa cache còn ghi lỗi thì không (POST/PATCH/DELETE), trần `MAX_CACHE_ENTRIES` và loại mục cũ nhất.
Yêu cầu: xanh, `>= 85%` nhánh, bắt `>= 80%` lỗi.

### ex05 · Exception filter với `HttpAdapterHost` giả
`src/common/filters/all-exceptions.filter.spec.ts`. Phủ: header problem+json; `HttpException` 4xx (status, type theo bảng, title, detail); bảng mã (400, 401, 404, 408, 409, 413, 422, status lạ → `error`); `instance` không có query; message mảng nối `"; "`; `ValidationFailedException` có `errors`; ba lỗi domain kèm extension; 5xx ẩn detail; `Error`/chuỗi/`null`/`undefined` → 500 chung chung và có log; lỗi kiểu `http-errors` có `status`; status ngoài 400..599 bị bỏ qua; chỉ lỗi 5xx được log.
Yêu cầu: xanh, `>= 80%` nhánh, bắt `>= 80%` lỗi.

### ex06 · Middleware
`src/common/middleware/request-id.middleware.spec.ts` và `http-logger.middleware.spec.ts`. Request id: sinh UUID, dùng lại id sạch, thay id không sạch (quá ngắn/dài, khoảng trắng, ký tự lạ, tiếng Việt, CRLF), header lặp, `next` đúng một lần, mỗi request một id. Logger: `next` gọi ngay, chưa log trước `finish`, đúng một dòng sau `finish` đủ method/path/status/ms/requestId, không có query string, mức `log`/`warn`/`error` theo status (biên 399/400/499/500), thiếu id → `-`.
Yêu cầu mỗi spec: xanh, `>= 85%` nhánh, bắt `>= 80%` lỗi.

---

## 🔴 Thực tế

### ex07 · "Bộ test mất vài phút và đỏ ngẫu nhiên"
Sau vài tuần, `npm test` chậm và đỏ lúc có lúc không; không ai muốn chạy nó trước khi push. Rà tám spec ở trên:
- Toàn bộ chạy trong **dưới 40 giây**; không `sleep` thật, không `await new Promise(r => setTimeout(r, ...))`.
- Mỗi test có assertion (`expect.hasAssertions()` được bật cho cả bộ).
- Xanh ở 3 seed ngẫu nhiên khác nhau (`--randomize`).
- Test thời gian của timeout dùng `jest.useFakeTimers()`.
- Spec nào `jest.spyOn(...)` thì cũng khôi phục (`restoreAllMocks`/`mockRestore`...).

---

> 📏 Câu hỏi (không chấm): tám spec chạy bao nhiêu giây, và e2e C07 chạy bao nhiêu giây để kiểm cùng những hành vi của `ApiKeyGuard` + `RequestIdMiddleware`? Thử bỏ spec guard đi và xem bộ e2e có còn bắt được lỗi "so sánh khóa không dùng `timingSafeEqual`" không. Kết luận về tỉ lệ test ở từng tầng (Q04).
