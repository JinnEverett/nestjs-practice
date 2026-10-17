import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { countLines } from '../answers/ex03.js';
import { tempDir, peakRssDelta, writeRepeated, MB } from '../_lib/mem.js';

let tmp;
before(async () => { tmp = await tempDir(); });
after(() => tmp.cleanup());

const file = async (name, content) => {
  const p = join(tmp.dir, name);
  await writeFile(p, content);
  return p;
};

test('ex03 · file rỗng → 0', async () => assert.equal(await countLines(await file('e', '')), 0));
test('ex03 · một dòng không xuống dòng → 1', async () => assert.equal(await countLines(await file('a', 'abc')), 1));
test('ex03 · một dòng có xuống dòng cuối → 1', async () => assert.equal(await countLines(await file('b', 'abc\n')), 1));
test('ex03 · ba dòng, có và không có \\n cuối', async () => {
  assert.equal(await countLines(await file('c', 'a\nb\nc')), 3);
  assert.equal(await countLines(await file('d', 'a\nb\nc\n')), 3);
});
test('ex03 · dòng trống tính là dòng', async () => {
  assert.equal(await countLines(await file('f', '\n\n\n')), 3);
});
test('ex03 · file lớn ~80MB: đúng số dòng và RSS tăng < 60MB', async () => {
  const p = join(tmp.dir, 'big.txt');
  const line = `${'x'.repeat(63)}\n`; // 64 byte
  const block = Buffer.from(line.repeat(16384)); // 1MB, 16384 dòng
  await writeRepeated(p, block, 80);
  let n;
  const delta = await peakRssDelta(async () => { n = await countLines(p); });
  assert.equal(n, 16384 * 80);
  assert.ok(delta < 60 * MB, `RSS tăng ${(delta / MB).toFixed(0)}MB — có đang đọc cả file vào bộ nhớ không?`);
});
