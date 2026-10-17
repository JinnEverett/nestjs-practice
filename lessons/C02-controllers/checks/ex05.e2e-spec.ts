import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C02 ex05 · @Redirect và route tĩnh vs động', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/p/:sku → 302 tới /v1/products/:id (không phân biệt hoa thường)', async () => {
    const p = await createProduct(app, { sku: 'SHORT-1' });
    const res = await http(app).get('/v1/p/short-1').redirects(0).expect(302);
    expect(res.headers.location).toBe(`/v1/products/${p.id}`);
  });

  it('follow redirect thì ra đúng sản phẩm', async () => {
    const p = await createProduct(app, { sku: 'SHORT-2' });
    const res = await http(app).get('/v1/p/SHORT-2').redirects(1).expect(200);
    expect(res.body.id).toBe(p.id);
  });

  it('SKU không tồn tại → 404 (không redirect)', async () => {
    const res = await http(app).get('/v1/p/KHONG-CO').redirects(0).expect(404);
    expect(res.headers.location).toBeUndefined();
  });

  it('GET /v1/products/count là route tĩnh, không bị :id nuốt', async () => {
    const before = (await http(app).get('/v1/products/count').expect(200)).body;
    expect(typeof before.count).toBe('number');
    await createProduct(app);
    const after = (await http(app).get('/v1/products/count').expect(200)).body;
    expect(after.count).toBe(before.count + 1);
  });
});
