import { INestApplication } from '@nestjs/common';
import { ApiDeprecated } from '../../src/common/decorators/deprecated.decorator';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';
import { getDoc } from './_doc';

describe('C11 ex07 · Deprecation và Sunset', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('có decorator ApiDeprecated dùng lại được', () => {
    expect(typeof ApiDeprecated).toBe('function');
  });

  it('GET /v1/products/count vẫn hoạt động nhưng báo ngừng: Deprecation, Sunset, Link successor-version', async () => {
    await createProduct(app);
    const res = await http(app).get('/v1/products/count').expect(200);
    expect(res.body).toEqual({ count: 1 });
    expect(res.headers.deprecation).toBe('@1790812800'); // 2026-10-01T00:00:00Z (RFC 9745: @<unix giây>)
    expect(res.headers.sunset).toBe('Thu, 01 Apr 2027 00:00:00 GMT'); // RFC 8594: HTTP-date
    expect(res.headers.link).toBe('</v1/products?limit=1>; rel="successor-version"');
  });

  it('header vẫn có ở lần gọi thứ hai (kể cả khi có cache)', async () => {
    const a = await http(app).get('/v1/products/count');
    const b = await http(app).get('/v1/products/count');
    expect(b.headers.deprecation).toBe(a.headers.deprecation);
    expect(b.headers.sunset).toBeDefined();
  });

  it('OpenAPI đánh dấu deprecated: true cho đúng thao tác này và chỉ nó', async () => {
    const doc = await getDoc(app);
    const flagged: string[] = [];
    for (const [path, item] of Object.entries<Record<string, { deprecated?: boolean; summary: string }>>(doc.paths)) {
      for (const [method, op] of Object.entries(item)) if (op.deprecated) flagged.push(`${method} ${path}`);
    }
    expect(flagged).toEqual(['get /v1/products/count']);
    expect(doc.paths['/v1/products/count'].get.summary).toMatch(/deprecated/i);
  });

  it('route khác không có header Deprecation/Sunset', async () => {
    const p = await createProduct(app);
    for (const url of ['/v1/products', `/v1/products/${p.id}`, '/v2/products', '/ping']) {
      const res = await http(app).get(url).expect(200);
      expect({ url, d: res.headers.deprecation, s: res.headers.sunset }).toEqual({ url, d: undefined, s: undefined });
    }
  });
});
