# C02 · Controllers và routing

Đọc khoảng 10 phút. Controller là lớp **biên HTTP** của `shop-api`: đọc request, gọi service, trả kết quả. Module này dựng CRUD `products` **trong bộ nhớ** (chưa DB, chưa validation chặt) để tập trung vào routing và HTTP đúng chuẩn.

## Mục tiêu
- Dùng đúng `@Get/@Post/@Patch/@Delete`, `@Param/@Query/@Body/@Headers`, `@HttpCode`, `@Header`, `@Redirect`.
- Hiểu **thứ tự khai báo route** (static trước dynamic) và route wildcard của Nest 12.
- Bật **URI versioning** và chạy hai phiên bản của cùng một tài nguyên.
- Trả status code đúng: `201 + Location`, `204`, `404`, `409`, `400`.

## 1. Route và decorator tham số
```ts
@Controller({ path: 'products', version: '1' })   // → /v1/products
export class ProductsController {
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { /* ... */ }

  @Get()
  list(@Query() q: Record<string, string | undefined>) { /* ... */ }

  @Post()
  create(@Body() body: CreateProductDto, @Headers('x-request-id') rid?: string) { /* ... */ }
}
```
- `@Query()` luôn cho **chuỗi** (hoặc mảng chuỗi): `?limit=10` → `'10'`. `'10' + 1 === '101'`. Phải đổi kiểu và kiểm tra (C05 sẽ giao việc này cho pipe).
- `@Param('id')` cũng là chuỗi. `ParseIntPipe` (xem trước, học kỹ ở C05) đổi sang số và trả `400` nếu không phải số.
- `@Body()` ở module này chưa được kiểm tra: tin dữ liệu thì sai. Tạm thời validate tay những trường quan trọng.

## 2. Status code và header
| Việc | Cách |
|---|---|
| POST tạo mới → `201` | mặc định của `@Post()` |
| Xóa → `204` không body | `@HttpCode(HttpStatus.NO_CONTENT)` |
| Header cố định | `@Header('Cache-Control', 'public, max-age=60')` |
| Header động (`Location`) | `@Res({ passthrough: true }) res` rồi `res.location(...)`, **giữ passthrough** để Nest vẫn serialize body |
| Chuyển hướng | `@Redirect()` + trả `{ url, statusCode }` |
| Lỗi | ném `NotFoundException`, `BadRequestException`, `ConflictException`... |

```ts
@Get(':sku')
@Redirect()
bySku(@Param('sku') sku: string) {
  const p = this.service.findBySku(sku);
  if (!p) throw new NotFoundException();           // ném lỗi vẫn hoạt động với @Redirect
  return { url: `/v1/products/${p.id}`, statusCode: 302 };
}
```
> Bẫy: `@Res()` không có `passthrough: true` khiến Nest **ngừng** tự gửi response; handler treo nếu bạn quên `res.json()`.

## 3. Thứ tự route
Nest đăng ký route theo **thứ tự khai báo** trong controller. `@Get(':id')` khai báo trước `@Get('count')` sẽ nuốt `/products/count` (với `ParseIntPipe` ra `400`, không phải `404`).
```ts
@Get('count') count() {}     // tĩnh: trước
@Get(':id')   one() {}       // động: sau
```
Wildcard Nest 12 (Express 5, `path-to-regexp` v8) phải **đặt tên**: `'legacy/*splat'`, không còn `'legacy/*'`.

## 4. Versioning
```ts
// app.setup.ts
app.enableVersioning({ type: VersioningType.URI });          // /v1/..., /v2/...
// controller
@Controller({ path: 'products', version: '1' })
@Version('2')            // hoặc đặt ở từng method
```
- Không đặt `defaultVersion` thì controller không khai báo `version` vẫn ở gốc (`/ping`). Có `defaultVersion: '1'` thì `/ping` thành `/v1/ping` (dùng `VERSION_NEUTRAL` để thoát).
- Hai phiên bản có thể dùng **chung một service**; chỉ lớp controller đổi hình dạng response. Đây là lý do logic không nên nằm trong controller.

## 5. Sắp xếp và phân trang: hai bẫy
```ts
const sorted = items.sort((a, b) => a.price - b.price);   // ❌ sort TẠI CHỖ, đổi luôn mảng gốc
const sorted = [...items].sort(/* ... */);                 // ✅ copy trước
```
Khi nhiều dòng có cùng giá trị sắp xếp, thứ tự giữa chúng phụ thuộc cài đặt. Phân trang trên thứ tự không xác định thì trang sau có thể lặp hoặc sót dòng của trang trước. Luôn thêm **khóa phá hòa** (`id`) vào comparator.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| `if (query.minPrice)` | `minPrice=0` bị bỏ qua | so sánh với `undefined` |
| `new RegExp(q)` cho tìm kiếm | `q=(` làm sập handler; `q=.*` khớp tất cả | `includes()` hoặc escape |
| `:id` khai báo trước route tĩnh | route tĩnh không bao giờ chạy | tĩnh trước, động sau |
| Dùng `@Res()` quên passthrough | request treo | `passthrough: true` |
| SKU phân biệt hoa thường | hai sản phẩm "cùng" SKU | chuẩn hóa lúc nhận vào |

## Dùng ở đâu trong `shop-api`
Từ đây `/v1/products` là bề mặt của sản phẩm cho đến hết khóa. C03 tách lưu trữ ra repository, C05 thay validate tay bằng DTO, C06 đổi định dạng lỗi, C11 chuẩn hóa envelope phân trang cho mọi list.
