import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn } from 'class-validator';
import { IncludeTransform } from '../../common/dto/include';
import { PRODUCT_INCLUDES, ProductInclude } from '../entities/product.entity';

export class ProductIncludeQueryDto {
  @ApiPropertyOptional({ type: String, example: 'category,tags', description: 'Quan hệ nạp kèm, phân tách bằng dấu phẩy: category, tags' })
  @IncludeTransform()
  @IsArray()
  @IsIn(PRODUCT_INCLUDES, { each: true, message: `include chỉ nhận: ${PRODUCT_INCLUDES.join(', ')}` })
  include: ProductInclude[] = [];
}
