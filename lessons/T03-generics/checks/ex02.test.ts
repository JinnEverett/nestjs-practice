import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { groupBy } from '../answers/ex02.js';

interface Order {
  id: number;
  status: 'paid' | 'pending';
}
const orders: Order[] = [
  { id: 1, status: 'paid' },
  { id: 2, status: 'pending' },
  { id: 3, status: 'paid' },
];
const m = groupBy(orders, (o) => o.status);
type _m = Expect<Equal<typeof m, Map<'paid' | 'pending', Order[]>>>;
const byParity = groupBy([1, 2, 3], (n) => n % 2 === 0);
type _b = Expect<Equal<typeof byParity, Map<boolean, number[]>>>;

test('ex02 · nhóm đúng, giữ thứ tự', () => {
  assert.deepEqual(m.get('paid')?.map((o) => o.id), [1, 3]);
  assert.deepEqual([...m.keys()], ['paid', 'pending']);
  assert.deepEqual(byParity.get(false), [1, 3]);
});
