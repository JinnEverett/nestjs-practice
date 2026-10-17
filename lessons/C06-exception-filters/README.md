# C06 · Exception filters và định dạng lỗi

Đọc khoảng 10 phút. Hiện tại mỗi lỗi có một hình dạng khác nhau (mảng `message` của ValidationPipe, chuỗi của `NotFoundException`, `Cannot GET /x`...) và 500 có thể lộ thông tin. Module này thống nhất mọi lỗi thành **problem details (RFC 9457)** `application/problem+json`, đúng như `CONTRACT.md` mục 4, và tách lỗi nghiệp vụ khỏi HTTP.

## Mục tiêu
- Giải thích exception layer của Nest: ai bắt lỗi, theo thứ tự nào.
- Viết `@Catch()` filter toàn cục đăng ký bằng `APP_FILTER` (để có DI).
- Trả lỗi theo problem details, có `errors[]` cho validation và extension member cho lỗi domain.
- Không bao giờ lộ stack/thông điệp nội bộ ở 5xx; vẫn log đầy đủ phía server.
- Map lỗi domain (`OutOfStockError`...) sang HTTP ở tầng biên, không ở service.

## 1. Ai bắt lỗi
Lỗi ném trong middleware/guard/interceptor/pipe/handler đều rơi vào **exception filter**. Nếu không có filter nào khớp, bộ lọc mặc định của Nest: `HttpException` → trả `getResponse()`; còn lại → `500 {"statusCode":500,"message":"Internal server error"}` (và log). Chọn filter: lần lượt từ route → controller → global, filter **cụ thể nhất** khớp `@Catch(Type)` thắng; `@Catch()` không tham số bắt tất cả.

```ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}      // inject được vì đăng ký bằng APP_FILTER
  catch(exception: unknown, host: ArgumentsHost) { /* build problem → reply */ }
}
// app.module.ts
providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }]
```
`app.useGlobalFilters(new X())` trong `configureApp` cũng chạy nhưng **không có DI**. Dùng `HttpAdapterHost` thay vì `res.status().json()` để filter không phụ thuộc Express (P04 có thể đổi sang Fastify).

## 2. Problem details
```json
{
  "type": "urn:shop:error:out-of-stock",
  "title": "Conflict",
  "status": 409,
  "detail": "Sản phẩm #7 không đủ tồn kho (cần 5, còn 2)",
  "instance": "/v1/orders",
  "productId": 7, "requested": 5, "available": 2
}
```
- `type`: định danh **ổn định** cho client rẽ nhánh (đừng bắt client so chuỗi `detail`).
- `title`: cố định theo status. `detail`: câu cho người đọc, có thể đổi.
- `instance`: đường dẫn của request, **không** kèm query string (có thể chứa token).
- Thành phần mở rộng (`productId`, `errors`...) được phép.
- Content-Type `application/problem+json`.

## 3. Lỗi domain tách khỏi HTTP
```ts
export class OutOfStockError extends DomainError {
  readonly code = 'out-of-stock';
  constructor(readonly productId: number, readonly requested: number, readonly available: number) { super(...) }
}
// service:   throw new OutOfStockError(id, qty, stock)
// filter:    STATUS_BY_DOMAIN_CODE['out-of-stock'] === 409
```
Service dùng được từ queue/CLI mà không kéo `HttpException`; đổi status chỉ sửa một bảng. Test service kiểm `rejects.toBeInstanceOf(OutOfStockError)` thay vì status.

## 4. Validation có cấu trúc
`ValidationPipe({ exceptionFactory })` nhận cây `ValidationError[]`; làm phẳng thành `[{ field: 'items.1.quantity', message }]` và ném một `BadRequestException` con (`ValidationFailedException`). Filter nhận ra lớp đó và thêm `errors`. **Không** đưa `value` người dùng gửi vào kết quả (có thể là mật khẩu).

## 5. Lỗi không phải `HttpException`
Body JSON hỏng, body quá lớn do `body-parser` ném `http-errors` (có `status` nhưng không phải `HttpException`). Filter phải nhận diện theo `status`/`statusCode`, nếu không chúng thành 500. `throw 'chuỗi'` hay `throw null` cũng phải thành 500 chứ không làm filter tự nổ.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Trả `exception.message` cho 500 | lộ host DB, mật khẩu trong chuỗi kết nối | thông điệp chung + log chi tiết |
| `useGlobalFilters(new F())` khi F cần inject | `undefined` trong constructor | `APP_FILTER` |
| Filter không bắt `non-Error` | `throw null` làm crash filter | kiểm `instanceof` từng nhánh |
| Echo giá trị trong lỗi validation | lộ dữ liệu nhạy cảm | chỉ `field` + `message` |
| `instance` = `originalUrl` đầy đủ | token trong query lọt vào log/response | cắt query |
| Client rẽ nhánh theo `detail` | đổi câu chữ làm gãy app | rẽ nhánh theo `type` |
| Domain error kế thừa `HttpException` | service gắn chặt vào HTTP | map ở filter |

## Dùng ở đâu trong `shop-api`
`type` của lỗi là một phần của API contract (C11 sẽ mô tả trong OpenAPI). Guard (C07) ném `UnauthorizedException`/`ForbiddenException` và nhận lại đúng định dạng này. Mọi module sau (B05 lock timeout, R02 idempotency conflict) thêm `DomainError` mới + một dòng vào bảng status.
