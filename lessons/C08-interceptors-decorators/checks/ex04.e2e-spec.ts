import { readFileSync } from 'node:fs';
import { Reflector } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import { AdminOnly, IS_ADMIN_ONLY } from '../../src/common/decorators/admin-only.decorator';
import { ProductsController } from '../../src/products/products.controller';
import { OrdersController } from '../../src/orders/orders.controller';
import { BoomController, createAppWithBoom } from './_boom';
import { http, repoPath } from './_kit';

describe('C08 ex04 · @AdminOnly() = applyDecorators(SetMetadata, UseGuards)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createAppWithBoom();
  });
  afterAll(async () => {
    await app.close();
  });

  it('route gắn @AdminOnly() cần X-Api-Key (401 không có, 201 có)', async () => {
    const no = await http(app).post('/boom/admin').expect(401);
    expect(no.body.type).toBe('urn:shop:error:unauthorized');
    await http(app).post('/boom/admin').set('x-api-key', 'dev-admin-key').expect(201);
  });

  it('metadata IS_ADMIN_ONLY đọc được bằng Reflector; route không gắn thì không có', () => {
    const reflector = new Reflector();
    expect(typeof AdminOnly).toBe('function');
    expect(reflector.get(IS_ADMIN_ONLY, BoomController.prototype.admin)).toBe(true);
    expect(reflector.get(IS_ADMIN_ONLY, BoomController.prototype.cached)).toBeUndefined();
  });

  it('các route ghi của products/orders dùng @AdminOnly() (có metadata) và công khai thì không', () => {
    const reflector = new Reflector();
    const writes: [object, string][] = [
      [ProductsController.prototype, 'create'], [ProductsController.prototype, 'update'],
      [ProductsController.prototype, 'remove'], [OrdersController.prototype, 'create'],
    ];
    for (const [proto, name] of writes) {
      expect({ name, v: reflector.get(IS_ADMIN_ONLY, (proto as Record<string, () => void>)[name]) }).toEqual({ name, v: true });
    }
    expect(reflector.get(IS_ADMIN_ONLY, ProductsController.prototype.findOne)).toBeUndefined();
    expect(reflector.get(IS_ADMIN_ONLY, OrdersController.prototype.findOne)).toBeUndefined();
  });

  it('không còn @UseGuards(ApiKeyGuard) rải rác trong controller', () => {
    for (const f of [['products', 'products.controller.ts'], ['orders', 'orders.controller.ts']]) {
      const text = readFileSync(repoPath('src', ...f), 'utf8');
      expect({ f, bad: /UseGuards\(\s*ApiKeyGuard/.test(text) }).toEqual({ f, bad: false });
    }
  });

  it('hành vi C07 giữ nguyên: ghi cần khóa, đọc công khai', async () => {
    await http(app).post('/v1/products').send({ sku: 'AO-1', name: 'x', price: 1 }).expect(401);
    await http(app).get('/v1/products').expect(200);
  });
});
