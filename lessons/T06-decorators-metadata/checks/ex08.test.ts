import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Controller, Get, Post, Put, Delete, getRoutes } from '../answers/ex08.js';

@Controller('orders')
class OrdersController {
  @Get() findAll() {}
  @Get(':id') findOne() {}
  @Post() create() {}
  @Put('/:id/') update() {}
  @Delete(':id') remove() {}
}

@Controller()
class HealthController {
  @Get() check() {}
  @Get('/ready') ready() {}
}

class NotAController {
  @Get() x() {}
}

@Controller('/orders/')
class DuplicateController {
  @Get(':id') again() {}
}

test('ex08 · gom route đúng thứ tự, chuẩn hóa path', () => {
  assert.deepEqual(getRoutes([OrdersController, HealthController]), [
    { method: 'GET', path: '/orders', controller: 'OrdersController', handler: 'findAll' },
    { method: 'GET', path: '/orders/:id', controller: 'OrdersController', handler: 'findOne' },
    { method: 'POST', path: '/orders', controller: 'OrdersController', handler: 'create' },
    { method: 'PUT', path: '/orders/:id', controller: 'OrdersController', handler: 'update' },
    { method: 'DELETE', path: '/orders/:id', controller: 'OrdersController', handler: 'remove' },
    { method: 'GET', path: '/', controller: 'HealthController', handler: 'check' },
    { method: 'GET', path: '/ready', controller: 'HealthController', handler: 'ready' },
  ]);
});
test('ex08 · thiếu @Controller', () => assert.throws(() => getRoutes([NotAController])));
test('ex08 · trùng route', () => {
  assert.throws(() => getRoutes([OrdersController, DuplicateController]), (e: unknown) => e instanceof Error && e.message.includes('/orders/:id'));
});
