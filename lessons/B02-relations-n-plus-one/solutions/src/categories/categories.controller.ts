import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { ApiProblems } from '../common/swagger/api-errors.decorator';
import { CategoriesService } from './categories.service';
import { CategoryIncludeQueryDto, CategoryView, CreateCategoryDto } from './dto/category.dto';

@ApiTags('categories')
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Tạo danh mục' })
  @ApiCreatedResponse({ type: CategoryView })
  @ApiProblems(400, 409, 422)
  async create(@Body() dto: CreateCategoryDto, @Res({ passthrough: true }) res: Response) {
    const created = await this.categories.create(dto);
    res.location(`/v1/categories/${created.id}`);
    return created;
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách danh mục (phẳng); ?include=children,products nạp kèm quan hệ' })
  @ApiOkResponse({ type: [CategoryView] })
  @ApiProblems(400)
  async findAll(@Query() query: CategoryIncludeQueryDto) {
    return { data: await this.categories.findAll(query.include) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết danh mục' })
  @ApiOkResponse({ type: CategoryView })
  @ApiProblems(400, 422)
  findOne(@Param('id', ParseIdPipe) id: number, @Query() query: CategoryIncludeQueryDto) {
    return this.categories.findOne(id, query.include);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa danh mục không còn sản phẩm hay danh mục con' })
  @ApiNoContentResponse({ description: 'Đã xóa' })
  @ApiProblems(400, 409, 422)
  remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    return this.categories.remove(id);
  }
}
