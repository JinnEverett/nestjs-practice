# C07 · Middleware và Guards

Đọc khoảng 11 phút. Từ T07 bạn biết một request đi qua một chuỗi hàm; N05 dạy middleware của Express. Nest thêm các tầng có **ngữ cảnh** (biết handler nào sắp chạy): guard, interceptor, pipe. Module này làm hai tầng đầu của chuỗi: middleware (request id, log) và guard (khóa API cho route ghi).

## Mục tiêu
- Phân biệt middleware (không biết handler) với guard (biết `ExecutionContext`), và chọn đúng tầng.
- Viết middleware dạng class và dạng hàm, áp dụng bằng `configure(consumer)` với `forRoutes`/`exclude`.
- Viết guard (`CanActivate`), áp dụng ở route/controller/global, hiểu vì sao guard chạy **trước** pipe.
- So sánh bí mật bằng `timingSafeEqual`, không ghi bí mật vào log, fail closed.

## 1. Thứ tự một request
```
request → middleware → guard → interceptor(trước) → pipe → handler → interceptor(sau) → filter (khi lỗi) → response
```
Hệ quả quan trọng:
- Middleware chạy trước mọi thứ, **kể cả với route không tồn tại**: chỗ đúng cho `X-Request-Id`, log.
- Guard chạy trước pipe: người chưa xác thực chỉ nhận 401, không thấy lỗi validation (không lộ luật dữ liệu), không chạm DB để tìm `:id`.
- Lỗi ném từ middleware/guard đi qua exception filter (C06), nên `401` trả về đúng problem+json.

## 2. Middleware
```ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {   // class: inject được provider
  use(req: Request, res: Response, next: NextFunction) { /* ... */ next(); }
}
export function httpLogger(req, res, next) { /* ... */ next(); }  // hàm: gọn, không DI

@Module({...})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes({ path: '*splat', method: RequestMethod.ALL });
    consumer.apply(httpLogger).exclude('ping').forRoutes({ path: '*splat', method: RequestMethod.ALL });
    consumer.apply(noStore).forRoutes(OrdersController);   // theo controller: tự hiểu tiền tố phiên bản /v1
  }
}
```
- Thứ tự `apply` = thứ tự chạy; cái nào cần dữ liệu do cái trước tạo (logger cần request id) phải đứng sau.
- Nest 12/Express 5: wildcard phải đặt tên (`*splat`), `'*'` trần không còn hợp lệ.
- Gắn theo class controller sạch hơn viết lại đường dẫn có `v1`.
- Middleware không biết handler, không biết user: chỉ làm việc **chung cho mọi request**. Cần biết handler/metadata thì dùng guard/interceptor.
- Ghi log trong `res.on('finish')` mới có status code và thời gian thật.

## 3. Guard
```ts
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    // so khớp -> true; ngược lại ném UnauthorizedException (filter C06 biến thành problem+json)
  }
}
@Post() @UseGuards(ApiKeyGuard) create() {}            // route
@UseGuards(ApiKeyGuard) @Controller('x') class X {}     // controller
{ provide: APP_GUARD, useClass: ApiKeyGuard }           // toàn cục, có DI (A02 dùng cách này + @Public())
```
`ExecutionContext` cho biết kiểu giao thức (`http`, `rpc`, `ws`), class và handler sắp chạy (`getClass()`, `getHandler()`), nền cho `@Roles()` ở A04. Guard trả `false` thì Nest ném `403 Forbidden`; muốn `401` hãy tự ném `UnauthorizedException`.

## 4. Xử lý bí mật đúng cách
- **Constant-time compare**: `a === b` thoát sớm ở ký tự khác đầu tiên, rò độ dài tiền tố đúng. Dùng `crypto.timingSafeEqual`, nhưng nó **ném lỗi nếu hai buffer khác độ dài**: băm cả hai bằng SHA-256 trước.
- **Fail closed**: thiếu cấu hình ở production thì từ chối tất cả, không dùng khóa mặc định.
- **Không log bí mật**: log chỉ ghi `path` (không query), không ghi header `Authorization`/`X-Api-Key`.
- Khóa API chỉ là bước đệm. A02 thay bằng JWT; C09 đọc khóa từ `ConfigService`.

## 5. Request id
Id do client gửi chỉ nên nhận khi nó "sạch" (`^[A-Za-z0-9._-]{8,64}$`); nếu không, sinh `randomUUID()`. Nhận bừa cho phép client nhét chuỗi dài/ký tự lạ vào log của bạn. Không lưu id vào field của singleton (`this.currentId`): 30 request đồng thời sẽ ghi đè lẫn nhau. Mỗi request mang id trên chính `req`; P01 sẽ dùng `AsyncLocalStorage`.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| `forRoutes('*')` trên Nest 12 | lỗi path-to-regexp | `{ path: '*splat', method: RequestMethod.ALL }` |
| Guard ở controller bảo vệ cả route GET công khai | khách không đọc được catalog | `@UseGuards` ở từng route ghi |
| Tin `x-request-id` của client | log bị đầu độc | whitelist ký tự + độ dài |
| `provided === expected` | rò thông tin qua thời gian | băm + `timingSafeEqual` |
| `timingSafeEqual` với độ dài khác nhau | ném lỗi → 500 | băm trước |
| Id request lưu ở field của service | trộn log giữa request | gắn vào `req` / ALS |
| Log cả `req.originalUrl` | token trong query lọt vào log | cắt query |
| Guard `return false` | 403 thay vì 401 | ném `UnauthorizedException` |

## Dùng ở đâu trong `shop-api`
`X-Request-Id` là sợi chỉ nối log, lỗi và (P08) trace. `httpLogger` được `nestjs-pino` thay ở P01. `ApiKeyGuard` rồi `JwtAuthGuard` toàn cục + `@Public()` ở A02; `RolesGuard` ở A04 dùng `Reflector` đọc metadata của handler (C08 dạy phần metadata).
