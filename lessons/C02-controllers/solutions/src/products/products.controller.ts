import {
  All,
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Redirect,
  Res,
  Version,
  GoneException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ListQuery, ProductsService, SORT_FIELDS, SortField } from './products.service';

@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto, @Res({ passthrough: true }) res: Response) {
    const created = this.products.create(dto);
    res.location(`/v1/products/${created.id}`); // @HttpCode mặc định của POST đã là 201
    return created;
  }

  @Get()
  findAll(@Query() raw: Record<string, string | undefined>) {
    return this.products.findAll(parseListQuery(raw));
  }

  // Route tĩnh phải khai báo TRƯỚC ':id', nếu không "count" bị hiểu là id.
  @Get('count')
  count() {
    return { count: this.products.count() };
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=60')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.products.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): void {
    this.products.remove(id);
  }
}

/** v2 chỉ đổi hình dạng phản hồi danh sách. */
@Controller({ path: 'products', version: '2' })
export class ProductsV2Controller {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(@Query() raw: Record<string, string | undefined>) {
    const { data, meta } = this.products.findAll(parseListQuery(raw));
    return { items: data, pagination: { ...meta, pages: Math.ceil(meta.total / meta.limit) } };
  }
}

@Controller({ path: 'p', version: '1' })
export class ProductShortLinkController {
  constructor(private readonly products: ProductsService) {}

  @Get(':sku')
  @Redirect()
  bySku(@Param('sku') sku: string) {
    const product = this.products.findBySku(sku);
    if (!product) throw new NotFoundException(`Không có sản phẩm với SKU ${sku}`);
    return { url: `/v1/products/${product.id}`, statusCode: HttpStatus.FOUND };
  }
}

@Controller({ path: 'legacy', version: '1' })
export class LegacyController {
  @All('*splat') // Express 5 / path-to-regexp v8: wildcard phải có tên
  gone(): never {
    throw new GoneException('API này đã ngừng, dùng /v1/products');
  }
}

function toInt(name: string, value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!/^-?\d+$/.test(value)) throw new BadRequestException(`${name} phải là số nguyên`);
  return Number(value);
}

function parseListQuery(raw: Record<string, string | undefined>): ListQuery {
  const page = toInt('page', raw.page) ?? 1;
  const limit = toInt('limit', raw.limit) ?? 20;
  if (page < 1) throw new BadRequestException('page phải >= 1');
  if (limit < 1 || limit > 100) throw new BadRequestException('limit phải trong khoảng 1..100');
  const sortRaw = raw.sort ?? 'id';
  const desc = sortRaw.startsWith('-');
  const field = (desc ? sortRaw.slice(1) : sortRaw) as SortField;
  if (!SORT_FIELDS.includes(field)) throw new BadRequestException(`sort không hợp lệ: ${sortRaw}`);
  const minPrice = toInt('minPrice', raw.minPrice);
  const maxPrice = toInt('maxPrice', raw.maxPrice);
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new BadRequestException('minPrice không được lớn hơn maxPrice');
  }
  return { page, limit, sort: { field, desc }, brand: raw.brand, minPrice, maxPrice, q: raw.q };
}
