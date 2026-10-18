# C08 · Interceptors và decorator tự viết

Đọc khoảng 12 phút. Interceptor là tầng **bọc quanh handler**: chạy code trước, đi qua handler, rồi chạy code sau trên kết quả (hoặc lỗi). Cần RxJS ở mức `pipe`, `tap`, `map`, `timeout`, `catchError`. Cuối buổi bạn hoàn thiện bản đồ lifecycle của Nest.

## Mục tiêu
- Viết interceptor: đo thời gian, timeout, cache GET, và biết sai lầm thường gặp của mỗi loại.
- Viết decorator: `createParamDecorator`, `SetMetadata`/`Reflector.createDecorator`, `applyDecorators`.
- Đọc metadata của handler trong guard/interceptor bằng `Reflector`.
- Vẽ đúng thứ tự: middleware → guard → interceptor (trước) → pipe → handler → interceptor (sau) → filter.

## 1. Interceptor = hàm bọc một Observable
```ts
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = process.hrtime.bigint();                 // 1. TRƯỚC handler
    return next.handle().pipe(                               // 2. gọi pipe + handler, nhận Observable kết quả
      tap(() => { /* 3. SAU handler, khi có kết quả */ }),
    );
  }
}
```
- Không gọi `next.handle()` thì handler **không chạy** (cache hit dùng đúng điều này: `return of(cached)`).
- `tap` quan sát, `map` biến đổi kết quả, `catchError` biến đổi lỗi, `timeout(ms)` ném `TimeoutError` nếu quá hạn.
- Interceptor thấy **cả pipe** nằm trong `next.handle()`: lỗi validation ném ra từ bên trong observable.
- Đăng ký: `@UseInterceptors(X)` (route/controller), `app.useGlobalInterceptors(new X())` hoặc `{ provide: APP_INTERCEPTOR, useClass: X }` (global, có DI). Nhiều global: cái đăng ký **trước** là lớp ngoài cùng.
- `timeout()` chỉ bỏ chờ; promise handler đã bắt đầu thì **vẫn chạy tiếp** (không hủy được). Handler ghi DB vẫn ghi dù client nhận 408.

## 2. Decorator
```ts
// Param decorator: lấy thứ gì đó từ request
export const ReqId = createParamDecorator((_d, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().headers['x-request-id']);
handler(@ReqId() id: string)

// Metadata có kiểu, đọc bằng Reflector
export const Timeout = Reflector.createDecorator<number>();     // @Timeout(50)
const ms = this.reflector.getAllAndOverride(Timeout, [ctx.getHandler(), ctx.getClass()]);   // route thắng controller

// Gộp nhiều decorator thành một
export const AdminOnly = () => applyDecorators(SetMetadata(IS_ADMIN_ONLY, true), UseGuards(ApiKeyGuard));
```
`SetMetadata('key', v)` là dạng nguyên thủy; `Reflector.createDecorator<T>()` tự sinh khóa và có kiểu (khuyến nghị cho code mới). Đây là cùng cơ chế `design:paramtypes` và `@Get()` của T06–T07: decorator chỉ **ghi metadata**, một lớp khác (guard, interceptor, router) **đọc** nó lúc chạy.

## 3. Cache GET: đơn giản mà đầy bẫy
Bản trong bài (`GetCacheInterceptor`) tuân thủ:
1. Khóa = URL **đầy đủ** có query. Thiếu query thì `?page=2` trả trang 1.
2. Chỉ lưu khi handler thành công; lỗi 404 mà cache thì tạo xong vẫn "không có".
3. **Mọi ghi thành công xóa sạch cache**, kể cả `POST /v1/orders` vì nó đổi `stock` của sản phẩm. Quên chỗ này là "cache cho khách thấy còn hàng".
4. Có trần số mục: nếu không, `?q=ngẫu-nhiên` làm đầy RAM (tấn công rẻ nhất).
5. Lưu và trả **bản sao** (`structuredClone`), nếu không một nơi sửa body làm hỏng cache.
6. Thời gian lấy từ `ClockService` để test được hết hạn mà không `sleep`.
Cache trong process không dùng được khi chạy nhiều instance; B07 chuyển sang Redis, khi đó invalidation và stampede trở thành vấn đề thật.

## 4. Bản đồ lifecycle đầy đủ
```
request
 → middleware (global → module)
 → guard (global → controller → route)
 → interceptor, nửa TRƯỚC (global → controller → route)
 → pipe (global → controller → route → từng tham số)
 → HANDLER
 → interceptor, nửa SAU (route → controller → global)   ← thứ tự NGƯỢC
 → exception filter (route → controller → global) nếu có lỗi ở bất kỳ bước nào
 → response
```
`AsyncLocalStorage` (N01/N06) là cách cho tầng không thấy `req` (như pipe) cùng ghi vào một ngữ cảnh theo request; bài ex08 dùng nó và P01 dùng cho request id. Đừng dùng mảng/field ở mức singleton: request song song sẽ ghi đè lẫn nhau.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Đặt header trong `tap` sau khi đã gửi | `ERR_HTTP_HEADERS_SENT` | kiểm `res.headersSent` / đặt trước |
| Cache theo path không theo query | trả nhầm trang/bộ lọc | khóa = `originalUrl` |
| Cache không hết hạn / không trần | dữ liệu cũ, RAM tăng vô hạn | TTL + giới hạn mục |
| Quên invalidate khi ghi từ module khác | dữ liệu cũ sau khi đặt hàng | xóa cache ở mọi ghi thành công |
| `catchError` nuốt mọi lỗi thành 408 | che lỗi thật | chỉ đổi `TimeoutError` |
| Đọc `@Timeout` chỉ ở handler | cấu hình ở controller bị bỏ | `getAllAndOverride([handler, class])` |
| `SetMetadata` với khóa chuỗi gõ tay ở nhiều nơi | lệch khóa | export hằng/`Reflector.createDecorator` |
| Giữ trạng thái request trong singleton | log/trace lẫn nhau khi song song | AsyncLocalStorage hoặc gắn vào `req` |

## Dùng ở đâu trong `shop-api`
`@AdminOnly()` là tiền thân của `@Public()`/`@Roles()` (A02, A04), `Reflector` đọc metadata trong guard. `Server-Timing` và `X-Cache` dùng lại ở P04/P05 để đọc được hiệu quả cache khi `bench`. `ClassSerializerInterceptor` (A01) cũng chỉ là một interceptor `map` đổi object thành JSON. Bản cache bộ nhớ sẽ bị thay bằng `CacheInterceptor` + Redis ở B07.
