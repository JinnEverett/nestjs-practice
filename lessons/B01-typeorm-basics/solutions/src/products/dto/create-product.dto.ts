import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Length, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { INT4_MAX, MONEY_MAX } from '../../database/transformers';

const trim = ({ value }: TransformFnParams): unknown => (typeof value === 'string' ? value.trim() : value);
const trimUpper = ({ value }: TransformFnParams): unknown => (typeof value === 'string' ? value.trim().toUpperCase() : value);
const IfPresent = () => ValidateIf((_obj, value) => value !== undefined);

export class CreateProductDto {
  @ApiProperty({ example: 'AO-THUN-01', pattern: '^[A-Z0-9-]{3,20}$', description: 'Được trim và đổi sang chữ hoa' })
  @Transform(trimUpper)
  @Matches(/^[A-Z0-9-]{3,20}$/, { message: 'sku phải khớp ^[A-Z0-9-]{3,20}$' })
  sku!: string;

  @ApiProperty({ example: 'Áo thun cotton', minLength: 1, maxLength: 120 })
  @Transform(trim)
  @IsString()
  @Length(1, 120)
  name!: string;

  @ApiProperty({ example: 199000, minimum: 0, maximum: MONEY_MAX, description: 'VND, số nguyên (tối đa 12 chữ số: numeric(12,0))' })
  @IsInt()
  @Min(0)
  @Max(MONEY_MAX)
  price!: number;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: INT4_MAX, default: 1 })
  @IfPresent()
  @IsInt()
  @Min(1)
  @Max(INT4_MAX)
  categoryId?: number;

  @ApiPropertyOptional({ type: String, nullable: true, maxLength: 80, example: 'Acme' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  brand?: string | null;

  @ApiPropertyOptional({ example: 25, minimum: 0, maximum: INT4_MAX, default: 0 })
  @IfPresent()
  @IsInt()
  @Min(0)
  @Max(INT4_MAX)
  stock?: number;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true, example: { color: 'black' } })
  @IfPresent()
  @IsObject()
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({ default: true })
  @IfPresent()
  @IsBoolean()
  isActive?: boolean;
}
