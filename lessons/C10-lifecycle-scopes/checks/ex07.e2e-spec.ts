import { INestApplication } from '@nestjs/common';
import { NestContainer } from '@nestjs/core';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C10 ex07 · 🔴 "Gắn REQUEST scope cho tiện, p99 tăng gấp đôi"', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('chỉ đúng nhóm demo (ScopeController, RequestScopedService, ConsumerB) là non-static; core nghiệp vụ vẫn singleton', () => {
    const container = (app as unknown as { container: NestContainer }).container;
    const nonStatic = new Set<string>();
    for (const mod of container.getModules().values()) {
      for (const wrapper of [...mod.providers.values(), ...mod.controllers.values(), ...mod.injectables.values()]) {
        if (!wrapper.isDependencyTreeStatic() && wrapper.name !== 'REQUEST') nonStatic.add(wrapper.name as string); // REQUEST là provider nội bộ của Nest
      }
    }
    expect([...nonStatic].sort()).toEqual(['ConsumerB', 'RequestScopedService', 'ScopeController']);
  });

  it('các service/controller nghiệp vụ được dựng một lần: id request-scoped KHÔNG chạm vào luồng sản phẩm/đơn', async () => {
    const p = await createProduct(app);
    const a = await http(app).get(`/v1/products/${p.id}`).expect(200);
    const b = await http(app).get(`/v1/products/${p.id}`).expect(200);
    expect(a.body).toEqual(b.body);
  });

  it('lấy request id trong handler bằng @ReqId() thay vì REQUEST scope (không cần service request-scoped)', async () => {
    const res = await http(app).get('/v1/_scope').set('X-Request-Id', 'reqid-via-scope-1234').expect(200);
    expect(res.body.requestId).toBe('reqid-via-scope-1234');
  });
});
