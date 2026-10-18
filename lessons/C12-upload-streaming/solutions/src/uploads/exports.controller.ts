import { Controller, Get, Header, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Readable } from 'node:stream';
import { ClockService } from '../clock/clock.service';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { Timeout } from '../common/interceptors/timeout.interceptor';
import { ProductsService } from '../products/products.service';
import { ApiProblems } from '../common/swagger/api-errors.decorator';
import { csvLine } from './csv';

const COLUMNS = ['id', 'sku', 'name', 'brand', 'price', 'stock', 'isActive', 'createdAt'] as const;
const PAGE = 100;

@ApiTags('products')
@Controller({ path: 'exports', version: '1' })
export class ExportsController {
  constructor(
    private readonly products: ProductsService,
    private readonly clock: ClockService,
  ) {}

  @Get('products.csv')
  @AdminOnly()
  @ApiOperation({ summary: 'Xuất toàn bộ sản phẩm ra CSV (stream)' })
  @ApiOkResponse({ description: 'CSV UTF-8 có BOM', content: { 'text/csv': { schema: { type: 'string' } } } })
  @ApiProblems(401)
  @Timeout(10 * 60_000) // xuất dữ liệu lớn có thể lâu hơn mặc định 5 giây
  @Header('Content-Type', 'text/csv; charset=utf-8')
  export(): StreamableFile {
    const day = this.clock.now().toISOString().slice(0, 10).replace(/-/g, '');
    const products = this.products;
    // Generator + Readable.from: sinh từng trang, tôn trọng backpressure; không dựng cả file trong RAM.
    async function* rows(): AsyncGenerator<string> {
      yield '﻿' + csvLine(COLUMNS); // BOM để Excel nhận UTF-8 (tiếng Việt có dấu)
      for (let page = 1; ; page++) {
        const { data, meta } = await products.findAll({ page, limit: PAGE, sort: { field: 'id', desc: false } });
        for (const p of data) yield csvLine(COLUMNS.map((c) => p[c]));
        if (page * PAGE >= meta.total) break;
      }
    }
    return new StreamableFile(Readable.from(rows()), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="products-${day}.csv"`,
    });
  }
}
