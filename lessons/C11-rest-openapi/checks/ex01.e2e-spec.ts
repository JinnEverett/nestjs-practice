import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { getDoc } from './_doc';

describe('C11 ex01 · Swagger UI và /docs-json', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('/docs trả giao diện Swagger UI (HTML), không có tiền tố phiên bản', async () => {
    const res = await http(app).get('/docs').expect(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text.toLowerCase()).toContain('swagger');
    await http(app).get('/v1/docs').expect(404);
  });

  it('/docs-json là OpenAPI 3.x hợp lệ với info đúng', async () => {
    const doc = await getDoc(app);
    expect(doc.openapi).toMatch(/^3\.\d/);
    expect(doc.info.title).toBe('Shop API');
    expect(doc.info.version).toBe('1.0.0');
    expect(typeof doc.info.description).toBe('string');
    expect(doc.info.description.length).toBeGreaterThan(10);
  });

  it('khai báo các tag products, orders, system', async () => {
    const doc = await getDoc(app);
    expect((doc.tags as { name: string }[]).map((t) => t.name).sort()).toEqual(['orders', 'products', 'system']);
  });

  it('/docs-json công khai (không cần API key) và trả application/json', async () => {
    const res = await http(app).get('/docs-json').expect(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('tài liệu ổn định giữa các lần gọi (không chứa thời gian/ngẫu nhiên)', async () => {
    const a = JSON.stringify(await getDoc(app));
    const b = JSON.stringify(await getDoc(app));
    expect(a).toBe(b);
  });
});
