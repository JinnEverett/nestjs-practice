import { INestApplication } from '@nestjs/common';
import { ClockService } from '../../src/clock/clock.service';
import { ProductsService } from '../../src/products/products.service';
import { counters, createAppWithBoom } from './_boom';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C08 ex05 · cache GET bằng interceptor', () => {
  describe('route thử nghiệm', () => {
    let app: INestApplication;
    let now = new Date('2026-01-01T00:00:00.000Z');
    beforeAll(async () => {
      app = await createAppWithBoom((b) => b.overrideProvider(ClockService).useValue({ now: () => now }));
    });
    afterAll(async () => {
      await app.close();
    });

    it('lần đầu MISS, lần sau HIT với cùng body mà không chạy lại handler', async () => {
      const a = await http(app).get('/boom/cached').expect(200);
      const calls = counters.cached;
      const b = await http(app).get('/boom/cached').expect(200);
      expect(a.headers['x-cache']).toBe('MISS');
      expect(b.headers['x-cache']).toBe('HIT');
      expect(b.body).toEqual(a.body);
      expect(counters.cached).toBe(calls);
    });

    it('query khác nhau → mục cache khác nhau', async () => {
      const a = await http(app).get('/boom/cached?x=1');
      const b = await http(app).get('/boom/cached?x=2');
      expect(a.headers['x-cache']).toBe('MISS');
      expect(b.headers['x-cache']).toBe('MISS');
      expect((await http(app).get('/boom/cached?x=1')).headers['x-cache']).toBe('HIT');
    });

    it('hết hạn theo ClockService (TTL 10s): sau 11s lại MISS', async () => {
      now = new Date('2026-01-01T01:00:00.000Z');
      await http(app).get('/boom/cached?ttl=1');
      now = new Date(now.getTime() + 9_000);
      expect((await http(app).get('/boom/cached?ttl=1')).headers['x-cache']).toBe('HIT');
      now = new Date(now.getTime() + 2_000);
      expect((await http(app).get('/boom/cached?ttl=1')).headers['x-cache']).toBe('MISS');
    });

    it('route không có @CacheTtl thì không có header X-Cache và không cache', async () => {
      const a = await http(app).get('/boom/uncached');
      const b = await http(app).get('/boom/uncached');
      expect(a.headers['x-cache']).toBeUndefined();
      expect(b.body.n).toBe(a.body.n + 1);
    });

    it('lỗi không được cache: 404 hai lần đều chạy handler', async () => {
      const before = counters.cached;
      await http(app).get('/boom/cached-404').expect(404);
      await http(app).get('/boom/cached-404').expect(404);
      expect(counters.cached).toBe(before + 2);
    });

    it('sửa body trả về không làm hỏng cache (cache giữ bản sao)', async () => {
      const first = await http(app).get('/boom/cached?copy=1');
      first.body.n = -1;
      expect((await http(app).get('/boom/cached?copy=1')).body.n).not.toBe(-1);
    });
  });

  describe('trên sản phẩm', () => {
    let app: INestApplication;
    beforeAll(async () => {
      app = await createTestApp();
    });
    afterAll(async () => {
      await app.close();
    });

    it('GET /v1/products/:id và GET /v1/products được cache (HIT lần hai, service không bị gọi lại)', async () => {
      const p = await createProduct(app);
      const spy = jest.spyOn(ProductsService.prototype, 'findOne');
      const a = await http(app).get(`/v1/products/${p.id}`);
      const b = await http(app).get(`/v1/products/${p.id}`);
      expect([a.headers['x-cache'], b.headers['x-cache']]).toEqual(['MISS', 'HIT']);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(b.headers['cache-control']).toBe('public, max-age=60'); // header của handler vẫn còn
      spy.mockRestore();
      const l1 = await http(app).get('/v1/products?brand=x');
      const l2 = await http(app).get('/v1/products?brand=x');
      expect([l1.headers['x-cache'], l2.headers['x-cache']]).toEqual(['MISS', 'HIT']);
    });

    it('404 của sản phẩm không có không bị cache (không bao giờ HIT)', async () => {
      await http(app).get('/v1/products/5000').expect(404);
      expect((await http(app).get('/v1/products/5000').expect(404)).headers['x-cache']).not.toBe('HIT');
    });

    it('bộ nhớ có trần: 1100 URL khác nhau không làm cache phình mãi (mục cũ nhất bị loại)', async () => {
      await http(app).get('/v1/products?q=oldest-entry').expect(200);
      for (let i = 0; i < 1100; i++) await http(app).get(`/v1/products?q=flood-${i}`).expect(200);
      expect((await http(app).get('/v1/products?q=oldest-entry')).headers['x-cache']).toBe('MISS');
      expect((await http(app).get('/v1/products?q=flood-1099')).headers['x-cache']).toBe('HIT');
    }, 60_000);
  });
});
