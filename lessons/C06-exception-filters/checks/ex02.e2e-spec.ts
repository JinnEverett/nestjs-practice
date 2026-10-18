import { INestApplication } from '@nestjs/common';
import { createTestApp, http, readSource } from './_kit';
import { createProduct } from './_fixtures';

describe('C06 ex02 · lỗi validation có cấu trúc', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('POST sản phẩm rỗng → 400 type validation, errors liệt kê mọi field', async () => {
    const res = await http(app).post('/v1/products').send({}).expect(400);
    expect(res.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:validation', title: 'Bad Request', status: 400, instance: '/v1/products' });
    expect(typeof res.body.detail).toBe('string');
    const fields = (res.body.errors as { field: string; message: string }[]).map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['sku', 'name', 'price']));
    for (const e of res.body.errors) {
      expect(Object.keys(e).sort()).toEqual(['field', 'message']);
      expect(typeof e.message).toBe('string');
    }
  });

  it('đường dẫn lồng nhau: items.1.quantity', async () => {
    const p = await createProduct(app, { stock: 5 });
    const res = await http(app)
      .post('/v1/orders')
      .send({ items: [{ productId: p.id, quantity: 1 }, { productId: p.id, quantity: 0 }] })
      .expect(400);
    expect(res.body.type).toBe('urn:shop:error:validation');
    expect(res.body.errors.map((e: { field: string }) => e.field)).toContain('items.1.quantity');
  });

  it('field lạ và lỗi query cũng có field', async () => {
    const a = await http(app).post('/v1/products').send({ sku: 'OK-1', name: 'x', price: 1, role: 'admin' }).expect(400);
    expect(a.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'role' })]));
    const b = await http(app).get('/v1/products?limit=999&page=abc').expect(400);
    expect(b.body.errors.map((e: { field: string }) => e.field).sort()).toEqual(expect.arrayContaining(['limit', 'page']));
  });

  it('errors không chứa giá trị người dùng gửi lên', async () => {
    const secret = 'S3CR3T-VALUE-123';
    const res = await http(app).post('/v1/products').send({ sku: secret + '!!', name: 'x', price: 1 }).expect(400);
    expect(JSON.stringify(res.body)).not.toContain(secret);
  });

  it('lỗi từ pipe của param (ParseIdPipe) KHÔNG có mảng errors, vẫn là bad-request', async () => {
    const res = await http(app).get('/v1/products/abc').expect(400);
    expect(res.body.type).toBe('urn:shop:error:bad-request');
    expect(res.body.errors).toBeUndefined();
  });

  it('filter được đăng ký qua DI (APP_FILTER) và dùng @Catch() không tham số', () => {
    expect(readSource('src', 'app.module.ts')).toMatch(/APP_FILTER/);
    expect(readSource('src', 'common', 'filters', 'all-exceptions.filter.ts')).toMatch(/@Catch\(\s*\)/);
  });
});
