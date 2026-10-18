import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCategorySummary {
  @ApiProperty({ example: 1 }) id!: number;
  @ApiProperty({ example: 'Thời trang' }) name!: string;
  @ApiProperty({ example: 'thoi-trang' }) slug!: string;
}

export const PRODUCT_INCLUDES = ['category', 'tags'] as const;
export type ProductInclude = (typeof PRODUCT_INCLUDES)[number];

export class Product {
  @ApiProperty({ example: 42 }) id!: number;
  @ApiProperty({ example: 1 }) categoryId!: number;
  @ApiProperty({ example: 'AO-THUN-01', pattern: '^[A-Z0-9-]{3,20}$' }) sku!: string;
  @ApiProperty({ example: 'Áo thun cotton', minLength: 1, maxLength: 120 }) name!: string;
  @ApiProperty({ type: String, nullable: true, example: 'Acme' }) brand!: string | null;
  @ApiProperty({ example: 199000, minimum: 0, description: 'VND, số nguyên' }) price!: number;
  @ApiProperty({ example: 25, minimum: 0 }) stock!: number;
  @ApiProperty({ type: 'object', additionalProperties: true, example: { color: 'black' } }) attributes!: Record<string, unknown>;
  @ApiProperty({ example: true }) isActive!: boolean;
  @ApiProperty({ example: '2026-10-17T08:00:00.000Z', format: 'date-time' }) createdAt!: string;
  @ApiPropertyOptional({ type: ProductCategorySummary, description: 'Chỉ có khi ?include=category' }) category?: ProductCategorySummary;
  @ApiPropertyOptional({ type: [String], example: ['sale', 'new'], description: 'Chỉ có khi ?include=tags; sắp theo tên' }) tags?: string[];
}
