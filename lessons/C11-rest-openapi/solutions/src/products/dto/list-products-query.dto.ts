import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';
import { IsNotGreaterThan } from '../../common/validators/is-not-greater-than';

const toBool = ({ value }: TransformFnParams): unknown => (value === 'true' ? true : value === 'false' ? false : value);

export class ListProductsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ default: 'id', example: '-price', pattern: '^-?(id|price|name|createdAt|stock)$', description: 'Tiền tố - để giảm dần. Hòa thì xếp theo id tăng.' })
  @IsOptional()
  @Matches(/^-?(id|price|name|createdAt|stock)$/, { message: 'sort phải là id|price|name|createdAt|stock, có thể có tiền tố -' })
  sort: string = 'id';

  @ApiPropertyOptional({ description: 'Khớp đầy đủ, không phân biệt hoa thường' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Bao gồm biên; không được lớn hơn maxPrice' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsNotGreaterThan('maxPrice')
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Tìm trong tên, không phân biệt hoa thường' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  isActive?: boolean;
}
