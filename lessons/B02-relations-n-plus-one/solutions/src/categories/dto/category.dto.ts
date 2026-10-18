import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';
import { IncludeTransform } from '../../common/dto/include';
import { INT4_MAX } from '../../database/transformers';

export const CATEGORY_INCLUDES = ['children', 'products'] as const;
export type CategoryInclude = (typeof CATEGORY_INCLUDES)[number];

const trim = ({ value }: TransformFnParams): unknown => (typeof value === 'string' ? value.trim() : value);

export class CreateCategoryDto {
  @ApiProperty({ example: 'Áo thun', minLength: 1, maxLength: 100 })
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiProperty({ example: 'ao-thun', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', maxLength: 100 })
  @Transform(trim)
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, { message: 'slug chỉ gồm chữ thường, số và dấu gạch ngang giữa các từ' })
  @Length(1, 100)
  slug!: string;

  @ApiPropertyOptional({ type: Number, nullable: true, example: 1, description: 'Danh mục cha; bỏ trống hoặc null cho danh mục gốc' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(INT4_MAX)
  parentId?: number | null;
}

export class CategoryIncludeQueryDto {
  @ApiPropertyOptional({ type: String, example: 'children,products', description: 'Quan hệ nạp kèm, phân tách bằng dấu phẩy: children, products' })
  @IncludeTransform()
  @IsArray()
  @IsIn(CATEGORY_INCLUDES, { each: true, message: `include chỉ nhận: ${CATEGORY_INCLUDES.join(', ')}` })
  include: CategoryInclude[] = [];
}

export class CategoryProductSummary {
  @ApiProperty() id!: number;
  @ApiProperty() sku!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ description: 'VND, số nguyên' }) price!: number;
}

export class CategoryView {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ type: Number, nullable: true, example: null }) parentId!: number | null;
  @ApiProperty({ example: 'Áo thun' }) name!: string;
  @ApiProperty({ example: 'ao-thun' }) slug!: string;
  @ApiPropertyOptional({ type: () => [CategoryView], description: 'Chỉ có khi ?include=children; sắp theo id' }) children?: CategoryView[];
  @ApiPropertyOptional({ type: [CategoryProductSummary], description: 'Chỉ có khi ?include=products; sắp theo id' }) products?: CategoryProductSummary[];
}
