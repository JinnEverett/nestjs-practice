import {
  All,
  Body,
  Controller,
  Delete,
  Get,
  GoneException,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Redirect,
  Res,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiExcludeController, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { ApiDeprecated } from '../common/decorators/deprecated.decorator';
import { CacheTtl } from '../common/interceptors/get-cache.interceptor';
import { ApiProblems } from '../common/swagger/api-errors.decorator';
import { ApiPaginatedResponse } from '../common/swagger/api-paginated-response.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { ParseSkuPipe } from '../common/pipes/parse-sku.pipe';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductIncludeQueryDto } from './dto/product-include-query.dto';
import { LowStockQueryDto } from './dto/low-stock-query.dto';
import { ProductsPageV2Dto } from './dto/products-page-v2.dto';
import { Product } from './entities/product.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListQuery, ProductsService, SortField } from './products.service';

@ApiTags('products')
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: 'Tạo sản phẩm' })
  @ApiCreatedResponse({ type: Product, description: 'Tạo thành công; header Location trỏ tới tài nguyên' })
  @ApiProblems(400, 409)
  async create(@Body() dto: CreateProductDto, @Res({ passthrough: true }) res: Response) {
    const created = await this.products.create(dto);
    res.location(`/v1/products/${created.id}`);
    return created;
  }

  @Get()
  @CacheTtl(30)
  @ApiOperation({ summary: 'Danh sách sản phẩm (lọc, sắp xếp, phân trang)' })
  @ApiPaginatedResponse(Product)
  @ApiProblems(400)
  findAll(@Query() query: ListProductsQueryDto) {
    return this.products.findAll(toListQuery(query));
  }

  // Route tĩnh phải đứng TRƯỚC ':id', nếu không "low-stock" bị ParseIdPipe từ chối.
  @Get('low-stock')
  @AdminOnly()
  @ApiOperation({ summary: 'Sản phẩm đang bán sắp hết hàng (tồn kho <= threshold)' })
  @ApiOkResponse({ description: '{ data: Product[], meta: { threshold, total } }' })
  @ApiProblems(400)
  async lowStock(@Query() query: LowStockQueryDto) {
    const data = await this.products.lowStock(query.threshold);
    return { data, meta: { threshold: query.threshold, total: data.length } };
  }

  @Get('count')
  @ApiDeprecated({
    summary: 'Đếm sản phẩm',
    since: new Date('2026-10-01T00:00:00Z'),
    sunset: new Date('2027-04-01T00:00:00Z'),
    successor: '/v1/products?limit=1',
  })
  @ApiOkResponse({ schema: { type: 'object', properties: { count: { type: 'integer' } }, required: ['count'] }, description: 'Dùng meta.total của danh sách thay thế' })
  async count() {
    return { count: await this.products.count() };
  }

  @Get(':id')
  @CacheTtl(30)
  @Header('Cache-Control', 'public, max-age=60')
  @ApiOperation({ summary: 'Chi tiết sản phẩm' })
  @ApiOkResponse({ type: Product })
  @ApiProblems(400, 404)
  findOne(@Param('id', ParseIdPipe) id: number, @Query() query: ProductIncludeQueryDto) {
    return this.products.findOne(id, query.include);
  }

  @Patch(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Cập nhật một phần sản phẩm' })
  @ApiOkResponse({ type: Product })
  @ApiProblems(400, 404, 409)
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa sản phẩm chưa từng được đặt' })
  @ApiNoContentResponse({ description: 'Đã xóa' })
  @ApiProblems(400, 404, 409)
  remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    return this.products.remove(id);
  }
}

@ApiTags('products')
@Controller({ path: 'products', version: '2' })
export class ProductsV2Controller {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @CacheTtl(30)
  @ApiOperation({ summary: 'Danh sách sản phẩm (hình dạng v2: items + pagination)' })
  @ApiOkResponse({ type: ProductsPageV2Dto })
  @ApiProblems(400)
  async findAll(@Query() query: ListProductsQueryDto) {
    const { data, meta } = await this.products.findAll(toListQuery(query));
    return { items: data, pagination: { ...meta, pages: Math.ceil(meta.total / meta.limit) } };
  }
}

@ApiTags('products')
@Controller({ path: 'p', version: '1' })
export class ProductShortLinkController {
  constructor(private readonly products: ProductsService) {}

  @Get(':sku')
  @Redirect()
  @ApiOperation({ summary: 'Link ngắn theo SKU: chuyển hướng 302 tới chi tiết sản phẩm' })
  @ApiParam({ name: 'sku', example: 'AO-THUN-01' })
  @ApiResponse({ status: 302, description: 'Location: /v1/products/{id}' })
  @ApiProblems(400, 404)
  async bySku(@Param('sku', ParseSkuPipe) sku: string) {
    const product = await this.products.findBySku(sku);
    if (!product) throw new NotFoundException(`Không có sản phẩm với SKU ${sku}`);
    return { url: `/v1/products/${product.id}`, statusCode: HttpStatus.FOUND };
  }
}

@ApiExcludeController()
@Controller({ path: 'legacy', version: '1' })
export class LegacyController {
  @All('*splat')
  gone(): never {
    throw new GoneException('API này đã ngừng, dùng /v1/products');
  }
}

function toListQuery(q: ListProductsQueryDto): ListQuery {
  const desc = q.sort.startsWith('-');
  return {
    page: q.page,
    limit: q.limit,
    sort: { field: (desc ? q.sort.slice(1) : q.sort) as SortField, desc },
    brand: q.brand,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    q: q.q,
    isActive: q.isActive,
  };
}
