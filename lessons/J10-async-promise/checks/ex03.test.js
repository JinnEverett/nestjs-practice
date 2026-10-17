import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimeout } from '../answers/ex03.js';

const sleep = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));

test('ex03 · xong trước hạn → kết quả', async () => assert.equal(await withTimeout(sleep(10, 'ok'), 200), 'ok'));
test('ex03 · lỗi trước hạn → lỗi gốc', async () => {
  const err = new Error('db');
  await assert.rejects(withTimeout(Promise.reject(err), 200), (e) => e === err);
});
test('ex03 · quá hạn → TimeoutError', async () => {
  await assert.rejects(withTimeout(sleep(500), 20, 'Gọi cổng thanh toán quá lâu'), (e) => e instanceof Error && e.name === 'TimeoutError' && e.message === 'Gọi cổng thanh toán quá lâu');
  await assert.rejects(withTimeout(sleep(500), 20), /Operation timed out/);
});
test('ex03 · clearTimeout khi xong sớm', async (t) => {
  const spy = t.mock.method(globalThis, 'clearTimeout');
  await withTimeout(Promise.resolve(1), 10_000);
  assert.ok(spy.mock.callCount() >= 1, 'phải clearTimeout timer đang chờ');
  await withTimeout(Promise.reject(new Error('x')), 10_000).catch(() => {});
  assert.ok(spy.mock.callCount() >= 2, 'nhánh lỗi cũng phải clearTimeout');
});
