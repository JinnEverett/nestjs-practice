import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapInChunks } from '../answers/ex04.js';

const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };

test('ex04 · kết quả đúng và đúng thứ tự', async () => {
  assert.deepEqual(await mapInChunks([1, 2, 3, 4], (x) => x * 2), [2, 4, 6, 8]);
});
test('ex04 · mảng rỗng → []', async () => {
  assert.deepEqual(await mapInChunks([], (x) => x), []);
});
test('ex04 · không mutate input', async () => {
  const input = Object.freeze([3, 1, 2]);
  assert.deepEqual(await mapInChunks(input, (x) => x + 1), [4, 2, 3]);
});
test('ex04 · không làm đói event loop: timer 5ms không bị trễ quá 60ms', async () => {
  let last = performance.now();
  let maxGap = 0;
  const t = setInterval(() => {
    const now = performance.now();
    maxGap = Math.max(maxGap, now - last);
    last = now;
  }, 5);
  const items = Array.from({ length: 60 }, (_, i) => i);
  const out = await mapInChunks(items, (x) => { busy(3); return x; }, { budgetMs: 8 }); // ~180ms tổng
  clearInterval(t);
  assert.equal(out.length, 60);
  assert.ok(maxGap < 60, `timer bị trễ ${maxGap.toFixed(0)}ms — chưa nhường loop`);
});
test('ex04 · budgetMs lớn thì không cần nhường, vẫn đúng', async () => {
  const out = await mapInChunks([1, 2, 3], (x) => x, { budgetMs: 1000 });
  assert.deepEqual(out, [1, 2, 3]);
});
test('ex04 · fn ném lỗi → reject và không gọi fn cho phần tử sau', async () => {
  const seen = [];
  await assert.rejects(
    mapInChunks([1, 2, 3, 4], (x) => { seen.push(x); if (x === 2) throw new Error('bad 2'); return x; }),
    /bad 2/,
  );
  assert.deepEqual(seen, [1, 2]);
});
