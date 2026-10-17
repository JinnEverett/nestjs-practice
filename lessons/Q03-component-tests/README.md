# Q03 · Test từng thành phần của Nest

Đọc khoảng 10 phút. Q01 test service; e2e (C02–C12) test cả chuỗi. Giữa hai thái cực đó, pipe, guard, interceptor, filter và middleware có logic **riêng, nhiều nhánh** (biên, lỗi, thời gian) mà e2e chỉ chạm tới một phần. Test chúng riêng lẻ: nhanh, chỉ đúng chỗ khi hỏng, và dựng được tình huống khó gặp qua HTTP (hết giờ, 5xx lạ, `throw null`).

## Mục tiêu
- Dựng `ExecutionContext`, `ArgumentsHost`, `req/res` giả tối thiểu thay vì dựng cả ứng dụng.
- Test code bất đồng bộ và theo thời gian bằng **fake timers** thay vì `sleep`.
- Test interceptor trả `Observable` (`firstValueFrom`, `lastValueFrom`), kể cả đường lỗi.
- Giữ bộ test nhanh, xác định, không rò mock giữa các file.

## 1. Chọn mức giả vừa đủ
| Thành phần | Dựng gì | Giả gì |
|---|---|---|
| Pipe | `new Pipe()` | không cần gì |
| Guard | `new Guard(config)` hoặc `Test.createTestingModule` nếu có DI | `ExecutionContext` tối thiểu: `{ switchToHttp: () => ({ getRequest: () => ({ headers }) }) }` |
| Interceptor | `new Interceptor(reflector, clock)` | `ExecutionContext` (`getHandler`, `getClass`, `switchToHttp`), `CallHandler { handle: () => of(...) }` |
| Filter | `new Filter(adapterHost)` | `HttpAdapterHost` với `getRequestUrl`, `getRequestMethod`, `setHeader`, `reply`; `ArgumentsHost` |
| Middleware | `new Middleware().use(req, res, next)` | `req`, `res` (`EventEmitter` để phát `finish`), `next = jest.fn()` |

Quy tắc: **chỉ giả những gì thành phần thật sự dùng**; đừng dựng cả `AppModule` để test một pipe. `as unknown as ExecutionContext` là chấp nhận được trong test (kiểu giả tối thiểu), không phải trong code chạy thật.

## 2. Interceptor là `Observable`
```ts
const out = interceptor.intercept(ctx, { handle: () => of(body) });
await expect(firstValueFrom(out)).resolves.toEqual(...);          // giá trị đầu
await lastValueFrom(out);                                          // giá trị cuối (khi completes)
await expect(firstValueFrom(out)).rejects.toBeInstanceOf(X);       // đường lỗi
```
Kiểm `next.handle` **có được gọi không** (cache HIT thì không). Observable lười: không `subscribe` thì không có gì chạy.

## 3. Thời gian: fake timers và đồng hồ giả
```ts
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const p = firstValueFrom(interceptor.intercept(ctx, { handle: () => timer(101) }));
const assertion = expect(p).rejects.toBeInstanceOf(RequestTimeoutException);   // gắn kỳ vọng TRƯỚC khi tua
await jest.advanceTimersByTimeAsync(101);                                       // tua, flush microtask
await assertion;
```
- Dùng bản **Async** (`advanceTimersByTimeAsync`) khi có Promise/RxJS xen kẽ.
- Gắn `expect(...).rejects` trước khi tua để tránh "unhandled rejection" làm test đỏ ngẫu nhiên.
- Với thứ đã inject giờ (ClockService của C01–C03) chỉ cần `{ now: () => date }` và tự đổi `date`: nhanh hơn, không cần fake timers.
- Test biên: 99 ms qua, 100 ms hết hạn. Lỗi lệch một đơn vị là loại lỗi mutation hay tìm ra nhất.

## 4. Filter và middleware: kiểm cái người dùng *không được thấy*
Với filter đừng chỉ kiểm "trả đúng status". Kiểm thêm: chi tiết 5xx không lộ, `instance` không chứa query, lỗi lạ (`throw null`) không làm filter tự nổ, chi tiết thật *đi vào log*. Với middleware: `next` gọi đúng một lần, id do client gửi bị bỏ nếu không sạch, log chỉ ghi một dòng sau `finish`.

## 5. Giữ bộ test khỏe
- Mọi spy lên `Logger`/`console` phải được khôi phục (`afterEach(() => jest.restoreAllMocks())`).
- Không `sleep` thật; không phụ thuộc thứ tự (Jest 30: `--randomize`).
- Mỗi test có ít nhất một `expect` (`expect.hasAssertions()`).
- Bộ test đơn vị chạy trong vài giây: nếu mất vài chục giây, người ta ngừng chạy nó.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Quên `jest.useRealTimers()` | test sau treo hoặc sai giờ | `afterEach` |
| `advanceTimersByTime` (đồng bộ) với Promise | Promise chưa chạy xong | bản `Async` |
| `expect(promise).rejects` sau khi tua | unhandled rejection | gắn trước, `await` sau |
| `mockImplementation` không restore | spy rò sang file khác | `restoreAllMocks` |
| Chỉ test đường vui của filter | lộ lỗi 500 ở production | thêm `throw null`, `throw 'chuỗi'`, 5xx |
| Giả `ExecutionContext` đầy đủ mọi method | test dài, dễ lỗi | chỉ giả method được gọi |
| Kiểm `toHaveBeenCalled()` thay vì tham số | xanh với lời gọi sai | `toHaveBeenCalledWith` |

## Dùng ở đâu trong `shop-api`
Các spec này là lưới an toàn khi thay phần ruột: A02 thay `ApiKeyGuard` bằng `JwtAuthGuard` (cùng khung test), B07 thay cache bộ nhớ bằng Redis (spec cache tương tự, giả Redis), P01 thay `httpLogger` bằng `nestjs-pino`. Q04 bàn xem bao nhiêu test ở mỗi tầng là hợp lý.
