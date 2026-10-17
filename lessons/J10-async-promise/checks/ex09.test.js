import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkedSum } from '../answers/ex09.js';

test('ex09 · tổng đúng', async () => {
  assert.equal(await chunkedSum([1, 2, 3, 4, 5], 2), 15);
  assert.equal(await chunkedSum([]), 0);
});
test('ex09 · trả Promise', () => assert.ok(chunkedSum([1]) instanceof Promise));
test('ex09 · nhường event loop: timer chạy trước khi tính xong', async () => {
  const numbers = Array.from({ length: 2_000_000 }, (_, i) => i % 10);
  const events = [];
  const p = chunkedSum(numbers, 10_000).then((sum) => {
    events.push('sum');
    return sum;
  });
  setTimeout(() => events.push('timer'), 0);
  const sum = await p;
  assert.equal(sum, 9_000_000);
  assert.deepEqual(events, ['timer', 'sum']);
});
