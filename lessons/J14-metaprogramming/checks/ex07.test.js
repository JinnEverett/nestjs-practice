import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMetadataRegistry } from '../answers/ex07.js';

test('ex07 · define / getOwn trên class và method', () => {
  const r = createMetadataRegistry();
  class OrdersController {}
  r.defineMetadata('path', 'orders', OrdersController);
  r.defineMetadata('method', 'GET', OrdersController.prototype, 'findAll');
  assert.equal(r.getOwnMetadata('path', OrdersController), 'orders');
  assert.equal(r.getOwnMetadata('method', OrdersController.prototype, 'findAll'), 'GET');
  assert.equal(r.getOwnMetadata('method', OrdersController.prototype), undefined);
  assert.equal(r.hasMetadata('path', OrdersController), true);
  assert.equal(r.hasMetadata('nope', OrdersController), false);
});
test('ex07 · kế thừa qua chuỗi prototype', () => {
  const r = createMetadataRegistry();
  class Base {}
  class Child extends Base {}
  r.defineMetadata('roles', ['user'], Base);
  r.defineMetadata('guard', 'auth', Base.prototype, 'handle');
  assert.deepEqual(r.getMetadata('roles', Child), ['user']);
  assert.equal(r.getOwnMetadata('roles', Child), undefined);
  assert.equal(r.getMetadata('guard', Child.prototype, 'handle'), 'auth');
  r.defineMetadata('roles', ['admin'], Child);
  assert.deepEqual(r.getMetadata('roles', Child), ['admin']);
  assert.deepEqual(r.getMetadata('roles', Base), ['user']);
});
test('ex07 · getMetadataKeys: own trước, rồi kế thừa, không trùng', () => {
  const r = createMetadataRegistry();
  class Base {}
  class Child extends Base {}
  r.defineMetadata('a', 1, Base);
  r.defineMetadata('b', 1, Base);
  r.defineMetadata('c', 1, Child);
  r.defineMetadata('a', 2, Child);
  assert.deepEqual(r.getMetadataKeys(Child), ['c', 'a', 'b']);
});
test('ex07 · hai registry độc lập, key symbol được', () => {
  const r1 = createMetadataRegistry();
  const r2 = createMetadataRegistry();
  const KEY = Symbol('k');
  class X {}
  r1.defineMetadata(KEY, 1, X);
  assert.equal(r1.getMetadata(KEY, X), 1);
  assert.equal(r2.getMetadata(KEY, X), undefined);
});
