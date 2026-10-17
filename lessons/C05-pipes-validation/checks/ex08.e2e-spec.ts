import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct, postOrder, stockOf } from './_fixtures';

describe('C05 ex08 · 🔴 mass assignment và prototype pollution', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('khách không tự đặt được userId/status/totalAmount/shippingFee/unitPrice khi đặt hàng', async () => {
    const p = await createProduct(app, { stock: 5, price: 100_000 });
    for (const extra of [{ userId: 2 }, { status: 'paid' }, { totalAmount: 1 }, { shippingFee: 0 }, { id: 99 }, { createdAt: 'x' }]) {
      const res = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }], ...extra });
      expect({ extra, status: res.status }).toEqual({ extra, status: 400 });
    }
    expect(await stockOf(app, p.id)).toBe(5);
  });

  it('không tạo/sửa sản phẩm với id, createdAt do client đặt', async () => {
    await http(app).post('/v1/products').send({ id: 1, sku: 'M-1', name: 'x', price: 1 }).expect(400);
    await http(app).post('/v1/products').send({ createdAt: '2000-01-01T00:00:00.000Z', sku: 'M-2', name: 'x', price: 1 }).expect(400);
  });

  it('__proto__ / constructor trong body: không 500, không làm ô nhiễm Object.prototype', async () => {
    const raws = [
      '{"sku":"P-1","name":"x","price":1,"__proto__":{"polluted":"yes"}}',
      '{"sku":"P-2","name":"x","price":1,"constructor":{"prototype":{"polluted":"yes"}}}',
      '{"__proto__":{"polluted":"yes"}}',
    ];
    for (const raw of raws) {
      const res = await http(app).post('/v1/products').set('content-type', 'application/json').send(raw);
      expect([201, 400]).toContain(res.status);
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    const p = await createProduct(app);
    const res = await http(app).patch(`/v1/products/${p.id}`).set('content-type', 'application/json').send('{"__proto__":{"polluted":"yes"},"price":5}');
    expect([200, 400]).toContain(res.status);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('JSON hỏng → 400 (không 500); body không phải object → 400', async () => {
    await http(app).post('/v1/products').set('content-type', 'application/json').send('{"sku":').expect(400);
    for (const raw of ['[]', '"x"', '5', 'null']) {
      const res = await http(app).post('/v1/products').set('content-type', 'application/json').send(raw);
      expect(res.status).toBe(400);
    }
  });

  it('lỗi 400 không lộ dữ liệu nội bộ (không có stack trace)', async () => {
    const res = await http(app).post('/v1/products').send({}).expect(400);
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\(.*:\d+:\d+\)/);
    expect(Object.keys(res.body).sort()).toEqual(['error', 'message', 'statusCode']);
  });
});
