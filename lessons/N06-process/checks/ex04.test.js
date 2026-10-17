import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLifecycle } from '../answers/ex04.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('ex04 · đóng theo thứ tự NGƯỢC đăng ký, tuần tự', async () => {
  const order = [];
  const lc = createLifecycle();
  lc.register('db', async () => { order.push('db:start'); await sleep(20); order.push('db:end'); })
    .register('queue', async () => { order.push('queue:start'); await sleep(10); order.push('queue:end'); })
    .register('http', () => { order.push('http'); });
  const report = await lc.shutdown('SIGTERM');
  assert.deepEqual(order, ['http', 'queue:start', 'queue:end', 'db:start', 'db:end']);
  assert.deepEqual(report.map((r) => r.name), ['http', 'queue', 'db']);
  assert.ok(report.every((r) => r.ok === true && typeof r.ms === 'number'));
});
test('ex04 · closeFn nhận lý do', async () => {
  let got;
  const lc = createLifecycle().register('x', (reason) => { got = reason; });
  await lc.shutdown('SIGINT');
  assert.equal(got, 'SIGINT');
});
test('ex04 · một closeFn ném lỗi → ok:false + error, vẫn đóng cái còn lại', async () => {
  const closed = [];
  const lc = createLifecycle()
    .register('a', () => closed.push('a'))
    .register('b', () => { throw new Error('đóng b hỏng'); })
    .register('c', () => closed.push('c'));
  const report = await lc.shutdown('x');
  assert.deepEqual(closed, ['c', 'a']);
  assert.deepEqual(report.map((r) => [r.name, r.ok]), [['c', true], ['b', false], ['a', true]]);
  assert.match(report[1].error.message, /đóng b hỏng/);
});
test('ex04 · closeFn async reject cũng ghi nhận', async () => {
  const lc = createLifecycle().register('a', async () => { throw new Error('reject'); });
  const [r] = await lc.shutdown('x');
  assert.equal(r.ok, false);
});
test('ex04 · timeout mỗi tài nguyên: ghi lỗi đúng message và đi tiếp', async () => {
  const lc = createLifecycle({ timeoutMs: 40 })
    .register('fast', () => {})
    .register('hang', () => new Promise(() => {}));
  const t0 = performance.now();
  const report = await lc.shutdown('x');
  assert.ok(performance.now() - t0 < 500);
  assert.deepEqual(report.map((r) => [r.name, r.ok]), [['hang', false], ['fast', true]]);
  assert.equal(report[0].error.message, 'Timeout closing "hang" after 40ms');
});
test('ex04 · shutdown gọi nhiều lần → cùng một Promise, closeFn chạy đúng một lần', async () => {
  let n = 0;
  const lc = createLifecycle().register('a', () => { n++; });
  const p1 = lc.shutdown('x');
  const p2 = lc.shutdown('y');
  assert.equal(p1, p2);
  await p1;
  await lc.shutdown('z');
  assert.equal(n, 1);
});
test('ex04 · register sau shutdown → ném', async () => {
  const lc = createLifecycle();
  lc.shutdown('x');
  assert.throws(() => lc.register('late', () => {}), { message: 'Lifecycle already shutting down' });
});
test('ex04 · không có tài nguyên → []', async () => {
  assert.deepEqual(await createLifecycle().shutdown('x'), []);
});
test('ex04 · timer timeout được dọn (không giữ process): hoàn tất nhanh dù timeoutMs lớn', async () => {
  const lc = createLifecycle({ timeoutMs: 60_000 }).register('a', () => {});
  const t0 = performance.now();
  await lc.shutdown('x');
  assert.ok(performance.now() - t0 < 200);
});
