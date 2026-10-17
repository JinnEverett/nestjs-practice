import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// PartialType kế thừa decorator của class-validator/class-transformer và gắn thêm @IsOptional() cho mọi field.
// @IsOptional() bỏ qua cả undefined LẪN null, nên `{ "stock": null }` lọt qua validation: ProductsService.update chặn lại.
export class UpdateProductDto extends PartialType(CreateProductDto) {}
