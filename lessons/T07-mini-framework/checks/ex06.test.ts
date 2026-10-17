import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, Injectable, Controller, Get, Post, Param, Query, Body } from '../answers/mini-nest/index.js';

@Injectable()
class ProductsService {
  #items = [
    { id: 1, name: 'Áo thun' },
    { id: 2, name: 'Quần jean' },
  ];
  findAll(q?: string) {
    return q ? this.#items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())) : this.#items;
  }
  findOne(id: number) {
    return this.#items.find((p) => p.id === id) ?? null;
  }
  create(name: string) {
    const item = { id: this.#items.length + 1, name };
    this.#items.push(item);
    return item;
  }
}

@Controller('products')
class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll(@Query('q') q?: string) {
    return this.products.findAll(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.products.findOne(Number(id));
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.products.create(body.name);
  }
}

@Controller()
class HealthController {
  @Get('health')
  check(@Query('verbose') verbose?: string) {
    return { ok: true, verbose: verbose ?? null };
  }
}

const makeApp = () => createApp({ controllers: [ProductsController, HealthController], providers: [ProductsService] });

test('ex06 · GET danh sách + query', async () => {
  const app = await makeApp();
  assert.deepEqual(await app.handle({ method: 'GET', url: '/products' }), {
    status: 200,
    body: [
      { id: 1, name: 'Áo thun' },
      { id: 2, name: 'Quần jean' },
    ],
  });
  assert.deepEqual((await app.handle({ method: 'GET', url: '/products?q=jean' })).body, [{ id: 2, name: 'Quần jean' }]);
});
test('ex06 · path param', async () => {
  const app = await makeApp();
  assert.deepEqual(await app.handle({ method: 'GET', url: '/products/2' }), { status: 200, body: { id: 2, name: 'Quần jean' } });
});
test('ex06 · POST body → 201', async () => {
  const app = await makeApp();
  assert.deepEqual(await app.handle({ method: 'POST', url: '/products', body: { name: 'Mũ' } }), { status: 201, body: { id: 3, name: 'Mũ' } });
});
test('ex06 · query thiếu → undefined, controller không prefix', async () => {
  const app = await makeApp();
  assert.deepEqual((await app.handle({ method: 'GET', url: '/health' })).body, { ok: true, verbose: null });
  assert.deepEqual((await app.handle({ method: 'GET', url: '/health?verbose=1' })).body, { ok: true, verbose: '1' });
});
test('ex06 · 404', async () => {
  const app = await makeApp();
  assert.deepEqual(await app.handle({ method: 'DELETE', url: '/products/1' }), { status: 404, body: { message: 'Cannot DELETE /products/1' } });
  assert.equal((await app.handle({ method: 'GET', url: '/products/1/extra' })).status, 404);
});
