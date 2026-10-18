import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct, KEY, postOrder } from './_fixtures';

describe('C07 ex05 · middleware theo route: Cache-Control no-store cho /v1/orders', () => {
  let app: INestApplication;
  let pid: number;
  beforeAll(async () => {
    app = await createTestApp();
    pid = (await createProduct(app, { stock: 5 })).id;
  });
  afterAll(async () => {
    await app.close();
  });

  it('mọi phản hồi của /v1/orders (201, 200, 404, 400, 401) có Cache-Control: no-store', async () => {
    const created = await postOrder(app, { items: [{ productId: pid, quantity: 1 }] });
    const responses = [
      created,
      await http(app).get(`/v1/orders/${created.body.id}`),
      await http(app).get('/v1/orders/999999'),
      await http(app).get('/v1/orders/abc'),
      await http(app).post('/v1/orders').send({}),
      await http(app).post('/v1/orders').set('x-api-key', KEY).send({}),
    ];
    expect(responses.map((r) => r.status)).toEqual([201, 200, 404, 400, 401, 400]);
    for (const r of responses) expect(r.headers['cache-control']).toBe('no-store');
  });

  it('không ảnh hưởng route khác: sản phẩm giữ Cache-Control riêng, /ping không có', async () => {
    expect((await http(app).get(`/v1/products/${pid}`)).headers['cache-control']).toBe('public, max-age=60');
    expect((await http(app).get('/v1/products')).headers['cache-control']).toBeUndefined();
    expect((await http(app).get('/ping')).headers['cache-control']).toBeUndefined();
  });

  it('/v1/orders chỉ khớp đúng tiền tố: không lan sang đường dẫn tương tự', async () => {
    expect((await http(app).get('/v1/orders-archive')).headers['cache-control']).toBeUndefined();
    expect((await http(app).get('/v2/orders/1')).headers['cache-control']).toBeUndefined();
  });
});
