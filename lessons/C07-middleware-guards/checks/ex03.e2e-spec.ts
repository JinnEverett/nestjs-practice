import { INestApplication } from '@nestjs/common';
import { createTestApp, http, readSource } from './_kit';
import { createProduct, KEY } from './_fixtures';

describe('C07 ex03 · ApiKeyGuard', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  const body = { sku: 'GD-1', name: 'x', price: 1 };

  it('thiếu key → 401 problem+json type unauthorized', async () => {
    const res = await http(app).post('/v1/products').send(body).expect(401);
    expect(res.headers['content-type']).toMatch(/problem\+json/);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:unauthorized', status: 401, instance: '/v1/products' });
  });

  it.each([['sai khóa', 'nope'], ['khóa bị cắt mất 1 ký tự', 'dev-admin-ke'], ['khác hoa thường', 'DEV-ADMIN-KEY'], ['rỗng', ''], ['hai khóa gộp', 'dev-admin-key, dev-admin-key']])(
    '%s → 401',
    async (_n, key) => {
      await http(app).post('/v1/products').set('x-api-key', key).send(body).expect(401);
    },
  );

  it('khóa đúng → qua; tên header không phân biệt hoa thường', async () => {
    await http(app).post('/v1/products').set('X-API-KEY', KEY).send(body).expect(201);
  });

  it('PATCH, DELETE, POST orders cũng cần khóa', async () => {
    const p = await createProduct(app, { stock: 3 });
    await http(app).patch(`/v1/products/${p.id}`).send({ price: 5 }).expect(401);
    await http(app).delete(`/v1/products/${p.id}`).expect(401);
    await http(app).post('/v1/orders').send({ items: [{ productId: p.id, quantity: 1 }] }).expect(401);
    await http(app).patch(`/v1/products/${p.id}`).set('x-api-key', KEY).send({ price: 5 }).expect(200);
    await http(app).post('/v1/orders').set('x-api-key', KEY).send({ items: [{ productId: p.id, quantity: 1 }] }).expect(201);
    await http(app).delete(`/v1/products/${p.id}`).set('x-api-key', KEY).expect(409);
  });

  it('so sánh khóa bằng timingSafeEqual và nằm trong guard (src/common/guards/api-key.guard.ts)', () => {
    const src = readSource('src', 'common', 'guards', 'api-key.guard.ts');
    expect(src).toMatch(/timingSafeEqual/);
    expect(src).toMatch(/canActivate/);
  });

  describe('cấu hình bằng ADMIN_API_KEY', () => {
    const saved = { key: process.env.ADMIN_API_KEY, env: process.env.NODE_ENV };
    afterEach(() => {
      if (saved.key === undefined) delete process.env.ADMIN_API_KEY;
      else process.env.ADMIN_API_KEY = saved.key;
      process.env.NODE_ENV = saved.env;
    });

    it('đặt ADMIN_API_KEY thì khóa mặc định không còn dùng được', async () => {
      process.env.ADMIN_API_KEY = 'k-from-env-123';
      const a = await createTestApp();
      try {
        await http(a).post('/v1/products').set('x-api-key', 'dev-admin-key').send(body).expect(401);
        await http(a).post('/v1/products').set('x-api-key', 'k-from-env-123').send(body).expect(201);
      } finally {
        await a.close();
      }
    });

    it('production mà không cấu hình khóa → từ chối mọi route ghi (fail closed), kể cả khi gửi khóa mặc định', async () => {
      delete process.env.ADMIN_API_KEY;
      process.env.NODE_ENV = 'production';
      const a = await createTestApp();
      try {
        await http(a).post('/v1/products').set('x-api-key', 'dev-admin-key').send(body).expect(401);
        await http(a).post('/v1/products').set('x-api-key', '').send(body).expect(401);
        await http(a).get('/v1/products').expect(200);
      } finally {
        await a.close();
      }
    });
  });
});
