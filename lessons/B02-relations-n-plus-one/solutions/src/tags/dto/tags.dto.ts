import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, Matches } from 'class-validator';

export const TAG_PATTERN = /^[a-z0-9-]{1,30}$/;

export class SetProductTagsDto {
  @ApiProperty({ type: [String], example: ['sale', 'new'], maxItems: 20, description: 'Tập nhãn MỚI của sản phẩm (thay thế toàn bộ); mảng rỗng = gỡ hết nhãn' })
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @Matches(TAG_PATTERN, { each: true, message: 'mỗi nhãn phải khớp ^[a-z0-9-]{1,30}$' })
  tags!: string[];
}

export class ProductTagsView {
  @ApiProperty() productId!: number;
  @ApiProperty({ type: [String] }) tags!: string[];
}

export class TagCountView {
  @ApiProperty({ example: 'sale' }) name!: string;
  @ApiProperty({ example: 3 }) productCount!: number;
}
