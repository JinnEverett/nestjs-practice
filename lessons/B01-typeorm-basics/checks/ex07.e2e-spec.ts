import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { dataSourceOf, resetDatabase } from './_db';

const admin = { 'X-Api-Key': process.env.ADMIN_API_KEY ?? 'dev-admin-key' };

describe('B01 ex07 · 🔴 "Hai khách cùng đăng một SKU" (race condition)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  beforeEach(async () => {
    await resetDatabase(app);
  });
  afterAll(async () => {
    await app?.close();
  });

  it('20 POST đồng thời cùng một SKU: đúng 1 cái 201, 19 cái 409 (duplicate-sku), không có 500, DB đúng 1 dòng', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) => http(app).post('/v1/products').set(admin).send({ sku: 'RACE-001', name: `Lần ${i}`, price: 1000 })),
    );
    const statuses = results.map((r) => r.status).sort();
    expect({ created: statuses.filter((s) => s === 201).length, conflict: statuses.filter((s) => s === 409).length, other: statuses.filter((s) => s !== 201 && s !== 409) }).toEqual({
      created: 1,
      conflict: 19,
      other: [],
    });
    for (const r of results.filter((r) => r.status === 409)) {
      expect(r.headers['content-type']).toMatch(/problem\+json/);
      expect(r.body.type).toBe('urn:shop:error:duplicate-sku');
    }
    const [{ n }] = (await dataSourceOf(app).query(`SELECT count(*)::int AS n FROM products WHERE sku = 'RACE-001'`)) as { n: number }[];
    expect(n).toBe(1);
  });

  it('hai dải SKU xen kẽ: mỗi SKU vẫn chỉ được tạo đúng một lần, tổng số dòng bằng số SKU khác nhau', async () => {
    const skus = ['MIX-A', 'MIX-B', 'MIX-C'];
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, i) => http(app).post('/v1/products').set(admin).send({ sku: skus[i % 3], name: `n${i}`, price: 1 })),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    expect(results.filter((r) => r.status === 409)).toHaveLength(27);
    expect(results.some((r) => r.status >= 500)).toBe(false);
  });

  it('PATCH đồng thời đổi nhiều sản phẩm sang CÙNG một SKU mới: đúng 1 cái 200, còn lại 409, không 500', async () => {
    const ids: number[] = [];
    for (let i = 0; i < 8; i++) ids.push((await http(app).post('/v1/products').set(admin).send({ sku: `OLD-${i}`, name: `o${i}`, price: 1 }).expect(201)).body.id);
    const results = await Promise.all(ids.map((id) => http(app).patch(`/v1/products/${id}`).set(admin).send({ sku: 'NEW-SKU' })));
    expect(results.filter((r) => r.status === 200)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(7);
    expect(results.some((r) => r.status >= 500)).toBe(false);
    const [{ n }] = (await dataSourceOf(app).query(`SELECT count(*)::int AS n FROM products WHERE sku = 'NEW-SKU'`)) as { n: number }[];
    expect(n).toBe(1);
  });

  it('tạo tuần tự cùng SKU (không đồng thời) vẫn là 409, và SKU chữ thường được chuẩn hóa thành chữ hoa trước khi so', async () => {
    await http(app).post('/v1/products').set(admin).send({ sku: 'seq-1', name: 'a', price: 1 }).expect(201);
    await http(app).post('/v1/products').set(admin).send({ sku: 'SEQ-1', name: 'b', price: 1 }).expect(409);
  });
});
