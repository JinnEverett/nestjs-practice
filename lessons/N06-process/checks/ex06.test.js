import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { fibInWorker } from '../answers/ex06.js';

test('ex06 · kết quả đúng', async () => {
  assert.equal(await fibInWorker(0), 0);
  assert.equal(await fibInWorker(1), 1);
  assert.equal(await fibInWorker(10), 55);
  assert.equal(await fibInWorker(30), 832040);
});
test('ex06 · n không hợp lệ → RangeError, không tạo worker', async () => {
  for (const bad of [-1, 1.5, 51, NaN, '10', null, undefined]) {
    await assert.rejects(fibInWorker(bad), RangeError, String(bad));
  }
});
test('ex06 · event loop KHÔNG bị chặn khi worker tính fib(38)', async () => {
  let last = performance.now();
  let maxGap = 0;
  const timer = setInterval(() => {
    const now = performance.now();
    maxGap = Math.max(maxGap, now - last);
    last = now;
  }, 10);
  const t0 = performance.now();
  const result = await fibInWorker(38);
  const took = performance.now() - t0;
  clearInterval(timer);
  assert.equal(result, 39088169);
  assert.ok(maxGap < 120, `timer trễ ${maxGap.toFixed(0)}ms trong khi worker tính (${took.toFixed(0)}ms)`);
});
test('ex06 · nhiều lời gọi chạy song song (≥ 4 core): 3 × fib(36) < 2.5× một lần', async (t) => {
  if (availableParallelism() < 4) return t.skip('máy < 4 core');
  const t1 = performance.now();
  await fibInWorker(36);
  const one = performance.now() - t1;
  const t3 = performance.now();
  const rs = await Promise.all([fibInWorker(36), fibInWorker(36), fibInWorker(36)]);
  const three = performance.now() - t3;
  assert.deepEqual(rs, [14930352, 14930352, 14930352]);
  assert.ok(three < one * 2.5, `1 lần ${one.toFixed(0)}ms, 3 lần song song ${three.toFixed(0)}ms`);
});
test('ex06 · có ghi số đo trong answers/ex06.md', () => {
  const url = new URL('../answers/ex06.md', import.meta.url);
  assert.ok(existsSync(url), 'thiếu answers/ex06.md');
  assert.ok(readFileSync(url, 'utf8').trim().length > 30);
});
