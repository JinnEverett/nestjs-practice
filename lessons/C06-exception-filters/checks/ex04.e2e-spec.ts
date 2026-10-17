import { INestApplication, Logger } from '@nestjs/common';
import { http } from './_kit';
import { createAppWithBoom } from './_boom';

describe('C06 ex04 · lỗi không lường trước (500) và lỗi lạ', () => {
  let app: INestApplication;
  let errorSpy: jest.SpyInstance;
  beforeAll(async () => {
    app = await createAppWithBoom();
  });
  beforeEach(() => {
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => errorSpy.mockRestore());
  afterAll(async () => {
    await app.close();
  });

  it('Error thường → 500 internal, KHÔNG lộ message/stack, nhưng được log phía server', async () => {
    const res = await http(app).get('/boom/error').expect(500);
    expect(res.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:internal', title: 'Internal Server Error', status: 500, instance: '/boom/error' });
    const text = JSON.stringify(res.body);
    for (const leak of ['ECONNREFUSED', 'hunter2', '10.0.0.5', 'at ', '.ts:']) expect(text).not.toContain(leak);
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls.flat().join(' ')).toContain('ECONNREFUSED'); // chi tiết nằm trong log
  });

  it('throw chuỗi / throw null → vẫn 500 problem, không crash', async () => {
    for (const path of ['/boom/string', '/boom/null']) {
      const res = await http(app).get(path).expect(500);
      expect(res.body.type).toBe('urn:shop:error:internal');
      expect(JSON.stringify(res.body)).not.toContain('oops-secret');
    }
    await http(app).get('/ping').expect(200); // server còn sống
  });

  it('HttpException 5xx: giữ status nhưng ẩn detail nội bộ', async () => {
    const res = await http(app).get('/boom/503').expect(503);
    expect(res.body).toMatchObject({ status: 503, title: 'Service Unavailable', type: 'urn:shop:error:internal' });
    expect(JSON.stringify(res.body)).not.toContain('db-internal-7');
  });

  it('HttpException 4xx với response là object: message mảng được nối vào detail', async () => {
    const res = await http(app).get('/boom/teapot').expect(418);
    expect(res.body.status).toBe(418);
    expect(res.body.detail).toBe('uống trà; đi ngủ');
    expect(res.body.type).toBe('urn:shop:error:error');
  });

  it('lỗi domain ném từ controller bất kỳ cũng được map', async () => {
    const res = await http(app).get('/boom/stock').expect(409);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:out-of-stock', productId: 7, requested: 5, available: 2 });
  });
});
