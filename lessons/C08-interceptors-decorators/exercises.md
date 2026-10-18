# C08 · Bài tập

Tiếp tục `shop-api` sau C07. Chấm: `bash lessons/check.sh lessons/C08-interceptors-decorators NN|all`. Phần lớn bài kiểm bằng **controller thử nghiệm** (`/boom/...`) mà bộ chấm gắn vào `AppModule` của bạn, nên decorator/interceptor của bạn phải hoạt động trên controller bất kỳ, không chỉ trên products.

Đăng ký interceptor của bài 02, 03, 05 là **toàn cục** (`APP_INTERCEPTOR`). Cập nhật bảng mã lỗi của filter C06: `408` → `request-timeout`.

**Pass:** 6/8 bài, ≤ 2 hint. Bài 🔮 ex07 phải đoán đúng ≥ 12/14 vị trí.

---

## 🟢 Cơ bản

### ex01 · Param decorator `@ReqId()`
`src/common/decorators/req-id.decorator.ts` export `ReqId` (`createParamDecorator`). Trong handler `handler(@ReqId() id: string)` nhận đúng id của request hiện tại (cái đang nằm trong header `X-Request-Id` của response, kể cả id sạch do client gửi). Song song nhiều request không lẫn.

### ex02 · `TimingInterceptor`
`src/common/interceptors/timing.interceptor.ts` export `TimingInterceptor`: mọi phản hồi thành công (GET lẫn ghi) có header `Server-Timing: app;dur=<ms>` (số, một chữ số thập phân là đủ). Đo thời gian của phần handler (kể cả pipe).

---

## 🟡 Kết hợp

### ex03 · `TimeoutInterceptor` + `@Timeout(ms)`
`src/common/interceptors/timeout.interceptor.ts` export `TimeoutInterceptor` và decorator `Timeout` (nên dùng `Reflector.createDecorator<number>()`).
- Giới hạn mặc định `5000` ms; `@Timeout(50)` ở handler hoặc controller ghi đè (handler thắng controller).
- Quá hạn → `408 Request Timeout` (`type = urn:shop:error:request-timeout`, problem+json). Lỗi khác của handler (404...) đi qua nguyên vẹn.
- Giữ ý thức: timeout chỉ bỏ chờ, không hủy việc đang chạy.

### ex04 · `@AdminOnly()`
`src/common/decorators/admin-only.decorator.ts` export `AdminOnly` và hằng `IS_ADMIN_ONLY` (chuỗi khóa metadata).
- `AdminOnly()` = `applyDecorators(SetMetadata(IS_ADMIN_ONLY, true), UseGuards(ApiKeyGuard))`.
- Đọc được bằng `new Reflector().get(IS_ADMIN_ONLY, handler)` → `true`; route không gắn → `undefined`.
- Thay `@UseGuards(ApiKeyGuard)` ở mọi route ghi của products và orders bằng `@AdminOnly()`; không còn `@UseGuards(ApiKeyGuard)` trong hai controller đó. Hành vi C07 giữ nguyên.

### ex05 · Cache GET bằng interceptor
`src/common/interceptors/get-cache.interceptor.ts` export `GetCacheInterceptor` và decorator `CacheTtl` (giây).
- Chỉ route GET có `@CacheTtl(n)` mới cache; gắn `@CacheTtl(30)` cho `GET /v1/products`, `GET /v1/products/:id`, `GET /v2/products`.
- Header `X-Cache: MISS` lần đầu, `HIT` các lần sau; HIT không chạy lại handler/service. Header khác của handler (`Cache-Control` của ex01 C02) vẫn còn.
- Khóa là URL đầy đủ có query. Hết hạn tính bằng `ClockService` (bộ chấm chỉnh giờ để kiểm, không `sleep`).
- Lỗi (404...) **không** được cache. Cache lưu và trả **bản sao**.
- Tối đa **1000** mục; vượt thì bỏ mục cũ nhất.

### ex06 · Vô hiệu hóa khi có ghi
- Mọi request ghi (POST/PATCH/DELETE) **thành công** xóa sạch cache. Ghi **thất bại** (401, 400, 404, 409...) không xóa.
- Đặc biệt: `POST /v1/orders` làm đổi tồn kho nên `GET /v1/products/:id` ngay sau đó phải thấy `stock` mới.

---

## 🔴 Thực tế

### ex07 · 🔮 Thứ tự lifecycle
Ghi dự đoán vào `lessons/C08-interceptors-decorators/answers/ex07.txt` **trước khi chạy**: mỗi dòng một sự kiện theo thứ tự xảy ra khi gọi `GET /x?a=1`, đúng 14 dòng, dùng đúng các nhãn trong mã dưới (`middleware`, `guard:global`, `int:controller:before`, `pipe:route`, `handler`, `int:route:after`...).
```ts
const mark = (s: string) => log.push(s);

// Guard: mark('guard:global' | 'guard:controller' | 'guard:route') rồi return true
// Interceptor X: mark(`int:X:before`); return next.handle().pipe(tap(() => mark(`int:X:after`)))
// Pipe X: mark(`pipe:X`); return value        // global / route / param

@Controller('x')
@UseGuards(ControllerGuard)
@UseInterceptors(ControllerInterceptor)
class X {
  @Get()
  @UseGuards(RouteGuard)
  @UseInterceptors(RouteInterceptor)
  @UsePipes(RoutePipe)
  handle(@Query('a', ParamPipe) _a: string) { mark('handler'); return { ok: true }; }
}

app.use((_req, _res, next) => { mark('middleware'); next(); });
app.useGlobalGuards(new GlobalGuard());
app.useGlobalInterceptors(new GlobalInterceptor());
app.useGlobalPipes(new GlobalPipe());
```
Sau khi nộp, vẽ sơ đồ lifecycle bằng lời của bạn và giải thích vì sao `after` đảo ngược.

### ex08 · "Mobile hỏi: request của em đi qua những đâu?"
Làm `GET /v1/_trace?n=<số>` (controller `_trace`, version 1) để nhìn tận mắt lifecycle. Có đủ một middleware, một guard, một interceptor và một pipe riêng cho route này (`src/trace/`), mỗi cái ghi tên mình vào **danh sách sự kiện của chính request đó**.
- Body: `{ n, order }` với `order = ['middleware','guard','interceptor:before','pipe','handler']`. `n` đi qua pipe: query là chuỗi nhưng `n` trong body là số; thiếu hoặc không phải số → `0`.
- Header `X-Trace` = `order` đầy đủ nối bằng dấu phẩy **kèm** `interceptor:after` ở cuối.
- 25 request song song cho kết quả đúng, độc lập từng cái. Pipe không thấy `req`: tìm cách chia sẻ ngữ cảnh theo request mà không dùng biến toàn cục (gợi ý: `AsyncLocalStorage`).
- Route khác không bị ảnh hưởng (không có `X-Trace`).

---

> 📏 Câu hỏi (không chấm): `GET /v1/products?limit=100` với 10 000 sản phẩm: cache HIT nhanh hơn MISS bao nhiêu lần? Dự đoán, rồi đo bằng `bench` ở `1,10` connection. Chi phí `structuredClone` của body 100 phần tử là bao nhiêu so với việc gọi lại service? Khi nào việc clone này tốn hơn lợi ích?
