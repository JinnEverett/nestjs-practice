import { INestApplication } from '@nestjs/common';
import { createTestApp } from './_kit';
import { Doc, getDoc, PUBLIC_OPERATIONS, resolve, WRITE_OPERATIONS } from './_doc';

describe('C11 ex04 · hợp đồng lỗi (problem+json) và bảo mật trong OpenAPI', () => {
  let app: INestApplication;
  let doc: Doc;
  beforeAll(async () => {
    app = await createTestApp();
    doc = await getDoc(app);
  });
  afterAll(async () => {
    await app.close();
  });
  const op = (m: string, p: string): Doc => doc.paths[p][m];

  it('component ProblemDetailsDto có type, title, status, detail, instance (+ errors tùy chọn)', () => {
    const s = doc.components.schemas.ProblemDetailsDto;
    expect(Object.keys(s.properties).sort()).toEqual(['detail', 'errors', 'instance', 'status', 'title', 'type']);
    expect([...s.required].sort()).toEqual(['detail', 'instance', 'status', 'title', 'type']);
    expect(s.properties.errors.type).toBe('array');
    expect(resolve(doc, s.properties.errors.items).properties).toHaveProperty('field');
  });

  it.each([
    ['post', '/v1/products', ['201', '400', '401', '409']],
    ['patch', '/v1/products/{id}', ['200', '400', '401', '404', '409']],
    ['delete', '/v1/products/{id}', ['204', '400', '401', '404', '409']],
    ['get', '/v1/products/{id}', ['200', '400', '404']],
    ['get', '/v1/products', ['200', '400']],
    ['post', '/v1/orders', ['201', '400', '401', '409', '422']],
    ['get', '/v1/orders/{id}', ['200', '400', '404']],
  ])('%s %s khai báo các response %j', (method, path, statuses) => {
    const codes = Object.keys(op(method, path).responses);
    for (const s of statuses) expect({ path, s, has: codes.includes(s) }).toEqual({ path, s, has: true });
  });

  it('mọi response lỗi (4xx/5xx) mô tả bằng application/problem+json trỏ về ProblemDetailsDto', () => {
    for (const [method, path] of PUBLIC_OPERATIONS) {
      for (const [code, res] of Object.entries<Doc>(op(method, path).responses)) {
        if (!/^[45]/.test(code)) continue;
        const media = res.content?.['application/problem+json'];
        expect({ method, path, code, ok: Boolean(media) }).toEqual({ method, path, code, ok: true });
        expect(media.schema.$ref).toBe('#/components/schemas/ProblemDetailsDto');
      }
    }
  });

  it('security scheme ApiKey (header X-Api-Key) được khai báo', () => {
    expect(doc.components.securitySchemes.ApiKey).toMatchObject({ type: 'apiKey', in: 'header', name: 'X-Api-Key' });
  });

  it('chỉ các route ghi yêu cầu ApiKey; route đọc không', () => {
    const writes = new Set(WRITE_OPERATIONS.map(([m, p]) => `${m} ${p}`));
    for (const [method, path] of PUBLIC_OPERATIONS) {
      const secured = JSON.stringify(op(method, path).security ?? []).includes('ApiKey');
      expect({ method, path, secured }).toEqual({ method, path, secured: writes.has(`${method} ${path}`) });
    }
  });

  it('response thành công có schema: 201 Product, 201 Order, 200 Order', () => {
    expect(op('post', '/v1/products').responses['201'].content['application/json'].schema.$ref).toBe('#/components/schemas/Product');
    expect(op('post', '/v1/orders').responses['201'].content['application/json'].schema.$ref).toBe('#/components/schemas/Order');
    expect(op('get', '/v1/orders/{id}').responses['200'].content['application/json'].schema.$ref).toBe('#/components/schemas/Order');
    expect(op('delete', '/v1/products/{id}').responses['204'].content).toBeUndefined();
  });
});
