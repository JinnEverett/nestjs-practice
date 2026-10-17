import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { buildPath, type RouteParams } from '../answers/ex04.js';

type _1 = Expect<Equal<RouteParams<'/users/:userId/orders/:orderId'>, 'userId' | 'orderId'>>;
type _2 = Expect<Equal<RouteParams<'/orders/:id'>, 'id'>>;
type _3 = Expect<Equal<RouteParams<'/health'>, never>>;

function _typeTests() {
  // @ts-expect-error thiếu orderId
  buildPath('/users/:userId/orders/:orderId', { userId: 1 });
  // @ts-expect-error thừa param
  buildPath('/orders/:id', { id: 1, extra: 2 });
}

test('ex04 · buildPath', () => {
  assert.equal(buildPath('/users/:userId/orders/:orderId', { userId: 7, orderId: 'A 1' }), '/users/7/orders/A%201');
  assert.equal(buildPath('/health', {}), '/health');
});
