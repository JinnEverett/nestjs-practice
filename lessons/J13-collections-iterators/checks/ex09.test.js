import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topKFrequent } from '../answers/ex09.js';

test('ex09 · top k, tie theo chữ cái', () => {
  const words = 'áo quần áo giày quần áo mũ giày'.split(' ');
  assert.deepEqual(topKFrequent(words, 3), [
    ['áo', 3],
    ['giày', 2],
    ['quần', 2],
  ]);
});
test('ex09 · generator duyệt một lần', () => {
  function* stream() {
    yield* ['b', 'a', 'b', 'c'];
  }
  assert.deepEqual(topKFrequent(stream(), 2), [
    ['b', 2],
    ['a', 1],
  ]);
});
test('ex09 · k lớn hơn số từ, rỗng', () => {
  assert.equal(topKFrequent(['x'], 10).length, 1);
  assert.deepEqual(topKFrequent([], 3), []);
});
