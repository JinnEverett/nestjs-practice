import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../entities/product.entity';

export class PaginationV2Dto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 137 }) total!: number;
  @ApiProperty({ example: 7, description: 'ceil(total / limit)' }) pages!: number;
}

export class ProductsPageV2Dto {
  @ApiProperty({ type: [Product] }) items!: Product[];
  @ApiProperty({ type: PaginationV2Dto }) pagination!: PaginationV2Dto;
}
