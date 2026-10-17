import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp, Injectable, Controller, Get, Param, HttpError } from '../answers/mini-nest/index.js';

const initLog: string[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
class Db {
  connected = false;
  async onModuleInit() {
    await sleep(20);
    this.connected = true;
    initLog.push('db');
  }
}

@Injectable()
class OrdersService {
  constructor(private readonly db: Db) {}
  onModuleInit() {
    initLog.push(`orders(db connected=${this.db.connected})`);
  }
  async find(id: number) {
    await sleep(5);
    if (id === 0) throw new Error('relation "orders" does not exist');
    if (id > 100) throw new HttpError(404, `Order ${id} not found`);
    return { id };
  }
}

@Controller('orders')
class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.orders.find(Number(id));
  }
}

test('ex07 · onModuleInit tuần tự theo thứ tự tạo', async () => {
  initLog.length = 0;
  await createApp({ controllers: [OrdersController], providers: [OrdersService, Db] });
  assert.deepEqual(initLog, ['db', 'orders(db connected=true)']);
});
test('ex07 · async handler', async () => {
  const app = await createApp({ controllers: [OrdersController], providers: [OrdersService, Db] });
  assert.deepEqual(await app.handle({ method: 'GET', url: '/orders/7' }), { status: 200, body: { id: 7 } });
});
test('ex07 · HttpError và lỗi lạ', async () => {
  const app = await createApp({ controllers: [OrdersController], providers: [OrdersService, Db] });
  assert.deepEqual(await app.handle({ method: 'GET', url: '/orders/999' }), { status: 404, body: { message: 'Order 999 not found' } });
  assert.deepEqual(await app.handle({ method: 'GET', url: '/orders/0' }), { status: 500, body: { message: 'Internal server error' } });
});
