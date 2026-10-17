import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchSequential, fetchParallel } from '../answers/ex02.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tracker = () => {
  let active = 0;
  let max = 0;
  const fetchOne = async (id) => {
    active++;
    max = Math.max(max, active);
    await sleep(id === 1 ? 40 : 10);
    active--;
    if (id === 'bad') throw new Error('bad id');
    return `item-${id}`;
  };
  return { fetchOne, max: () => max };
};

test('ex02 · sequential: đúng thứ tự, không bao giờ chạy chồng', async () => {
  const t = tracker();
  assert.deepEqual(await fetchSequential([1, 2, 3], t.fetchOne), ['item-1', 'item-2', 'item-3']);
  assert.equal(t.max(), 1);
});
test('ex02 · parallel: chạy cùng lúc, kết quả theo thứ tự ids', async () => {
  const t = tracker();
  const start = performance.now();
  assert.deepEqual(await fetchParallel([1, 2, 3], t.fetchOne), ['item-1', 'item-2', 'item-3']);
  assert.equal(t.max(), 3);
  assert.ok(performance.now() - start < 55);
});
test('ex02 · lỗi → reject', async () => {
  await assert.rejects(fetchSequential([2, 'bad'], tracker().fetchOne), /bad id/);
  await assert.rejects(fetchParallel([2, 'bad'], tracker().fetchOne), /bad id/);
});
test('ex02 · rỗng', async () => {
  assert.deepEqual(await fetchSequential([], async () => 1), []);
  assert.deepEqual(await fetchParallel([], async () => 1), []);
});
