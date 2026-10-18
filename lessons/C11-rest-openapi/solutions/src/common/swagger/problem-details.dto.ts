import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FieldErrorDto {
  @ApiProperty({ example: 'items.1.quantity' }) field!: string;
  @ApiProperty({ example: 'quantity must not be less than 1' }) message!: string;
}

/** Hình dạng mọi lỗi của API (RFC 9457, Content-Type application/problem+json). */
export class ProblemDetailsDto {
  @ApiProperty({ example: 'urn:shop:error:out-of-stock', description: 'Định danh ổn định để client rẽ nhánh' })
  type!: string;
  @ApiProperty({ example: 'Conflict' }) title!: string;
  @ApiProperty({ example: 409 }) status!: number;
  @ApiProperty({ example: 'Sản phẩm #7 không đủ tồn kho (cần 5, còn 2)' }) detail!: string;
  @ApiProperty({ example: '/v1/orders' }) instance!: string;
  @ApiPropertyOptional({ type: [FieldErrorDto], description: 'Chỉ có khi type = urn:shop:error:validation' }) errors?: FieldErrorDto[];
}
