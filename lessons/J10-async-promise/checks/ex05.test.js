import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUserSummary } from '../answers/ex05.js';

const later = (ms, fn) => setTimeout(fn, ms);
const makeApi = ({ failPaymentsFor } = {}) => ({
  getUser: (id, cb) => later(5, () => (id === 404 ? cb(new Error('user not found')) : cb(null, { id, name: 'An' }))),
  getOrders: (userId, cb) => later(5, () => cb(null, userId === 2 ? [] : [{ id: 1 }, { id: 2 }, { id: 3 }])),
  getPayments: (orderId, cb) =>
    later(60, () =>
      orderId === failPaymentsFor
        ? cb(new Error(`payments ${orderId} failed`))
        : cb(null, [
            { amount: 100 * orderId, status: 'succeeded' },
            { amount: 999, status: 'failed' },
          ]),
    ),
});

test('ex05 · trả Promise với tổng đúng', async () => {
  const p = getUserSummary(1, makeApi());
  assert.ok(p instanceof Promise);
  assert.deepEqual(await p, { name: 'An', orderCount: 3, totalPaid: 600 });
});
test('ex05 · không có đơn', async () => {
  assert.deepEqual(await getUserSummary(2, makeApi()), { name: 'An', orderCount: 0, totalPaid: 0 });
});
test('ex05 · lỗi ở bước đầu', async () => {
  await assert.rejects(getUserSummary(404, makeApi()), /user not found/);
});
test('ex05 · lỗi khi lấy payment KHÔNG bị bỏ qua', async () => {
  await assert.rejects(getUserSummary(1, makeApi({ failPaymentsFor: 2 })), /payments 2 failed/);
});
test('ex05 · payment lấy song song (3 × 60ms phải < 150ms)', async () => {
  const start = performance.now();
  await getUserSummary(1, makeApi());
  const ms = performance.now() - start;
  assert.ok(ms < 150, `mất ${ms.toFixed(0)}ms — đang lấy tuần tự?`);
});
