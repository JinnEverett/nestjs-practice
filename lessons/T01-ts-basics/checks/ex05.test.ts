import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { ORDER_STATUSES, isOrderStatus, type OrderStatus } from '../answers/ex05.js';

type _union = Expect<Equal<OrderStatus, 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'>>;
type _readonly = Expect<Equal<typeof ORDER_STATUSES, readonly ['pending', 'paid', 'shipped', 'delivered', 'cancelled']>>;

function _typeTests(input: string) {
  if (isOrderStatus(input)) {
    const s: OrderStatus = input; // narrowing hoạt động
    void s;
  }
  // @ts-expect-error chưa narrow thì không gán được
  const bad: OrderStatus = input;
  void bad;
}

test('ex05 · runtime', () => {
  assert.equal(isOrderStatus('paid'), true);
  assert.equal(isOrderStatus('PAID'), false);
  assert.equal(isOrderStatus('refunded'), false);
  assert.equal(ORDER_STATUSES.length, 5);
});
