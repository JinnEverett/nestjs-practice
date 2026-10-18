import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, minimum: 1 }) page!: number;
  @ApiProperty({ example: 20, minimum: 1, maximum: 100 }) limit!: number;
  @ApiProperty({ example: 137, description: 'Tổng số bản ghi sau khi lọc' }) total!: number;
}
