import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInflightTracker } from '../answers/ex09.js';

const sleep = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));

test('ex09 · track trả lại chính promise, size đếm đúng', async () => {
  const t = createInflightTracker();
  const p = sleep(10, 'x');
  assert.equal(t.track(p), p);
  t.track(sleep(20));
  assert.equal(t.size, 2);
  await sleep(30);
  assert.equal(t.size, 0);
});
test('ex09 · promise reject cũng được gỡ, không gây unhandled', async () => {
  const t = createInflightTracker();
  const p = t.track(Promise.reject(new Error('x')));
  await assert.rejects(p);
  await sleep(0);
  assert.equal(t.size, 0);
});
test('ex09 · drain đợi tất cả, kể cả cái thêm trong lúc drain', async () => {
  const t = createInflightTracker();
  const done = [];
  t.track(sleep(20).then(() => done.push('a')));
  const draining = t.drain(1000);
  await sleep(10);
  t.track(sleep(30).then(() => done.push('b')));
  await draining;
  assert.deepEqual(done, ['a', 'b']);
});
test('ex09 · drain khi rỗng resolve ngay', async () => {
  await createInflightTracker().drain(10);
});
test('ex09 · lỗi của việc đang chạy không làm drain lỗi', async () => {
  const t = createInflightTracker();
  t.track(sleep(5).then(() => Promise.reject(new Error('boom')))).catch(() => {});
  await t.drain(500);
});
test('ex09 · drain quá hạn → TimeoutError', async () => {
  const t = createInflightTracker();
  t.track(sleep(300));
  await assert.rejects(t.drain(20), (e) => e.name === 'TimeoutError');
});
