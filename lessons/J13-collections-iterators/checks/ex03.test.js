import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { range } from '../answers/ex03.js';

test('ex03 · tăng', () => {
  assert.deepEqual([...range(0, 5)], [0, 1, 2, 3, 4]);
  assert.deepEqual([...range(0, 10, 3)], [0, 3, 6, 9]);
});
test('ex03 · lùi', () => assert.deepEqual([...range(5, 0, -2)], [5, 3, 1]));
test('ex03 · rỗng', () => {
  assert.deepEqual([...range(3, 3)], []);
  assert.deepEqual([...range(5, 0)], []);
});
test('ex03 · duyệt nhiều lần', () => {
  const r = range(1, 4);
  assert.deepEqual([...r], [1, 2, 3]);
  assert.deepEqual([...r], [1, 2, 3]);
  assert.deepEqual(Array.from(r, (x) => x * 2), [2, 4, 6]);
});
test('ex03 · step 0', () => assert.throws(() => range(0, 5, 0), RangeError));
test('ex03 · không dùng generator', () => {
  const src = readFileSync(new URL('../answers/ex03.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  assert.equal(/function\s*\*/.test(src), false);
});
