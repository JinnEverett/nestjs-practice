# C11 · REST design và OpenAPI

Đọc khoảng 12 phút. Bạn đã có API chạy đúng; module này làm cho nó **dùng được và khó hiểu sai** bởi người khác: hợp đồng (contract) rõ ràng, tự mô tả bằng OpenAPI, phân trang chuẩn, và cách khai tử route cũ. Cài: `npm i @nestjs/swagger`.

## Mục tiêu
- Đánh giá API theo checklist REST: tên tài nguyên, method, status code, lỗi, phân trang, phiên bản.
- Sinh OpenAPI từ code bằng `@nestjs/swagger`: DTO, tham số, response, lỗi problem+json, bảo mật.
- Dựng envelope phân trang chuẩn và header `Link`; hiểu ETag/`304`.
- Khai tử route theo chuẩn (`Deprecation`, `Sunset`) và giữ contract không "trôi" (file `openapi.json` được commit).

## 1. Checklist thiết kế REST
| Chủ đề | Quy tắc áp dụng trong `shop-api` |
|---|---|
| Tên | danh từ số nhiều, chữ thường: `/v1/products`, `/v1/orders/{id}`. Hành động không phải động từ trong URL (trừ ngoại lệ như `/v1/orders/{id}/payments` ở R02) |
| Method | `GET` an toàn + idempotent, `PUT/DELETE` idempotent, `POST` tạo, `PATCH` sửa một phần |
| Status | `201 + Location` khi tạo, `204` khi xóa, `400` sai định dạng, `404`, `409` xung đột trạng thái, `422` vi phạm nghiệp vụ, `401` chưa xác thực, `403` không đủ quyền |
| Lỗi | một hình dạng duy nhất `application/problem+json`, `type` ổn định (C06) |
| Danh sách | `page`, `limit` (tối đa 100), `sort`, bộ lọc; trả `{ data, meta }` |
| Phiên bản | `/v1`, `/v2` trên URI; chỉ tăng khi **phá** hợp đồng (đổi tên/bỏ field, đổi kiểu) |
| Thêm field vào response | không phá vỡ (client tốt phải bỏ qua field lạ) |
| Tiền, thời gian | số nguyên VND, ISO 8601 UTC |

Phá vỡ hợp đồng gồm: bỏ/đổi tên/đổi kiểu field, siết validation (từ chối thứ trước đó chấp nhận), đổi ý nghĩa status code. Thêm field tùy chọn, thêm endpoint thì không.

## 2. `@nestjs/swagger`
```ts
const config = new DocumentBuilder().setTitle('Shop API').setVersion('1.0.0')
  .addApiKey({ type: 'apiKey', name: 'X-Api-Key', in: 'header' }, 'ApiKey').build();
const document = SwaggerModule.createDocument(app, config, { extraModels: [ProblemDetailsDto] });
SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs-json' });   // /docs (UI) + /docs-json
```
Đặt trong `configureApp` để cả `main.ts` và e2e dùng chung. Các đường dẫn này **không** có tiền tố `/v1`, và vì Swagger gắn route thẳng vào HTTP adapter nên middleware của Nest (request id...) không chạm tới.

Mô tả từng thao tác bằng decorator:
```ts
@ApiTags('products')                                        // nhóm
@ApiOperation({ summary: '...' })
@ApiCreatedResponse({ type: Product })                      // 2xx kèm schema
@ApiProblems(400, 409)                                      // decorator tự viết: lỗi problem+json
@AdminOnly()                                                // đã gồm ApiSecurity('ApiKey') + response 401
```
`ApiProperty()` trên DTO/entity khai báo kiểu, ràng buộc (`minimum`, `pattern`...), `example`, `nullable`. **`PartialType` phải import từ `@nestjs/swagger`**, không phải `@nestjs/mapped-types`, để Update DTO kế thừa cả metadata OpenAPI (và vẫn kế thừa validator).

**CLI plugin:** thêm `{"name":"@nestjs/swagger"}` vào `nest-cli.json > compilerOptions.plugins`; khi `nest build`/`nest start` plugin tự suy ra `@ApiProperty` từ kiểu TypeScript và comment JSDoc nên bạn bớt viết decorator. Nó **không chạy** dưới `ts-jest` (e2e của khóa học), vì vậy bài này khai báo tường minh những gì cần kiểm.

## 3. Envelope phân trang và `Link`
```ts
export const ApiPaginatedResponse = <T extends Type<unknown>>(model: T) =>
  applyDecorators(ApiExtraModels(PaginationMetaDto, model), ApiOkResponse({ schema: { /* data: model[], meta: $ref */ } }));
```
Header `Link: </v1/products?page=3&limit=20>; rel="next", ...` (RFC 8288) cho máy đọc điều hướng mà không phải tự ghép URL. Header **suy ra từ body** phải được tạo ở interceptor đứng **ngoài** cache, nếu không phản hồi lấy từ cache (handler bị bỏ qua) sẽ thiếu header. Header tĩnh khai báo bằng `@Header()` thì vẫn có.

## 4. Khai tử có trật tự
```
Deprecation: @1790812800                 // RFC 9745: đã ngừng từ lúc này (giây Unix)
Sunset: Thu, 01 Apr 2027 00:00:00 GMT    // RFC 8594: sẽ gỡ vào ngày này
Link: </v1/products?limit=1>; rel="successor-version"
```
+ `deprecated: true` trong OpenAPI. Client tự động hóa dò được trước khi route biến mất. Nguyên tắc: thông báo → giai đoạn song song → đo traffic còn lại → gỡ.

## 5. Contract không trôi
Commit `openapi.json` sinh từ code. PR đổi API mà quên xuất lại thì CI đỏ (test so `openapi.json` với `/docs-json`); PR nào đổi contract thì diff của file này hiện ra ngay trong review, kể cả thay đổi vô tình (đổi tên field, bỏ `required`). Đây là phiên bản rẻ nhất của contract testing.

## 6. HTTP có sẵn: ETag và `304`
Express tự tính `ETag` yếu cho phản hồi JSON và trả `304 Not Modified` khi `If-None-Match` khớp: client giữ bản cũ, tiết kiệm băng thông (không tiết kiệm CPU của handler). P04 bàn kỹ cache HTTP.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| `PartialType` từ `@nestjs/mapped-types` | Update DTO không có thuộc tính trong OpenAPI | import từ `@nestjs/swagger` |
| Không khai báo response lỗi | client không biết lỗi trông thế nào | `ApiProblems(...)` dùng `ProblemDetailsDto` |
| Chỉ dựa vào CLI plugin | e2e/ts-jest không có metadata | khai báo tường minh phần cần kiểm |
| Route nội bộ (`_trace`, `legacy`) lộ trong tài liệu | khách tích hợp phụ thuộc vào thứ sẽ biến mất | `@ApiExcludeController()` |
| `Link` tạo trong handler | cache HIT mất header | interceptor ngoài cache |
| Xóa route không báo | đối tác gãy bất ngờ | `Deprecation` + `Sunset` + successor |
| Không commit contract | đổi tên field không ai biết | `openapi.json` + test so sánh |
| Đổi `operationId` | SDK sinh tự động đổi tên hàm | factory ổn định, test độc nhất |

## Dùng ở đâu trong `shop-api`
Từ A01, mỗi route mới phải có `@ApiOperation`, response và lỗi trong cùng PR; `@Public()` (A02) và `@Roles()` (A04) bổ sung `ApiBearerAuth`. R01 tái dùng `ApiPaginatedResponse` và `Link` cho cursor. P04 đo tác dụng của `ETag/304`. CAP sinh SDK client từ `openapi.json`.
