import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct, KEY, postOrder } from './_fixtures';

describe('C07 ex04 · phạm vi áp dụng của guard', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('các route đọc vẫn công khai', async () => {
    const p = await createProduct(app, { sku: 'PUB-1', stock: 2 });
    const o = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] });
    for (const url of ['/ping', '/v1/products', `/v1/products/${p.id}`, '/v1/products/count', `/v1/orders/${o.body.id}`, '/v2/products']) {
      const res = await http(app).get(url);
      expect({ url, status: res.status }).toEqual({ url, status: 200 });
    }
    await http(app).get('/v1/p/pub-1').redirects(0).expect(302);
  });

  it('route lạ vẫn 404, không bị đổi thành 401', async () => {
    await http(app).get('/khong-co').expect(404);
    await http(app).post('/khong-co').send({}).expect(404);
    await http(app).delete('/v1/khong-co').expect(404);
  });

  it('route legacy (mọi method) vẫn 410, không bị guard chặn', async () => {
    await http(app).post('/v1/legacy/x').send({}).expect(410);
    await http(app).delete('/v1/legacy/y/z').expect(410);
  });

  it('guard chạy TRƯỚC pipe: người chưa xác thực gửi body rác chỉ nhận 401, không lộ luật validate', async () => {
    const res = await http(app).post('/v1/products').send({ role: 'admin' }).expect(401);
    expect(res.body.errors).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toMatch(/sku|price|should not exist/);
    const o = await http(app).post('/v1/orders').send({ items: 'x' }).expect(401);
    expect(o.body.errors).toBeUndefined();
  });

  it('guard chạy TRƯỚC khi tìm tài nguyên: PATCH/DELETE id không tồn tại + không có key → 401 (không phải 404)', async () => {
    await http(app).patch('/v1/products/999999').send({ price: 1 }).expect(401);
    await http(app).delete('/v1/products/999999').expect(401);
    await http(app).patch('/v1/products/999999').set('x-api-key', KEY).send({ price: 1 }).expect(404);
  });

  it('có khóa nhưng body sai thì mới tới lượt validation (400)', async () => {
    const res = await http(app).post('/v1/products').set('x-api-key', KEY).send({}).expect(400);
    expect(res.body.type).toBe('urn:shop:error:validation');
  });
});
