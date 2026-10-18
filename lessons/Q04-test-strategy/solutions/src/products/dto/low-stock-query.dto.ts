import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { LOW_STOCK_DEFAULT, LOW_STOCK_MAX } from '../low-stock';

export class LowStockQueryDto {
  @ApiPropertyOptional({ minimum: 0, maximum: LOW_STOCK_MAX, default: LOW_STOCK_DEFAULT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(LOW_STOCK_MAX)
  threshold: number = LOW_STOCK_DEFAULT;
}
