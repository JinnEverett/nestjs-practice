import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tail } from '../answers/ex08.js';
import { tempDir, peakRssDelta, writeRepeated, MB } from '../_lib/mem.js';

let tmp;
before(async () => { tmp = await tempDir(); });
after(() => tmp.cleanup());

const file = async (name, content) => {
  const p = join(tmp.dir, name);
  await writeFile(p, content);
  return p;
};

test('ex08 · n dòng cuối, có và không có \\n cuối cho cùng kết quả', async () => {
  assert.deepEqual(await tail(await file('a', 'a\nb\nc\nd\n'), 2), ['c', 'd']);
  assert.deepEqual(await tail(await file('b', 'a\nb\nc\nd'), 2), ['c', 'd']);
});
test('ex08 · n lớn hơn số dòng → tất cả', async () => {
  assert.deepEqual(await tail(await file('c', 'a\nb\n'), 10), ['a', 'b']);
});
test('ex08 · n = 0 → []', async () => assert.deepEqual(await tail(await file('d', 'a\nb\n'), 0), []));
test('ex08 · file rỗng → []', async () => assert.deepEqual(await tail(await file('e', ''), 3), []));
test('ex08 · CRLF: bỏ \\r', async () => {
  assert.deepEqual(await tail(await file('f', 'a\r\nb\r\nc\r\n'), 2), ['b', 'c']);
});
test('ex08 · giữ dòng trống ở giữa', async () => {
  assert.deepEqual(await tail(await file('g', 'a\n\nb\n'), 3), ['a', '', 'b']);
});
test('ex08 · dòng dài hơn một khối đọc (200KB)', async () => {
  const long = 'z'.repeat(200 * 1024);
  const p = await file('h', `đầu\n${long}\ncuối\n`);
  const r = await tail(p, 2);
  assert.equal(r.length, 2);
  assert.equal(r[0], long);
  assert.equal(r[1], 'cuối');
});
test('ex08 · ký tự UTF-8 nhiều byte nằm đúng biên khối 64KB', async () => {
  // tạo file mà ký tự "Đ" (2 byte) nằm chắc chắn qua nhiều vị trí biên: thử nhiều độ lệch
  for (const pad of [0, 1, 2, 3]) {
    const line = 'Đ'.repeat(40_000); // 80 000 byte (> 64KB)
    const p = await file(`u${pad}`, `${'a'.repeat(pad)}\n${line}\nxong\n`);
    const r = await tail(p, 2);
    assert.equal(r[0], line, `pad=${pad}`);
    assert.equal(r[1], 'xong');
  }
});
test('ex08 · file ~150MB: đúng và RSS tăng < 50MB', async () => {
  const p = join(tmp.dir, 'big.log');
  const block = Buffer.from(`${'log line '.repeat(7)}\n`.repeat(16384)); // ~1MB
  await writeRepeated(p, block, 150);
  await appendFile(p, 'dòng áp chót\ndòng cuối\n');
  let r;
  const delta = await peakRssDelta(async () => { r = await tail(p, 2); });
  assert.deepEqual(r, ['dòng áp chót', 'dòng cuối']);
  assert.ok(delta < 50 * MB, `RSS tăng ${(delta / MB).toFixed(0)}MB — có đang đọc cả file không?`);
});
