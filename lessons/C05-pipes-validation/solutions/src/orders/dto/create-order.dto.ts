import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

export class CreateOrderItemDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{1,20}$/, { message: 'discountCode chỉ gồm chữ, số, dấu gạch ngang (1..20 ký tự)' })
  discountCode?: string | null;
}
