import { INestApplication } from '@nestjs/common';
import { createTestApp, fileExists, http, readSource } from './_kit';

describe('C01 ex02 · configureApp', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('tồn tại src/app.setup.ts export configureApp', () => {
    expect(fileExists('src', 'app.setup.ts')).toBe(true);
    const setup = require('../../src/app.setup');
    expect(typeof setup.configureApp).toBe('function');
  });

  it('main.ts gọi configureApp trước listen', () => {
    const main = readSource('src', 'main.ts');
    expect(main).toMatch(/configureApp\(\s*app\s*\)/);
    expect(main.indexOf('configureApp(')).toBeLessThan(main.indexOf('.listen('));
  });

  it('không lộ header X-Powered-By', async () => {
    const res = await http(app).get('/ping').expect(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('configureApp bật enableShutdownHooks', () => {
    expect(readSource('src', 'app.setup.ts')).toMatch(/enableShutdownHooks\(\s*\)/);
  });

  it('route lạ → 404 với body mặc định của Nest', async () => {
    const res = await http(app).get('/khong-co').expect(404);
    expect(res.body).toEqual({ message: 'Cannot GET /khong-co', error: 'Not Found', statusCode: 404 });
  });
});
