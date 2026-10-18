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
import type { Response } from 'express';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { CacheTtl } from '../common/interceptors/get-cache.interceptor';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { ParseSkuPipe } from '../common/pipes/parse-sku.pipe';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListQuery, ProductsService, SortField } from './products.service';

@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @AdminOnly()
  async create(@Body() dto: CreateProductDto, @Res({ passthrough: true }) res: Response) {
    const created = await this.products.create(dto);
    res.location(`/v1/products/${created.id}`);
    return created;
  }

  @Get()
  @CacheTtl(30)
  findAll(@Query() query: ListProductsQueryDto) {
    return this.products.findAll(toListQuery(query));
  }

  @Get('count')
  async count() {
    return { count: await this.products.count() };
  }

  @Get(':id')
  @CacheTtl(30)
  @Header('Cache-Control', 'public, max-age=60')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.products.findOne(id);
  }

  @Patch(':id')
  @AdminOnly()
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIdPipe) id: number): Promise<void> {
    return this.products.remove(id);
  }
}

@Controller({ path: 'products', version: '2' })
export class ProductsV2Controller {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @CacheTtl(30)
  async findAll(@Query() query: ListProductsQueryDto) {
    const { data, meta } = await this.products.findAll(toListQuery(query));
    return { items: data, pagination: { ...meta, pages: Math.ceil(meta.total / meta.limit) } };
  }
}

@Controller({ path: 'p', version: '1' })
export class ProductShortLinkController {
  constructor(private readonly products: ProductsService) {}

  @Get(':sku')
  @Redirect()
  async bySku(@Param('sku', ParseSkuPipe) sku: string) {
    const product = await this.products.findBySku(sku);
    if (!product) throw new NotFoundException(`Không có sản phẩm với SKU ${sku}`);
    return { url: `/v1/products/${product.id}`, statusCode: HttpStatus.FOUND };
  }
}

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
