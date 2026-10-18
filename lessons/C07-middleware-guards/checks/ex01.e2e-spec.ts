import { INestApplication } from '@nestjs/common';
import { createAppWithBoom } from './_boom';
import { createTestApp, http } from './_kit';
import { KEY } from './_fixtures';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('C07 ex01 · RequestIdMiddleware', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('mọi response có X-Request-Id dạng UUID: 200, 404, 400, 401', async () => {
    const calls = [
      () => http(app).get('/ping'),
      () => http(app).get('/khong-co'),
      () => http(app).get('/v1/products/abc'),
      () => http(app).post('/v1/products').send({}),
      () => http(app).get('/v1/products?limit=999'),
    ];
    const statuses: number[] = [];
    for (const c of calls) {
      const res = await c();
      statuses.push(res.status);
      expect(res.headers['x-request-id']).toMatch(UUID);
    }
    expect(statuses).toEqual([200, 404, 400, 401, 400]);
  });

  it('mỗi request một id khác nhau', async () => {
    const ids = new Set<string>();
    for (let i = 0; i < 20; i++) ids.add((await http(app).get('/ping')).headers['x-request-id'] as string);
    expect(ids.size).toBe(20);
  });

  it('dùng lại id hợp lệ do client gửi', async () => {
    const res = await http(app).get('/ping').set('X-Request-Id', 'client-req_12345.abc').expect(200);
    expect(res.headers['x-request-id']).toBe('client-req_12345.abc');
  });

  it.each([
    ['quá ngắn', 'abc'],
    ['quá dài', 'a'.repeat(65)],
    ['có khoảng trắng', 'has space inside id'],
    ['có ký tự đặc biệt', '<script>alert(1)</script>'],
    ['tiếng Việt', 'mã-yêu-cầu-001'],
  ])('id client %s bị bỏ và sinh id mới', async (_n, bad) => {
    const res = await http(app).get('/ping').set('X-Request-Id', Buffer.from(bad, 'utf8').toString('latin1')).expect(200);
    expect(res.headers['x-request-id']).toMatch(UUID);
    expect(res.headers['x-request-id']).not.toBe(bad);
  });

  it('có cả khi lỗi 500 từ handler', async () => {
    const boom = await createAppWithBoom();
    try {
      const res = await http(boom).get('/boom/error').expect(500);
      expect(res.headers['x-request-id']).toMatch(UUID);
    } finally {
      await boom.close();
    }
  });

  it('vẫn có header khi route được bảo vệ bằng key (middleware chạy trước guard)', async () => {
    const res = await http(app).post('/v1/products').set('x-api-key', KEY).send({ sku: 'RQ-1', name: 'x', price: 1 }).expect(201);
    expect(res.headers['x-request-id']).toMatch(UUID);
  });
});
