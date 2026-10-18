import { BadRequestException, Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { ApiProblems } from '../common/swagger/api-errors.decorator';
import { ProductTagsView, SetProductTagsDto, TagCountView, TAG_PATTERN } from './dto/tags.dto';
import { TagsService } from './tags.service';

@ApiTags('tags')
@Controller({ version: '1' })
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Put('products/:id/tags')
  @AdminOnly()
  @ApiOperation({ summary: 'Đặt tập nhãn của sản phẩm (thay thế toàn bộ)' })
  @ApiOkResponse({ type: ProductTagsView })
  @ApiProblems(400, 404)
  setProductTags(@Param('id', ParseIdPipe) id: number, @Body() dto: SetProductTagsDto) {
    return this.tags.setProductTags(id, dto.tags);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Danh sách nhãn kèm số sản phẩm' })
  @ApiOkResponse({ type: [TagCountView] })
  async list() {
    return { data: await this.tags.list() };
  }

  @Get('tags/:name/products')
  @ApiOperation({ summary: 'Sản phẩm mang một nhãn' })
  @ApiProblems(400, 404)
  async productsOf(@Param('name') name: string) {
    if (!TAG_PATTERN.test(name)) throw new BadRequestException('tên nhãn phải khớp ^[a-z0-9-]{1,30}$');
    const data = await this.tags.productsOf(name);
    return { data, meta: { total: data.length } };
  }
}
