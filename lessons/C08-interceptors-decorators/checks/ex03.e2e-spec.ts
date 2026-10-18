import { INestApplication } from '@nestjs/common';
import { counters, createAppWithBoom } from './_boom';
import { http } from './_kit';

describe('C08 ex03 · TimeoutInterceptor + @Timeout(ms)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createAppWithBoom();
  });
  afterAll(async () => {
    await app.close();
  });

  it('handler chậm hơn @Timeout → 408 problem+json type request-timeout', async () => {
    const res = await http(app).get('/boom/slow').expect(408);
    expect(res.headers['content-type']).toMatch(/problem\+json/);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:request-timeout', title: 'Request Timeout', status: 408, instance: '/boom/slow' });
  });

  it('handler nhanh → 200', async () => {
    expect((await http(app).get('/boom/fast').expect(200)).body).toEqual({ done: true });
  });

  it('lỗi khác của handler không bị đổi thành 408', async () => {
    const res = await http(app).get('/boom/err').expect(404);
    expect(res.body.type).toBe('urn:shop:error:not-found');
  });

  it('route không khai báo @Timeout dùng giới hạn mặc định đủ rộng (5s): các route thường vẫn chạy', async () => {
    await http(app).get('/v1/products').expect(200);
    await http(app).get('/ping').expect(200);
  });

  it('(giáo dục) timeout chỉ bỏ chờ; promise đã bắt đầu vẫn chạy tiếp tới cùng', async () => {
    const before = counters.slowFinished;
    await http(app).get('/boom/slow').expect(408);
    await new Promise((r) => setTimeout(r, 400));
    expect(counters.slowFinished).toBeGreaterThan(before);
  });
});
