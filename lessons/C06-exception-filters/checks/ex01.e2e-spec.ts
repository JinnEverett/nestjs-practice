import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';

describe('C06 ex01 · problem+json cho mọi lỗi', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('route lạ → 404 problem+json đủ 5 trường', async () => {
    const res = await http(app).get('/khong-co').expect(404);
    expect(res.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(res.body).toEqual({
      type: 'urn:shop:error:not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Cannot GET /khong-co',
      instance: '/khong-co',
    });
  });

  it.each([
    ['/v1/orders/999999', 404, 'not-found', 'Not Found'],
    ['/v1/products/0', 400, 'bad-request', 'Bad Request'],
    ['/v1/legacy/x', 410, 'gone', 'Gone'],
  ])('GET %s → %i %s', async (url, status, code, title) => {
    const res = await http(app).get(url).expect(status);
    expect(res.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(res.body).toMatchObject({ type: `urn:shop:error:${code}`, title, status, instance: url });
    expect(typeof res.body.detail).toBe('string');
    expect(res.body.detail.length).toBeGreaterThan(0);
  });

  it('thành công vẫn là application/json', async () => {
    const res = await http(app).get('/ping').expect(200);
    expect(res.headers['content-type']).toMatch(/^application\/json/);
  });

  it('PATCH sản phẩm không có → 404 problem; DELETE → 404 problem', async () => {
    const a = await http(app).patch('/v1/products/999').send({ price: 1 }).expect(404);
    expect(a.body.type).toMatch(/^urn:shop:error:/);
    expect(a.headers['content-type']).toMatch(/problem\+json/);
  });

  it('đơn lỗi 422 (mã giảm giá lạ) → type unprocessable-entity', async () => {
    const p = await http(app).post('/v1/products').send({ sku: 'FX-1', name: 'x', price: 100000, stock: 5 }).expect(201);
    const res = await http(app).post('/v1/orders').send({ items: [{ productId: p.body.id, quantity: 1 }], discountCode: 'NOPE' }).expect(422);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:unprocessable-entity', status: 422, instance: '/v1/orders' });
  });
});
