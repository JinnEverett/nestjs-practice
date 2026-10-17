import { INestApplication, Logger } from '@nestjs/common';
import { createTestApp, http } from './_kit';

describe('C07 ex07 · 🔴 "Log của hai request trộn vào nhau"', () => {
  let app: INestApplication;
  let spy: jest.SpyInstance;
  const out: string[] = [];
  beforeAll(async () => {
    app = await createTestApp();
  });
  beforeEach(() => {
    out.length = 0;
    spy = jest.spyOn(Logger.prototype, 'warn').mockImplementation((...a: unknown[]) => void out.push(a.map(String).join(' ')));
  });
  afterEach(() => spy.mockRestore());
  afterAll(async () => {
    await app.close();
  });

  it('30 request song song, mỗi request mang id riêng: response trả đúng id, log của request ghi đúng id đó', async () => {
    const n = 30;
    const ids = Array.from({ length: n }, (_, i) => `corr-${String(i).padStart(3, '0')}-abcdefgh`);
    const results = await Promise.all(ids.map((id, i) => http(app).get(`/v1/products/${1000 + i}`).set('X-Request-Id', id)));
    expect(results.map((r) => r.headers['x-request-id'])).toEqual(ids);
    await new Promise((r) => setTimeout(r, 50));
    expect(out).toHaveLength(n);
    for (let i = 0; i < n; i++) {
      const line = out.find((l) => l.includes(`/v1/products/${1000 + i} `));
      expect(line).toBeDefined();
      expect(line).toContain(ids[i]);
      for (let j = 0; j < n; j++) if (j !== i) expect(line).not.toContain(ids[j]);
    }
  });

  it('id giả mạo (dài 200 ký tự) không vào log và không phản chiếu ra header', async () => {
    const evil = 'X'.repeat(200);
    const res = await http(app).get('/v1/products/7777').set('X-Request-Id', evil).expect(404);
    await new Promise((r) => setTimeout(r, 30));
    expect(res.headers['x-request-id']).not.toContain('XXXXXXXX');
    expect(out.join('\n')).not.toContain(evil);
  });

  it('request không gửi id vẫn có id trong log trùng với header', async () => {
    const res = await http(app).get('/v1/products/8888').expect(404);
    await new Promise((r) => setTimeout(r, 30));
    expect(out.some((l) => l.includes(res.headers['x-request-id'] as string))).toBe(true);
  });
});
