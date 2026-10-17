import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { ROUTES, routePath, type RouteName, type RoutePath, type OrderItem } from '../answers/ex01.js';

type _n = Expect<Equal<RouteName, 'home' | 'orders' | 'orderDetail'>>;
type _p = Expect<Equal<RoutePath, '/' | '/orders' | '/orders/:id'>>;
type _i = Expect<Equal<OrderItem, { productId: number; qty: number }>>;

function _typeTests() {
  // @ts-expect-error route lạ
  routePath('cart');
}

test('ex01 · routePath', () => {
  assert.equal(routePath('orderDetail'), '/orders/:id');
  assert.equal(ROUTES.home, '/');
});
