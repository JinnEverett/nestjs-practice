import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pLimit } from '../answers/ex03.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('ex03 · không vượt concurrency, chạy hết, đúng kết quả', async () => {
  const limit = pLimit(3);
  let active = 0;
  let max = 0;
  const job = async (i) => {
    active++;
    max = Math.max(max, active);
    await sleep(5 + (i % 3) * 5);
    active--;
    return i * 2;
  };
  const results = await Promise.all(Array.from({ length: 20 }, (_, i) => limit(job, i)));
  assert.equal(max, 3);
  assert.deepEqual(results, Array.from({ length: 20 }, (_, i) => i * 2));
});
test('ex03 · activeCount / pendingCount', async () => {
  const limit = pLimit(2);
  const gates = [];
  const ps = Array.from({ length: 5 }, () => limit(() => new Promise((r) => gates.push(r))));
  await sleep(0);
  assert.equal(limit.activeCount, 2);
  assert.equal(limit.pendingCount, 3);
  gates.forEach((g) => g());
  await sleep(0);
  gates.forEach((g) => g());
  await sleep(0);
  gates.forEach((g) => g());
  await Promise.all(ps);
  assert.equal(limit.activeCount, 0);
  assert.equal(limit.pendingCount, 0);
});
test('ex03 · lỗi không làm kẹt hàng đợi', async () => {
  const limit = pLimit(1);
  const a = limit(async () => {
    throw new Error('async fail');
  });
  const b = limit(() => {
    throw new Error('sync fail');
  });
  const c = limit(async () => 'ok');
  await assert.rejects(a, /async fail/);
  await assert.rejects(b, /sync fail/);
  assert.equal(await c, 'ok');
});
test('ex03 · truyền tham số', async () => assert.equal(await pLimit(1)((a, b) => a + b, 2, 3), 5));
test('ex03 · concurrency sai', () => {
  for (const c of [0, -1, 1.5, '2']) assert.throws(() => pLimit(c), RangeError);
});
