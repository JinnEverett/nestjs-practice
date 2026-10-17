import { PartialType } from '@nestjs/swagger'; // KHÔNG dùng @nestjs/mapped-types: bản này mới kế thừa cả metadata OpenAPI
import { CreateProductDto } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
