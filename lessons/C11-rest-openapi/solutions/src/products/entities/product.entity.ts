import { ApiProperty } from '@nestjs/swagger';

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
}
