import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMain } from '../answers/ex03.js';

const harness = () => {
  const calls = [];
  return { calls, exit: (c) => calls.push(['exit', c]), log: (e) => calls.push(['log', e]) };
};

test('ex03 · thành công → exit(0) đúng một lần, trả 0', async () => {
  const h = harness();
  const code = await runMain(async () => {}, h);
  assert.equal(code, 0);
  assert.deepEqual(h.calls, [['exit', 0]]);
});
test('ex03 · main đồng bộ cũng được', async () => {
  const h = harness();
  assert.equal(await runMain(() => 42, h), 0);
});
test('ex03 · ném lỗi → log rồi exit(1)', async () => {
  const h = harness();
  const err = new Error('hỏng');
  const code = await runMain(async () => { throw err; }, h);
  assert.equal(code, 1);
  assert.deepEqual(h.calls, [['log', err], ['exit', 1]]);
});
test('ex03 · main ném đồng bộ cũng được bắt', async () => {
  const h = harness();
  assert.equal(await runMain(() => { throw new Error('sync'); }, h), 1);
  assert.equal(h.calls.filter(([k]) => k === 'exit').length, 1);
});
test('ex03 · err.exitCode hợp lệ (1..255) được dùng; không hợp lệ → 1', async () => {
  for (const [exitCode, want] of [[2, 2], [255, 255], [0, 1], [256, 1], [-3, 1], [1.5, 1], ['3', 1], [undefined, 1]]) {
    const h = harness();
    const code = await runMain(async () => { throw Object.assign(new Error('x'), { exitCode }); }, h);
    assert.equal(code, want, String(exitCode));
    assert.deepEqual(h.calls.at(-1), ['exit', want]);
  }
});
test('ex03 · log tự ném lỗi vẫn phải exit', async () => {
  const calls = [];
  const code = await runMain(async () => { throw new Error('a'); }, {
    exit: (c) => calls.push(c),
    log: () => { throw new Error('log hỏng'); },
  });
  assert.equal(code, 1);
  assert.deepEqual(calls, [1]);
});
test('ex03 · throw giá trị không phải Error', async () => {
  const h = harness();
  assert.equal(await runMain(async () => { throw 'chuỗi'; }, h), 1);
  assert.deepEqual(h.calls, [['log', 'chuỗi'], ['exit', 1]]);
});
test('ex03 · chờ main xong (async) rồi mới exit', async () => {
  const h = harness();
  let finished = false;
  await runMain(async () => { await new Promise((r) => setTimeout(r, 30)); finished = true; }, h);
  assert.equal(finished, true);
});
