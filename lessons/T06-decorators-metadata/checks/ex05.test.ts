import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Roles, Public, getRoles, isPublic } from '../answers/ex05.js';

@Roles('user')
class OrdersController {
  list() {}

  @Roles('admin')
  remove() {}

  @Public()
  health() {}
}

class AdminOrdersController extends OrdersController {
  @Roles('admin', 'auditor')
  audit() {}
}

@Public()
class AuthController {
  login() {}
}

test('ex05 · method ghi đè class', () => {
  assert.deepEqual(getRoles(OrdersController, 'list'), ['user']);
  assert.deepEqual(getRoles(OrdersController, 'remove'), ['admin']);
});
test('ex05 · kế thừa', () => {
  assert.deepEqual(getRoles(AdminOrdersController, 'audit'), ['admin', 'auditor']);
  assert.deepEqual(getRoles(AdminOrdersController, 'list'), ['user']);
  assert.deepEqual(getRoles(AdminOrdersController, 'remove'), ['admin']);
});
test('ex05 · public', () => {
  assert.equal(isPublic(OrdersController, 'health'), true);
  assert.equal(isPublic(OrdersController, 'list'), false);
  assert.equal(isPublic(AuthController, 'login'), true);
  assert.deepEqual(getRoles(AuthController, 'login'), []);
});
