import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { installSignalHandlers } from '../answers/ex08.js';
import { createLifecycle } from '../answers/ex04.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function setup({ lifecycle = createLifecycle(), forceAfterMs = 10_000 } = {}) {
  const proc = new EventEmitter();
  const exits = [];
  const logs = [];
  const handle = installSignalHandlers(proc, lifecycle, { exit: (c) => exits.push(c), forceAfterMs, log: (e) => logs.push(e) });
  return { proc, exits, logs, handle, lifecycle };
}

test('ex08 · SIGTERM → shutdown theo thứ tự ngược rồi exit(0)', async () => {
  const order = [];
  const lc = createLifecycle().register('db', () => { order.push('db'); }).register('http', () => { order.push('http'); });
  const { proc, exits } = setup({ lifecycle: lc });
  proc.emit('SIGTERM');
  await sleep(50);
  assert.deepEqual(order, ['http', 'db']);
  assert.deepEqual(exits, [0]);
});
test('ex08 · lý do shutdown là tên tín hiệu', async () => {
  let reason;
  const lc = createLifecycle().register('x', (r) => { reason = r; });
  const { proc } = setup({ lifecycle: lc });
  proc.emit('SIGINT');
  await sleep(30);
  assert.equal(reason, 'SIGINT');
});
test('ex08 · có tài nguyên đóng lỗi → exit(1)', async () => {
  const lc = createLifecycle().register('bad', () => { throw new Error('x'); });
  const { proc, exits } = setup({ lifecycle: lc });
  proc.emit('SIGTERM');
  await sleep(50);
  assert.deepEqual(exits, [1]);
});
test('ex08 · tín hiệu lần hai trong lúc đang shutdown → exit(1) ngay', async () => {
  const lc = createLifecycle().register('slow', () => sleep(400));
  const { proc, exits } = setup({ lifecycle: lc });
  proc.emit('SIGTERM');
  await sleep(50);
  assert.deepEqual(exits, []);
  proc.emit('SIGINT');
  await sleep(20);
  assert.deepEqual(exits, [1]);
  await sleep(500);
  assert.deepEqual(exits, [1], 'exit chỉ được gọi một lần');
});
test('ex08 · quá forceAfterMs → exit(1)', async () => {
  const lc = createLifecycle({ timeoutMs: 60_000 }).register('hang', () => new Promise(() => {}));
  const { proc, exits } = setup({ lifecycle: lc, forceAfterMs: 80 });
  proc.emit('SIGTERM');
  await sleep(200);
  assert.deepEqual(exits, [1]);
});
test('ex08 · shutdown xong sớm thì timer ép thoát bị hủy (không exit thêm lần nữa)', async () => {
  const { proc, exits } = setup({ forceAfterMs: 100 });
  proc.emit('SIGTERM');
  await sleep(250);
  assert.deepEqual(exits, [0]);
});
test('ex08 · uncaughtException → log, shutdown("uncaughtException"), exit(1) dù shutdown OK', async () => {
  let reason;
  const lc = createLifecycle().register('x', (r) => { reason = r; });
  const { proc, exits, logs } = setup({ lifecycle: lc });
  const err = new Error('lỗi không bắt');
  proc.emit('uncaughtException', err);
  await sleep(50);
  assert.equal(reason, 'uncaughtException');
  assert.deepEqual(exits, [1]);
  assert.equal(logs[0], err);
});
test('ex08 · unhandledRejection tương tự', async () => {
  let reason;
  const lc = createLifecycle().register('x', (r) => { reason = r; });
  const { proc, exits } = setup({ lifecycle: lc });
  proc.emit('unhandledRejection', new Error('reject'));
  await sleep(50);
  assert.equal(reason, 'unhandledRejection');
  assert.deepEqual(exits, [1]);
});
test('ex08 · uninstall gỡ mọi listener', async () => {
  const { proc, exits, handle } = setup();
  assert.ok(proc.listenerCount('SIGTERM') >= 1);
  handle.uninstall();
  for (const ev of ['SIGTERM', 'SIGINT', 'uncaughtException', 'unhandledRejection']) assert.equal(proc.listenerCount(ev), 0, ev);
  proc.emit('SIGTERM'); // không có listener nào → không làm gì
  await sleep(30);
  assert.deepEqual(exits, []);
});
test('ex08 · signals tùy biến', async () => {
  const proc = new EventEmitter();
  const exits = [];
  installSignalHandlers(proc, createLifecycle(), { exit: (c) => exits.push(c), signals: ['SIGUSR2'] });
  assert.equal(proc.listenerCount('SIGTERM'), 0);
  proc.emit('SIGUSR2');
  await sleep(30);
  assert.deepEqual(exits, [0]);
});
