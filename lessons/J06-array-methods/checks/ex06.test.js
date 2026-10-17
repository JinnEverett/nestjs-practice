import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortBy } from '../answers/ex06.js';

const items = Object.freeze([
  { id: 1, cat: 'B', price: 20 },
  { id: 2, cat: 'A', price: null },
  { id: 3, cat: 'A', price: 50 },
  { id: 4, cat: 'B', price: 20 },
  { id: 5, cat: null, price: 10 },
  { id: 6, cat: 'A', price: 5 },
]);
const ids = (xs) => xs.map((x) => x.id);

test('ex06 · một tiêu chí số asc, null cuối', () => assert.deepEqual(ids(sortBy(items, [{ key: 'price' }])), [6, 5, 1, 4, 3, 2]));
test('ex06 · desc vẫn để null cuối', () => assert.deepEqual(ids(sortBy(items, [{ key: 'price', dir: 'desc' }])), [3, 1, 4, 5, 6, 2]));
test('ex06 · nhiều tiêu chí', () => {
  assert.deepEqual(ids(sortBy(items, [{ key: 'cat' }, { key: 'price', dir: 'desc' }])), [3, 6, 2, 1, 4, 5]);
});
test('ex06 · stable khi bằng nhau', () => assert.deepEqual(ids(sortBy(items, [{ key: 'cat' }])), [2, 3, 6, 1, 4, 5]));
test('ex06 · chuỗi tiếng Việt', () => {
  const r = sortBy([{ n: 'Đào' }, { n: 'Dương' }, { n: 'Anh' }], [{ key: 'n' }]);
  assert.deepEqual(r.map((x) => x.n), ['Anh', 'Dương', 'Đào']);
});
test('ex06 · không mutate', () => {
  const r = sortBy(items, [{ key: 'price' }]);
  assert.notEqual(r, items);
});
