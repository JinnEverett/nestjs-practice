import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { action, type PayloadOf } from '../answers/ex07.js';

type _p = Expect<Equal<PayloadOf<'remove'>, { productId: number }>>;
const add = action('add', { productId: 1, qty: 2 });
type _a = Expect<Equal<typeof add, { type: 'add'; productId: number; qty: number }>>;

function _typeTests() {
  // @ts-expect-error thiếu qty
  action('add', { productId: 1 });
}

test('ex07 · action', () => {
  assert.deepEqual(add, { type: 'add', productId: 1, qty: 2 });
  assert.deepEqual(action('clear', {}), { type: 'clear' });
});
