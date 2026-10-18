import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';

describe('C08 ex08 · 🔴 GET /v1/_trace: tận mắt thấy lifecycle (và request song song không lẫn nhau)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  const EXPECTED = ['middleware', 'guard', 'interceptor:before', 'pipe', 'handler'];

  it('GET /v1/_trace?n=5 → body {n, order} đúng thứ tự', async () => {
    const res = await http(app).get('/v1/_trace?n=5').expect(200);
    expect(res.body).toEqual({ n: 5, order: EXPECTED });
  });

  it('header X-Trace có thêm interceptor:after ở cuối', async () => {
    const res = await http(app).get('/v1/_trace?n=1').expect(200);
    expect(res.headers['x-trace']).toBe([...EXPECTED, 'interceptor:after'].join(','));
  });

  it('pipe chuyển n thành số (query là chuỗi); n thiếu hoặc rác → 0', async () => {
    expect((await http(app).get('/v1/_trace?n=42')).body.n).toBe(42);
    expect((await http(app).get('/v1/_trace')).body.n).toBe(0);
    expect((await http(app).get('/v1/_trace?n=abc')).body.n).toBe(0);
  });

  it('25 request song song: mỗi request chỉ thấy sự kiện của chính nó', async () => {
    const out = await Promise.all(Array.from({ length: 25 }, (_, i) => http(app).get(`/v1/_trace?n=${i}`)));
    out.forEach((r, i) => {
      expect(r.body.n).toBe(i);
      expect(r.body.order).toEqual(EXPECTED);
      expect(r.headers['x-trace']).toBe([...EXPECTED, 'interceptor:after'].join(','));
    });
  });

  it('các route khác không bị lẫn sự kiện trace', async () => {
    const res = await http(app).get('/v1/products');
    expect(res.headers['x-trace']).toBeUndefined();
  });
});
