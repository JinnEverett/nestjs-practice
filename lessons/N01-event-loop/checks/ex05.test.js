import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { benchPbkdf2 } from '../answers/ex05.js';

test('ex05 · trả [{n, ms}] đúng thứ tự counts', async () => {
  const r = await benchPbkdf2([1, 4, 8]);
  assert.deepEqual(r.map((x) => x.n), [1, 4, 8]);
  for (const x of r) assert.ok(x.ms > 0 && Number.isFinite(x.ms));
});
test('ex05 · chạy SONG SONG: 4 tác vụ không chậm hơn 3.2× một tác vụ (máy ≥ 4 core)', async (t) => {
  if (availableParallelism() < 4) return t.skip('máy < 4 core');
  const [a, b] = await benchPbkdf2([1, 4]);
  assert.ok(b.ms < a.ms * 3.2, `n=1: ${a.ms.toFixed(0)}ms, n=4: ${b.ms.toFixed(0)}ms — đang chạy tuần tự?`);
});
test('ex05 · 8 tác vụ lâu hơn 4 tác vụ (xếp hàng sau 4 thread của pool)', async (t) => {
  if (availableParallelism() < 4) return t.skip('máy < 4 core');
  const [a, b] = await benchPbkdf2([4, 8]);
  assert.ok(b.ms > a.ms * 1.25, `n=4: ${a.ms.toFixed(0)}ms, n=8: ${b.ms.toFixed(0)}ms`);
});
test('ex05 · có nhận xét trong answers/ex05.md', () => {
  const url = new URL('../answers/ex05.md', import.meta.url);
  assert.ok(existsSync(url), 'thiếu answers/ex05.md');
  const s = readFileSync(url, 'utf8');
  assert.ok(s.trim().length > 40, 'nhận xét quá ngắn');
  assert.match(s, /thread ?pool|UV_THREADPOOL_SIZE/i);
});
