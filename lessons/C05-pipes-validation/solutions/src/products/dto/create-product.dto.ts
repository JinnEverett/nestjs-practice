import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, Length, Matches, MaxLength, Min, ValidateIf } from 'class-validator';

const trim = ({ value }: TransformFnParams): unknown => (typeof value === 'string' ? value.trim() : value);
const trimUpper = ({ value }: TransformFnParams): unknown => (typeof value === 'string' ? value.trim().toUpperCase() : value);
/** Bỏ qua kiểm khi field vắng mặt (undefined) nhưng KHÔNG bỏ qua null như @IsOptional(). */
const IfPresent = () => ValidateIf((_obj, value) => value !== undefined);

export class CreateProductDto {
  @Transform(trimUpper)
  @Matches(/^[A-Z0-9-]{3,20}$/, { message: 'sku phải khớp ^[A-Z0-9-]{3,20}$' })
  sku!: string;

  @Transform(trim)
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsInt()
  @Min(0)
  price!: number;

  @IfPresent()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional() // brand cho phép null
  @IsString()
  @MaxLength(80)
  brand?: string | null;

  @IfPresent()
  @IsInt()
  @Min(0)
  stock?: number;

  @IfPresent()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IfPresent()
  @IsBoolean()
  isActive?: boolean;
}
