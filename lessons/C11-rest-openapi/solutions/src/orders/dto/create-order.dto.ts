import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ example: 42, minimum: 1 })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 100 })
  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [CreateOrderItemDto], minItems: 1, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({ type: String, nullable: true, example: 'WELCOME10', pattern: '^[A-Za-z0-9-]{1,20}$' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{1,20}$/, { message: 'discountCode chỉ gồm chữ, số, dấu gạch ngang (1..20 ký tự)' })
  discountCode?: string | null;
}
