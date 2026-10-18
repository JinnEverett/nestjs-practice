import { INestApplication, Logger } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { KEY } from './_fixtures';

describe('C07 ex02 · middleware ghi log HTTP (functional)', () => {
  let app: INestApplication;
  let log: jest.SpyInstance;
  let warn: jest.SpyInstance;
  let error: jest.SpyInstance;
  beforeAll(async () => {
    app = await createTestApp();
  });
  beforeEach(() => {
    log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    log.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });
  afterAll(async () => {
    await app.close();
  });

  const lines = (spy: jest.SpyInstance) => spy.mock.calls.map((c) => String(c[0]));
  const flush = () => new Promise((r) => setTimeout(r, 30));

  it('2xx → log level log, đủ method, path, status, thời gian (ms), requestId', async () => {
    const res = await http(app).get('/v1/products').expect(200);
    await flush();
    const mine = lines(log).filter((l) => l.includes('GET') && l.includes('/v1/products'));
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatch(/200/);
    expect(mine[0]).toMatch(/\d+(\.\d+)?\s?ms/);
    expect(mine[0]).toContain(res.headers['x-request-id']);
  });

  it('4xx → warn, 5xx không có ở đây nhưng 401/404 đều là warn', async () => {
    await http(app).get('/khong-co').expect(404);
    await http(app).post('/v1/products').send({}).expect(401);
    await flush();
    expect(lines(warn).some((l) => l.includes('GET') && l.includes('/khong-co') && l.includes('404'))).toBe(true);
    expect(lines(warn).some((l) => l.includes('POST') && l.includes('/v1/products') && l.includes('401'))).toBe(true);
  });

  it('chỉ một dòng log cho mỗi request', async () => {
    await http(app).get('/v1/products/1').expect(404);
    await flush();
    const all = [...lines(log), ...lines(warn), ...lines(error)].filter((l) => l.includes('/v1/products/1'));
    expect(all).toHaveLength(1);
  });

  it('không ghi query string (có thể chứa token)', async () => {
    await http(app).get('/v1/products?q=bi-mat-123&limit=5').expect(200);
    await flush();
    const all = [...lines(log), ...lines(warn)].join('\n');
    expect(all).not.toContain('bi-mat-123');
    expect(all).toContain('/v1/products');
  });

  it('/ping không bị log (exclude)', async () => {
    await http(app).get('/ping').expect(200);
    await flush();
    expect([...lines(log), ...lines(warn)].some((l) => l.includes('/ping'))).toBe(false);
  });

  it('dòng log của request ghi (201) cũng đúng', async () => {
    await http(app).post('/v1/products').set('x-api-key', KEY).send({ sku: 'LG-1', name: 'x', price: 1 }).expect(201);
    await flush();
    expect(lines(log).some((l) => l.includes('POST') && l.includes('201'))).toBe(true);
  });
});
