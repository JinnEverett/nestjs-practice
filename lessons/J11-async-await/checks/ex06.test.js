import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withAbortTimeout } from '../answers/ex06.js';

const politeTask = (ms, value, state = {}) => (signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(value), ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      state.cancelled = true;
      reject(signal.reason);
    });
  });

test('ex06 · xong trước hạn', async () => assert.equal(await withAbortTimeout(politeTask(5, 'ok'), 200), 'ok'));
test('ex06 · nhận AbortSignal', async () => {
  await withAbortTimeout(async (signal) => assert.ok(signal instanceof AbortSignal), 100);
});
test('ex06 · quá hạn: hủy task thật + TimeoutError', async () => {
  const state = {};
  await assert.rejects(withAbortTimeout(politeTask(500, 'late', state), 20), (e) => e.name === 'TimeoutError');
  assert.equal(state.cancelled, true);
});
test('ex06 · task phớt lờ signal vẫn bị timeout', async () => {
  const start = performance.now();
  await assert.rejects(withAbortTimeout(() => new Promise((r) => setTimeout(r, 300)), 20), (e) => e.name === 'TimeoutError');
  assert.ok(performance.now() - start < 200);
});
test('ex06 · lỗi của task giữ nguyên', async () => {
  const err = new Error('db');
  await assert.rejects(withAbortTimeout(async () => Promise.reject(err), 100), (e) => e === err);
});
test('ex06 · clearTimeout khi xong sớm', async (t) => {
  const spy = t.mock.method(globalThis, 'clearTimeout');
  await withAbortTimeout(async () => 1, 10_000);
  assert.ok(spy.mock.callCount() >= 1);
});
