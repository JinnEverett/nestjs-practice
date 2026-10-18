import { INestApplication } from '@nestjs/common';
import { counters } from '../../src/lifecycle/scopes';
import { createTestApp, http } from './_kit';

describe('C10 ex04 · scope DEFAULT / REQUEST / TRANSIENT và scope "nổi" lên', () => {
  let app: INestApplication;
  let base: typeof counters;
  beforeAll(async () => {
    app = await createTestApp();
    base = { ...counters };
  });
  afterAll(async () => {
    await app.close();
  });

  const get = async (headers: Record<string, string> = {}) => {
    const r = http(app).get('/v1/_scope');
    for (const [k, v] of Object.entries(headers)) r.set(k, v);
    return r.expect(200);
  };

  it('lúc khởi động: singleton dựng 1 lần, transient của ConsumerA dựng 1 lần, request-scoped chưa dựng', () => {
    expect(base.singleton).toBeGreaterThanOrEqual(1);
    expect(base.request).toBe(0);
  });

  it('5 request liên tiếp: REQUEST dựng 5 lần, TRANSIENT (qua ConsumerB) 5 lần, singleton 0 lần', async () => {
    const before = { ...counters };
    const bodies = [];
    for (let i = 0; i < 5; i++) bodies.push((await get()).body);
    expect({
      singleton: counters.singleton - before.singleton,
      request: counters.request - before.request,
      transient: counters.transient - before.transient,
    }).toEqual({ singleton: 0, request: 5, transient: 5 });

    expect(new Set(bodies.map((b) => b.singletonId)).size).toBe(1);
    expect(new Set(bodies.map((b) => b.requestScopedId)).size).toBe(5);
    expect(new Set(bodies.map((b) => b.transientIds[0])).size).toBe(1); // ConsumerA là singleton nên giữ nguyên Transient
    expect(new Set(bodies.map((b) => b.transientIds[1])).size).toBe(5); // ConsumerB bị dựng lại mỗi request
    for (const b of bodies) expect(b.transientIds[0]).not.toBe(b.transientIds[1]);
  });

  it('REQUEST được inject đúng request hiện tại: requestId khớp header', async () => {
    const res = await get({ 'X-Request-Id': 'scope-test-12345' });
    expect(res.body.requestId).toBe('scope-test-12345');
    expect(res.headers['x-request-id']).toBe('scope-test-12345');
  });

  it('song song: mỗi request thấy requestId của chính nó', async () => {
    const ids = Array.from({ length: 12 }, (_, i) => `par-scope-${i}-abcdef`);
    const out = await Promise.all(ids.map((id) => get({ 'X-Request-Id': id })));
    expect(out.map((r) => r.body.requestId)).toEqual(ids);
  });
});
