import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunk, uniqueBy } from '../answers/ex07.js';

test('ex07 · chunk', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([1, 2], 5), [[1, 2]]);
  assert.deepEqual(chunk([], 3), []);
});
test('ex07 · chunk size sai → RangeError', () => {
  for (const s of [0, -1, 1.5, '2', NaN]) assert.throws(() => chunk([1], s), RangeError, String(s));
});
test('ex07 · uniqueBy giữ lần đầu, giữ thứ tự', () => {
  const r = uniqueBy([{ id: 2, v: 'a' }, { id: 1, v: 'b' }, { id: 2, v: 'c' }, { id: 3, v: 'd' }], (x) => x.id);
  assert.deepEqual(r.map((x) => x.v), ['a', 'b', 'd']);
});
test('ex07 · uniqueBy với key chuỗi đặc biệt và NaN', () => {
  assert.equal(uniqueBy(['__proto__', '__proto__', 'x'], (x) => x).length, 2);
  assert.equal(uniqueBy([NaN, NaN], (x) => x).length, 1);
});
