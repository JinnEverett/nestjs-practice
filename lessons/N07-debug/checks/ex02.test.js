import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHub, memoizeLru } from '../answers/ex02.js';

test('ex02 · hub: on/emit theo thứ tự đăng ký, emit trả số handler đã gọi', () => {
  const hub = createHub();
  const log = [];
  hub.on('x', (a) => log.push(`1:${a}`));
  hub.on('x', (a) => log.push(`2:${a}`));
  assert.equal(hub.emit('x', 'v'), 2);
  assert.deepEqual(log, ['1:v', '2:v']);
  assert.equal(hub.emit('khong-co'), 0);
});
test('ex02 · hub: on() trả hàm hủy; hủy nhiều lần vô hại; không còn listener sau khi hủy', () => {
  const hub = createHub();
  let n = 0;
  const off = hub.on('x', () => n++);
  hub.emit('x');
  off();
  off();
  hub.emit('x');
  assert.equal(n, 1);
  assert.equal(hub.listenerCount('x'), 0);
});
test('ex02 · hub: đăng ký/hủy 50 000 lần không để lại listener (không rò)', () => {
  const hub = createHub({ maxListeners: 1_000_000 });
  for (let i = 0; i < 50_000; i++) hub.on('req', () => {})();
  assert.equal(hub.listenerCount('req'), 0);
});
test('ex02 · hub: once chỉ chạy một lần', () => {
  const hub = createHub();
  let n = 0;
  hub.once('x', () => n++);
  hub.emit('x');
  hub.emit('x');
  assert.equal(n, 1);
  assert.equal(hub.listenerCount('x'), 0);
});
test('ex02 · hub: handler ném lỗi không chặn handler khác; lỗi báo qua onError(err, event)', () => {
  const errors = [];
  const hub = createHub({ onError: (e, ev) => errors.push([e.message, ev]) });
  const log = [];
  hub.on('x', () => { throw new Error('hỏng'); });
  hub.on('x', () => log.push('vẫn chạy'));
  assert.equal(hub.emit('x'), 2);
  assert.deepEqual(log, ['vẫn chạy']);
  assert.deepEqual(errors, [['hỏng', 'x']]);
});
test('ex02 · hub: handler tự gỡ mình / gỡ handler khác trong lúc emit không hỏng vòng lặp', () => {
  const hub = createHub();
  const log = [];
  let offB;
  const offA = hub.on('x', () => { log.push('A'); offA(); offB(); });
  offB = hub.on('x', () => log.push('B'));
  hub.on('x', () => log.push('C'));
  hub.emit('x');
  assert.deepEqual(log, ['A', 'C'], 'B đã bị gỡ trước khi tới lượt');
  hub.emit('x');
  assert.deepEqual(log, ['A', 'C', 'C']);
});
test('ex02 · hub: đăng ký trong lúc emit chỉ có hiệu lực từ lần emit sau', () => {
  const hub = createHub();
  const log = [];
  hub.on('x', () => { log.push('A'); hub.on('x', () => log.push('mới')); });
  hub.emit('x');
  assert.deepEqual(log, ['A']);
});
test('ex02 · hub: vượt maxListeners → onWarn đúng một lần cho mỗi event', () => {
  const warns = [];
  const hub = createHub({ maxListeners: 3, onWarn: (ev, n) => warns.push([ev, n]) });
  for (let i = 0; i < 6; i++) hub.on('a', () => {});
  for (let i = 0; i < 5; i++) hub.on('b', () => {});
  assert.deepEqual(warns, [['a', 4], ['b', 4]]);
});
test('ex02 · memoizeLru: cache theo đối số, gọi fn một lần', () => {
  let calls = 0;
  const f = memoizeLru((k) => { calls++; return k * 2; });
  assert.equal(f(2), 4);
  assert.equal(f(2), 4);
  assert.equal(calls, 1);
  assert.equal(f.size(), 1);
});
test('ex02 · memoizeLru: loại phần tử ÍT DÙNG GẦN ĐÂY NHẤT (LRU), không phải cũ nhất', () => {
  let calls = 0;
  const f = memoizeLru((k) => { calls++; return k; }, { max: 3 });
  f(1); f(2); f(3);
  f(1); // 1 vừa được dùng → 2 là ít dùng nhất
  f(4); // vượt → loại 2
  assert.equal(f.size(), 3);
  calls = 0;
  f(1); f(3); f(4);
  assert.equal(calls, 0, '1,3,4 phải còn trong cache');
  f(2);
  assert.equal(calls, 1, '2 đã bị loại');
});
test('ex02 · memoizeLru: size không vượt max sau 10 000 khóa khác nhau', () => {
  const f = memoizeLru((k) => k, { max: 100 });
  for (let i = 0; i < 10_000; i++) f(i);
  assert.equal(f.size(), 100);
  f.clear();
  assert.equal(f.size(), 0);
});
test('ex02 · memoizeLru: promise reject KHÔNG bị cache; resolve thì cache', async () => {
  let calls = 0;
  const f = memoizeLru(async (k) => { calls++; if (calls === 1) throw new Error('lần đầu lỗi'); return `ok-${k}`; });
  await assert.rejects(f('a'), /lần đầu lỗi/);
  await new Promise((r) => setImmediate(r));
  assert.equal(await f('a'), 'ok-a');
  assert.equal(await f('a'), 'ok-a');
  assert.equal(calls, 2);
});
test('ex02 · memoizeLru: không phát unhandledRejection khi cache promise lỗi', async () => {
  const errors = [];
  const onErr = (e) => errors.push(e);
  process.on('unhandledRejection', onErr);
  const f = memoizeLru(async () => { throw new Error('x'); });
  await assert.rejects(f(1));
  await new Promise((r) => setTimeout(r, 30));
  process.off('unhandledRejection', onErr);
  assert.deepEqual(errors, []);
});
test('ex02 · memoizeLru: khóa là chuỗi hóa (1 và "1" cùng khóa)', () => {
  let calls = 0;
  const f = memoizeLru((k) => { calls++; return k; });
  f(1); f('1');
  assert.equal(calls, 1);
});
