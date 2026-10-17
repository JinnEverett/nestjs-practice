import { INestApplication } from '@nestjs/common';
import { createAppWithBoom } from './_boom';
import { http } from './_kit';

describe('C06 ex05 · lỗi từ tầng HTTP (không phải HttpException)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createAppWithBoom();
  });
  afterAll(async () => {
    await app.close();
  });

  it('JSON hỏng → 400 bad-request problem+json', async () => {
    const res = await http(app).post('/v1/products').set('content-type', 'application/json').send('{"sku":').expect(400);
    expect(res.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:bad-request', status: 400, instance: '/v1/products' });
    expect(typeof res.body.detail).toBe('string');
  });

  it('body vượt giới hạn mặc định (100kb) → 413 payload-too-large', async () => {
    const big = JSON.stringify({ sku: 'BIG-1', name: 'x'.repeat(150_000), price: 1 });
    const res = await http(app).post('/v1/products').set('content-type', 'application/json').send(big).expect(413);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:payload-too-large', status: 413, title: 'Payload Too Large' });
  });

  it('phương thức không hỗ trợ trên route có sẵn → 404 problem (Nest không phân biệt 405)', async () => {
    const res = await http(app).put('/v1/orders').send({}).expect(404);
    expect(res.body.type).toBe('urn:shop:error:not-found');
  });

  it('instance không chứa query string (có thể chứa token/PII)', async () => {
    const res = await http(app).get('/v1/products?limit=999&access_token=SECRET-TOKEN').expect(400);
    expect(res.body.instance).toBe('/v1/products');
    expect(JSON.stringify(res.body)).not.toContain('SECRET-TOKEN');
  });

  it('đường thành công không bị ảnh hưởng', async () => {
    const res = await http(app).post('/boom/echo').send({}).expect(201);
    expect(res.body).toEqual({ ok: true });
  });
});
