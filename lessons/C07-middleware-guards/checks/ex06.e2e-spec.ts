import { INestApplication, Logger } from '@nestjs/common';
import { createTestApp, http } from './_kit';

describe('C07 ex06 · 🔴 "Khóa API nằm trong log"', () => {
  const SECRET = 'sk-live-9f8e7d6c5b4a';
  const saved = process.env.ADMIN_API_KEY;
  let app: INestApplication;
  const spies: jest.SpyInstance[] = [];
  beforeAll(async () => {
    process.env.ADMIN_API_KEY = SECRET;
    app = await createTestApp();
  });
  afterAll(async () => {
    if (saved === undefined) delete process.env.ADMIN_API_KEY;
    else process.env.ADMIN_API_KEY = saved;
    await app.close();
  });
  afterEach(() => spies.splice(0).forEach((s) => s.mockRestore()));

  const capture = () => {
    const out: string[] = [];
    for (const level of ['log', 'warn', 'error', 'debug', 'verbose'] as const) {
      spies.push(jest.spyOn(Logger.prototype, level).mockImplementation((...args: unknown[]) => void out.push(args.map(String).join(' '))));
    }
    return out;
  };
  const flush = () => new Promise((r) => setTimeout(r, 30));

  it('khóa đúng, khóa sai, và khóa trong query đều không xuất hiện trong bất kỳ log nào', async () => {
    const out = capture();
    await http(app).post('/v1/products').set('x-api-key', SECRET).send({ sku: 'SC-1', name: 'x', price: 1 }).expect(201);
    await http(app).post('/v1/products').set('x-api-key', 'sai-' + SECRET).send({}).expect(401);
    await http(app).get(`/v1/products?apiKey=${SECRET}&q=${SECRET}`); // 400 (tham số lạ) nhưng vẫn không được log khóa
    await flush();
    expect(out.length).toBeGreaterThan(0);
    expect(out.join('\n')).not.toContain(SECRET);
  });

  it('khóa không bị lộ trong phản hồi lỗi', async () => {
    const res = await http(app).post('/v1/products').set('x-api-key', 'sai-' + SECRET).send({});
    expect(JSON.stringify(res.body) + JSON.stringify(res.headers)).not.toContain(SECRET);
  });

  it('nhiều request song song vẫn đúng: chỉ request có khóa đúng mới tạo được', async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        http(app).post('/v1/products').set('x-api-key', i % 2 === 0 ? SECRET : 'x').send({ sku: `PAR-${i}`, name: 'x', price: 1 }),
      ),
    );
    expect(results.map((r) => r.status)).toEqual(Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 201 : 401)));
    expect((await http(app).get('/v1/products?limit=100')).body.meta.total).toBe(11);
  });

  it('khóa đúng dài hơn/ngắn hơn khóa thật không làm guard ném 500 (timingSafeEqual cần cùng độ dài)', async () => {
    for (const key of ['a', 'a'.repeat(500), SECRET + 'x', SECRET.slice(0, -1)]) {
      await http(app).post('/v1/products').set('x-api-key', key).send({}).expect(401);
    }
  });
});
