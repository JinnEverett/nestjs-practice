import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { IsNotGreaterThan } from '../../common/validators/is-not-greater-than';

/** 'true'/'false' → boolean. KHÔNG dùng @Type(() => Boolean): Boolean('false') === true. */
const toBool = ({ value }: TransformFnParams): unknown => (value === 'true' ? true : value === 'false' ? false : value);

export class ListProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @Matches(/^-?(id|price|name|createdAt|stock)$/, { message: 'sort phải là id|price|name|createdAt|stock, có thể có tiền tố -' })
  sort: string = 'id';

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsNotGreaterThan('maxPrice')
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isActive?: boolean;
}
