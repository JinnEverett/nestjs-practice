import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { runWithContext, getContext, setContextValue, createContextLogger } from '../answers/ex05.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function spyLogger() {
  const calls = [];
  const l = {};
  for (const level of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) l[level] = (msg, fields) => calls.push({ level, msg, fields });
  return { logger: l, calls };
}

test('ex05 · ngoài ngữ cảnh: getContext() = undefined', () => {
  assert.equal(getContext(), undefined);
});
test('ex05 · runWithContext trả kết quả của fn (sync và async)', async () => {
  assert.equal(runWithContext({ a: 1 }, () => 42), 42);
  assert.equal(await runWithContext({ a: 1 }, async () => 'ok'), 'ok');
});
test('ex05 · getContext trả bản sao: sửa bản sao không ảnh hưởng ngữ cảnh', () => {
  runWithContext({ a: 1 }, () => {
    const c = getContext();
    c.a = 999;
    assert.equal(getContext().a, 1);
  });
});
test('ex05 · ngữ cảnh sống qua await, setTimeout, Promise.all, queueMicrotask', async () => {
  await runWithContext({ requestId: 'r1' }, async () => {
    await sleep(5);
    assert.equal(getContext().requestId, 'r1');
    await new Promise((r) => setTimeout(r, 5));
    assert.equal(getContext().requestId, 'r1');
    const [a, b] = await Promise.all([sleep(3).then(() => getContext().requestId), (async () => { await sleep(1); return getContext().requestId; })()]);
    assert.deepEqual([a, b], ['r1', 'r1']);
    await new Promise((r) => queueMicrotask(() => { assert.equal(getContext().requestId, 'r1'); r(); }));
  });
});
test('ex05 · lồng nhau gộp; thoát ra thì quay lại ngữ cảnh ngoài', () => {
  runWithContext({ requestId: 'r1', who: 'ngoài' }, () => {
    runWithContext({ who: 'trong', extra: 1 }, () => {
      assert.deepEqual(getContext(), { requestId: 'r1', who: 'trong', extra: 1 });
    });
    assert.deepEqual(getContext(), { requestId: 'r1', who: 'ngoài' });
  });
  assert.equal(getContext(), undefined);
});
test('ex05 · setContextValue bổ sung vào ngữ cảnh hiện tại và thấy được ở các hàm gọi sau', async () => {
  await runWithContext({ requestId: 'r1' }, async () => {
    setContextValue('userId', 7);
    await sleep(2);
    assert.deepEqual(getContext(), { requestId: 'r1', userId: 7 });
  });
});
test('ex05 · setContextValue ở ngoài ngữ cảnh → Error("No active context")', () => {
  assert.throws(() => setContextValue('a', 1), { message: 'No active context' });
});
test('ex05 · setContextValue trong ngữ cảnh lồng không rò ra ngữ cảnh ngoài', () => {
  runWithContext({ a: 1 }, () => {
    runWithContext({}, () => setContextValue('b', 2));
    assert.deepEqual(getContext(), { a: 1 });
  });
});
test('ex05 · 50 request đồng thời không lẫn ngữ cảnh', async () => {
  const seen = [];
  await Promise.all(Array.from({ length: 50 }, (_, i) => runWithContext({ requestId: `req-${i}` }, async () => {
    await sleep(Math.random() * 20);
    seen.push([`req-${i}`, getContext().requestId]);
    await sleep(Math.random() * 20);
    setContextValue('step', i);
    await sleep(Math.random() * 10);
    seen.push([`req-${i}`, getContext().requestId, getContext().step === i]);
  })));
  assert.equal(seen.length, 100);
  for (const [want, got, stepOk] of seen) {
    assert.equal(got, want);
    if (stepOk !== undefined) assert.equal(stepOk, true);
  }
});
test('ex05 · createContextLogger gắn ngữ cảnh tại thời điểm ghi, fields ghi đè ngữ cảnh', async () => {
  const { logger, calls } = spyLogger();
  const log = createContextLogger(logger);
  log.info('ngoài ngữ cảnh', { x: 1 });
  await runWithContext({ requestId: 'r9', userId: 1 }, async () => {
    log.info('trong', { x: 2 });
    setContextValue('userId', 2);
    await sleep(2);
    log.error('sau', { requestId: 'ghi-đè' });
  });
  assert.deepEqual(calls[0], { level: 'info', msg: 'ngoài ngữ cảnh', fields: { x: 1 } });
  assert.deepEqual(calls[1].fields, { requestId: 'r9', userId: 1, x: 2 });
  assert.deepEqual(calls[2], { level: 'error', msg: 'sau', fields: { requestId: 'ghi-đè', userId: 2 } });
});
test('ex05 · createContextLogger có đủ 6 level', () => {
  const { logger, calls } = spyLogger();
  const log = createContextLogger(logger);
  for (const l of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) log[l]('m');
  assert.deepEqual(calls.map((c) => c.level), ['trace', 'debug', 'info', 'warn', 'error', 'fatal']);
});
test('ex05 · callback của EventEmitter chạy trong ngữ cảnh của nơi gọi emit', () => {
  const em = new EventEmitter();
  let got;
  em.on('x', () => { got = getContext()?.requestId; });
  runWithContext({ requestId: 'e1' }, () => em.emit('x'));
  assert.equal(got, 'e1');
});
