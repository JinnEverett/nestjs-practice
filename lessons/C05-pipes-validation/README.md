# C05 · Pipes và validation

Đọc khoảng 12 phút. Đến giờ controller tin mọi thứ client gửi, còn service tự kiểm tay. Module này đưa việc **kiểm tra và chuyển kiểu đầu vào** về một chỗ: pipe + DTO. Cần cài `class-validator` và `class-transformer` (lệnh: `npm i class-validator class-transformer`).

## Mục tiêu
- Phân biệt hai việc của pipe: **transform** (đổi kiểu) và **validate** (từ chối).
- Cấu hình `ValidationPipe` toàn cục đúng (`whitelist`, `forbidNonWhitelisted`, `transform`).
- Viết DTO cho body, query, DTO lồng nhau; dùng `PartialType` cho PATCH.
- Viết pipe và validator tùy biến.
- Tránh các bẫy kinh điển: `Boolean('false')`, `null` lọt qua `@IsOptional`, mass assignment.

## 1. Pipe là gì và chạy khi nào
Pipe chạy **ngay trước handler**, nhận từng tham số (`@Body`, `@Query`, `@Param`), trả giá trị mới hoặc ném exception (→ 400).
```ts
@Param('id', ParseIntPipe) id: number              // pipe của một tham số
@UsePipes(new ValidationPipe())                     // của controller/route
app.useGlobalPipes(new ValidationPipe({ ... }))    // toàn cục (trong configureApp)
```
Thứ tự: global → controller → route → param. Pipe có sẵn: `ParseIntPipe`, `ParseBoolPipe`, `ParseUUIDPipe`, `ParseEnumPipe`, `ParseArrayPipe`, `DefaultValuePipe`, `ParseFilePipe` (C12). `ParseIntPipe` chấp nhận **cả `0`, `-5`**; với id thì thường không phải thứ bạn muốn.

## 2. DTO + `ValidationPipe`
```ts
export class CreateProductDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @Matches(/^[A-Z0-9-]{3,20}$/) sku!: string;
  @IsInt() @Min(0) price!: number;
  @IsOptional() @IsString() brand?: string | null;
}

new ValidationPipe({
  whitelist: true,              // field không có decorator bị bỏ
  forbidNonWhitelisted: true,   // ...và báo 400 (không lặng lẽ nuốt)
  transform: true,              // trả về instance DTO, query/param đổi theo kiểu khai báo
})
```
- DTO phải là **class** (interface mất khi compile nên pipe không biết kiểm gì).
- Lỗi trả về `{ statusCode: 400, error: 'Bad Request', message: string[] }`. C06 sẽ chuẩn hóa thành problem+json.
- `transform: true` còn đổi cả `@Param('id') id: number` từ `'12'` sang `12` **trước** khi pipe của param chạy; pipe tự viết phải chịu được cả string lẫn number.
- Service vẫn giữ các bất biến quan trọng (giá >= 0...). DTO là hàng rào ở biên, không thay thế kiểm tra nghiệp vụ.

## 3. Query và chuyển kiểu
Query luôn là chuỗi. Dùng `@Type(() => Number)` cho số, **không** dùng cho boolean:
```ts
@Type(() => Boolean) isActive   // ❌ Boolean('false') === true
@Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value) @IsBoolean() isActive   // ✅
```
Giá trị mặc định đặt bằng khởi tạo property (`page: number = 1`). `enableImplicitConversion` tiện nhưng che giấu bẫy trên; khóa học dùng chuyển kiểu tường minh.

## 4. DTO lồng, mảng, và `PartialType`
```ts
class CreateOrderDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];     // thiếu @Type thì phần tử không được kiểm, không có whitelist
}
class UpdateProductDto extends PartialType(CreateProductDto) {}   // từ '@nestjs/mapped-types' (C11 đổi sang '@nestjs/swagger')
```
Lỗi lồng có đường dẫn: `items.1.quantity must not be less than 1`.
`PartialType` gắn `@IsOptional()` cho mọi field; `@IsOptional()` bỏ qua cả `undefined` **và `null`**: `{"stock": null}` lọt qua validation. Chặn tiếp ở service, hoặc dùng `@ValidateIf((_, v) => v !== undefined)` cho field không cho phép null.

## 5. Pipe và validator tùy biến
```ts
@Injectable()
export class ParseIdPipe implements PipeTransform<string | number, number> {
  transform(value: string | number, meta: ArgumentMetadata): number {
    const n = typeof value === 'number' ? value : /^[1-9]\d*$/.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(n) || n < 1) throw new BadRequestException(`${meta.data} phải là số nguyên dương`);
    return n;
  }
}
```
Validator tùy biến (`registerDecorator`) dùng khi luật liên quan nhiều field (`minPrice <= maxPrice`) hoặc dùng lại nhiều nơi. Luật cần DB (email đã tồn tại) thường để ở service, không phải ở validator.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Không bật `whitelist`/`forbidNonWhitelisted` | mass assignment: client set `role`, `userId`... | bật cả hai |
| `@Type(() => Boolean)` | `isActive=false` thành `true` | `@Transform` so sánh chuỗi |
| `@IsOptional()` với field không cho null | `null` lọt vào dữ liệu | `@ValidateIf(v !== undefined)` hoặc chặn ở service |
| Quên `@Type` ở DTO lồng | phần tử không được kiểm | `@ValidateNested` + `@Type` |
| `ParseIntPipe` cho id | `0`, `-1`, số vượt 2^53 lọt qua | pipe tự viết |
| Pipe tự viết giả định string | vỡ khi `transform: true` đã đổi sang number | nhận `string \| number` |
| Tin DTO là đủ | service bị gọi từ chỗ khác (queue, job) không qua pipe | giữ bất biến trong service |

## Dùng ở đâu trong `shop-api`
Cùng một `ValidationPipe` sẽ kiểm body của `auth/register` (A01), `refresh` (A02) và mọi endpoint về sau. `ParseIdPipe` dùng cho mọi `:id`. `ListProductsQueryDto` là mầm của DTO phân trang chung (C11) và bộ lọc an toàn có whitelist (R01).
