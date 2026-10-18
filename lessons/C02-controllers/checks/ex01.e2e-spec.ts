import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C02 ex01 · versioning + tạo/đọc sản phẩm', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/products rỗng → envelope {data, meta}', async () => {
    const res = await http(app).get('/v1/products').expect(200);
    expect(res.body).toEqual({ data: [], meta: { page: 1, limit: 20, total: 0 } });
  });

  it('không có phiên bản thì 404 (/products)', async () => {
    await http(app).get('/products').expect(404);
  });

  it('/ping vẫn nằm ngoài phiên bản', async () => {
    await http(app).get('/ping').expect(200);
    await http(app).get('/v1/ping').expect(404);
  });

  it('POST → 201 + Location + body đủ trường mặc định', async () => {
    const res = await http(app)
      .post('/v1/products')
      .send({ sku: 'ao-001', name: '  Áo thun  ', price: 199000 })
      .expect(201);
    expect(res.headers.location).toBe(`/v1/products/${res.body.id}`);
    expect(res.body).toMatchObject({
      sku: 'AO-001',
      name: 'Áo thun',
      price: 199000,
      brand: null,
      stock: 0,
      attributes: {},
      isActive: true,
      categoryId: 1,
    });
    expect(Number.isInteger(res.body.id)).toBe(true);
    expect(new Date(res.body.createdAt).toISOString()).toBe(res.body.createdAt);
  });

  it('GET /v1/products/:id → 200 + Cache-Control; id không tồn tại → 404; id không phải số → 400', async () => {
    const p = await createProduct(app);
    const ok = await http(app).get(`/v1/products/${p.id}`).expect(200);
    expect(ok.body.id).toBe(p.id);
    expect(ok.headers['cache-control']).toBe('public, max-age=60');
    await http(app).get('/v1/products/999999').expect(404);
    await http(app).get('/v1/products/abc').expect(400);
  });

  it('thiếu hoặc sai sku/name/price → 400', async () => {
    for (const body of [
      {},
      { sku: 'X1', name: 'a', price: 1 }, // sku quá ngắn
      { sku: 'OK-1', name: '', price: 1 },
      { sku: 'OK-2', name: 'a', price: -1 },
      { sku: 'OK-3', name: 'a', price: 10.5 },
      { sku: 'OK-4', name: 'a', price: '100' },
      { sku: 'có dấu', name: 'a', price: 1 },
    ]) {
      await http(app).post('/v1/products').send(body).expect(400);
    }
  });

  it('danh sách phản ánh sản phẩm vừa tạo', async () => {
    const before = (await http(app).get('/v1/products')).body.meta.total as number;
    await createProduct(app);
    const res = await http(app).get('/v1/products').expect(200);
    expect(res.body.meta.total).toBe(before + 1);
  });
});
