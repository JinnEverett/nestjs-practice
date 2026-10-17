import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';

describe('C01 ex01 · GET /ping', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('GET /ping → 200, JSON, pong: true', async () => {
    const res = await http(app).get('/ping').expect(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.pong).toBe(true);
  });

  it('phần mẫu đã xóa: GET / → 404 (không còn Hello World!)', async () => {
    const res = await http(app).get('/');
    expect(res.status).toBe(404);
    expect(res.text).not.toContain('Hello World');
  });

  it('POST /ping → 404 (chỉ có GET)', async () => {
    await http(app).post('/ping').send({}).expect(404);
  });
});
