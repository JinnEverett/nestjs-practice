import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C08 ex02 · TimingInterceptor → Server-Timing', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('phản hồi thành công có Server-Timing: app;dur=<số ms>', async () => {
    const p = await createProduct(app);
    for (const url of ['/ping', '/v1/products', `/v1/products/${p.id}`, '/v2/products']) {
      const res = await http(app).get(url).expect(200);
      expect({ url, h: res.headers['server-timing'] }).toEqual({ url, h: expect.stringMatching(/^app;dur=\d+(\.\d+)?$/) });
    }
  });

  it('cả request ghi (201) cũng có', async () => {
    const res = await http(app).post('/v1/products').set('x-api-key', 'dev-admin-key').send({ sku: 'TM-1', name: 'x', price: 1 }).expect(201);
    expect(res.headers['server-timing']).toMatch(/^app;dur=/);
  });

  it('thời gian đo là thời gian thật của handler (không phải hằng số)', async () => {
    const durations: number[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await http(app).get('/v1/products?limit=100');
      durations.push(Number(/dur=([\d.]+)/.exec(res.headers['server-timing'] as string)?.[1]));
    }
    for (const d of durations) expect(d).toBeGreaterThanOrEqual(0);
    expect(durations.every((d) => d < 1000)).toBe(true);
  });
});
