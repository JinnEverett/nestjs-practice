import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processOrders } from '../answers/ex07.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const charge = async (order) => {
  await sleep(order.ms);
  if (order.fail) throw new Error(`card declined ${order.id}`);
};

test('ex07 · đợi tất cả, gom kết quả theo thứ tự', async () => {
  const orders = [
    { id: 1, ms: 30 },
    { id: 2, ms: 10, fail: true },
    { id: 3, ms: 5 },
    { id: 4, ms: 20, fail: true },
  ];
  assert.deepEqual(await processOrders(orders, charge), {
    succeeded: [1, 3],
    failed: [
      { id: 2, reason: 'card declined 2' },
      { id: 4, reason: 'card declined 4' },
    ],
  });
});
test('ex07 · song song', async () => {
  const start = performance.now();
  await processOrders(Array.from({ length: 5 }, (_, i) => ({ id: i, ms: 40 })), charge);
  const ms = performance.now() - start;
  assert.ok(ms >= 35 && ms < 120, `${ms.toFixed(0)}ms`);
});
test('ex07 · rỗng', async () => assert.deepEqual(await processOrders([], charge), { succeeded: [], failed: [] }));
