import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapWithConcurrency } from '../answers/ex04.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('ex04 · đúng thứ tự, giới hạn đồng thời', async () => {
  let active = 0;
  let max = 0;
  const r = await mapWithConcurrency(
    [30, 10, 20, 5, 15],
    async (ms, i) => {
      active++;
      max = Math.max(max, active);
      await sleep(ms);
      active--;
      return `${i}:${ms}`;
    },
    2,
  );
  assert.deepEqual(r, ['0:30', '1:10', '2:20', '3:5', '4:15']);
  assert.equal(max, 2);
});
test('ex04 · lỗi → reject, không bắt đầu thêm item', async () => {
  const started = [];
  await assert.rejects(
    mapWithConcurrency(
      [1, 2, 3, 4, 5, 6],
      async (x) => {
        started.push(x);
        await sleep(10);
        if (x === 2) throw new Error('item 2 hỏng');
        return x;
      },
      2,
    ),
    /item 2 hỏng/,
  );
  await sleep(50);
  assert.ok(started.length <= 3, `đã bắt đầu ${started.length} item: ${started}`);
});
test('ex04 · rỗng và concurrency lớn hơn số item', async () => {
  assert.deepEqual(await mapWithConcurrency([], async (x) => x, 3), []);
  assert.deepEqual(await mapWithConcurrency([1, 2], async (x) => x * 10, 10), [10, 20]);
});
