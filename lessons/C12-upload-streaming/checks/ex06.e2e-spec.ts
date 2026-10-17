import { INestApplication } from '@nestjs/common';
import { ClockService } from '../../src/clock/clock.service';
import { ProductsService } from '../../src/products/products.service';
import { createTestApp, http } from './_kit';
import { KEY } from './_fixtures';

const BOM = '﻿';
const getCsv = (app: INestApplication, key: string | null = KEY) => {
  const r = http(app).get('/v1/exports/products.csv');
  if (key !== null) r.set('x-api-key', key);
  return r;
};

describe('C12 ex06 · xuất CSV bằng stream', () => {
  let app: INestApplication;
  const NOW = new Date('2026-10-17T08:00:00.000Z');
  beforeAll(async () => {
    app = await createTestApp({ customize: (b) => b.overrideProvider(ClockService).useValue({ now: () => NOW }) });
    const products = app.get(ProductsService, { strict: false });
    await products.create({ sku: 'CSV-1', name: 'Áo thun', price: 100000, brand: 'Acme', stock: 3 });
    await products.create({ sku: 'CSV-2', name: 'Quần jeans', price: 250000, isActive: false });
  });
  afterAll(async () => {
    await app.close();
  });

  it('cần X-Api-Key (dữ liệu gồm cả hàng ngừng bán)', async () => {
    await getCsv(app, null).expect(401);
    await getCsv(app, 'sai').expect(401);
  });

  it('header HTTP: text/csv UTF-8, tải về với tên theo ngày, chunked (không Content-Length)', async () => {
    const res = await getCsv(app).expect(200);
    expect(res.headers['content-type']).toMatch(/^text\/csv;\s*charset=utf-8/i);
    expect(res.headers['content-disposition']).toBe('attachment; filename="products-20261017.csv"');
    expect(res.headers['transfer-encoding']).toBe('chunked');
    expect(res.headers['content-length']).toBeUndefined();
  });

  it('nội dung: BOM, dòng tiêu đề, CRLF, đúng thứ tự cột và giá trị', async () => {
    const text = (await getCsv(app).expect(200)).text;
    expect(text.startsWith(BOM)).toBe(true);
    const lines = text.slice(1).split('\r\n');
    expect(lines[0]).toBe('id,sku,name,brand,price,stock,isActive,createdAt');
    expect(lines[1]).toMatch(/^\d+,CSV-1,Áo thun,Acme,100000,3,true,\d{4}-\d\d-\d\dT[\d:.]+Z$/);
    expect(lines[2]).toMatch(/^\d+,CSV-2,Quần jeans,,250000,0,false,/);
    expect(lines[3]).toBe(''); // kết thúc bằng CRLF
    expect(lines).toHaveLength(4);
  });

  it('dữ liệu nhiều: 2500 sản phẩm → đủ 2500 dòng, đúng thứ tự id, mỗi dòng đủ cột', async () => {
    const products = app.get(ProductsService, { strict: false });
    for (let i = 0; i < 2500; i++) await products.create({ sku: `BULK-${i}`, name: `Hàng loạt ${i}`, price: i });
    const res = await getCsv(app).expect(200);
    const rows = res.text.slice(1).split('\r\n').filter(Boolean);
    expect(rows).toHaveLength(2 + 2500 + 1); // tiêu đề + 2 sản phẩm đầu + 2500
    const ids = rows.slice(1).map((r) => Number(r.split(',')[0]));
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
    expect(new Set(ids).size).toBe(ids.length);
    expect(rows[rows.length - 1]).toContain('BULK-2499');
  }, 60_000);

  it('rỗng cũng hợp lệ: chỉ có dòng tiêu đề', async () => {
    const empty = await createTestApp();
    try {
      const text = (await getCsv(empty).expect(200)).text;
      expect(text).toBe(BOM + 'id,sku,name,brand,price,stock,isActive,createdAt\r\n');
    } finally {
      await empty.close();
    }
  });
});
