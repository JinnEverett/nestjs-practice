import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { mergeDefaults, sortByKey } from '../answers/ex06.js';

const defaults = { page: 1, limit: 20, sort: 'id' as string };
const merged = mergeDefaults(defaults, { limit: 50, sort: undefined });
type _m = Expect<Equal<typeof merged, { page: number; limit: number; sort: string }>>;

interface P {
  name: string;
  price: number;
  active: boolean;
  tags: string[];
}
const ps: P[] = [
  { name: 'B', price: 2, active: true, tags: [] },
  { name: 'A', price: 3, active: false, tags: [] },
  { name: 'C', price: 1, active: true, tags: [] },
];

function _typeTests() {
  // @ts-expect-error boolean không sort được
  sortByKey(ps, 'active');
  // @ts-expect-error mảng không sort được
  sortByKey(ps, 'tags');
  // @ts-expect-error key không tồn tại
  mergeDefaults(defaults, { other: 1 });
}

test('ex06 · mergeDefaults bỏ undefined', () => assert.deepEqual(merged, { page: 1, limit: 50, sort: 'id' }));
test('ex06 · sortByKey', () => {
  assert.deepEqual(sortByKey(ps, 'price').map((p) => p.name), ['C', 'B', 'A']);
  assert.deepEqual(sortByKey(ps, 'name', 'desc').map((p) => p.name), ['C', 'B', 'A']);
  assert.equal(ps[0]!.name, 'B');
});
