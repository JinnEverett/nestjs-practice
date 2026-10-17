import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { fromEvent } from '../answers/ex06.js';

const total = (em) => em.eventNames().reduce((n, name) => n + em.listenerCount(name), 0);

test('ex06 · resolve payload đầu tiên, gỡ listener', async () => {
  const em = new EventEmitter();
  const p = fromEvent(em, 'ready');
  em.emit('ready', { port: 3000 });
  em.emit('ready', { port: 9999 });
  assert.deepEqual(await p, { port: 3000 });
  assert.equal(total(em), 0);
});
test('ex06 · error → reject, gỡ listener', async () => {
  const em = new EventEmitter();
  const p = fromEvent(em, 'ready');
  const err = new Error('EADDRINUSE');
  em.emit('error', err);
  await assert.rejects(p, (e) => e === err);
  assert.equal(total(em), 0);
});
test('ex06 · timeout → TimeoutError, gỡ listener', async () => {
  const em = new EventEmitter();
  await assert.rejects(fromEvent(em, 'ready', { timeoutMs: 20 }), (e) => e.name === 'TimeoutError');
  assert.equal(total(em), 0);
});
test('ex06 · resolve trước timeout thì xóa timer', async (t) => {
  const spy = t.mock.method(globalThis, 'clearTimeout');
  const em = new EventEmitter();
  const p = fromEvent(em, 'ready', { timeoutMs: 10_000 });
  em.emit('ready', 1);
  await p;
  assert.ok(spy.mock.callCount() >= 1);
});
