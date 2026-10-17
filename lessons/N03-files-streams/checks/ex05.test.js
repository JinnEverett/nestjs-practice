import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipFile, gunzipFile } from '../answers/ex05.js';
import { tempDir } from '../_lib/mem.js';

let tmp;
before(async () => { tmp = await tempDir(); });
after(() => tmp.cleanup());

const exists = (p) => stat(p).then(() => true, () => false);

test('ex05 · gzip rồi gunzip trả lại đúng nội dung', async () => {
  const src = join(tmp.dir, 'a.txt');
  const content = 'Đơn hàng #123\n'.repeat(5000);
  await writeFile(src, content);
  await gzipFile(src, join(tmp.dir, 'a.txt.gz'));
  assert.ok((await stat(join(tmp.dir, 'a.txt.gz'))).size < content.length / 5);
  await gunzipFile(join(tmp.dir, 'a.txt.gz'), join(tmp.dir, 'a.out'));
  assert.equal(await readFile(join(tmp.dir, 'a.out'), 'utf8'), content);
});
test('ex05 · trả Promise và chỉ resolve khi file đích đã ghi xong', async () => {
  const src = join(tmp.dir, 'b.txt');
  await writeFile(src, 'x'.repeat(1_000_000));
  const dest = join(tmp.dir, 'b.gz');
  await gzipFile(src, dest);
  assert.ok((await stat(dest)).size > 0);
  await gunzipFile(dest, join(tmp.dir, 'b.out'));
  assert.equal((await readFile(join(tmp.dir, 'b.out'), 'utf8')).length, 1_000_000);
});
test('ex05 · không có file nguồn → reject ENOENT và không để lại file đích', async () => {
  const dest = join(tmp.dir, 'never.gz');
  await assert.rejects(gzipFile(join(tmp.dir, 'nope.txt'), dest), { code: 'ENOENT' });
  assert.equal(await exists(dest), false, 'file đích rác còn sót');
});
test('ex05 · file gzip hỏng → reject và xóa file đích đang ghi dở', async () => {
  const bad = join(tmp.dir, 'bad.gz');
  await writeFile(bad, 'đây không phải gzip');
  const dest = join(tmp.dir, 'bad.out');
  await assert.rejects(gunzipFile(bad, dest));
  assert.equal(await exists(dest), false, 'file đích rác còn sót');
});
test('ex05 · không phát unhandledRejection / uncaughtException khi lỗi', async () => {
  const errors = [];
  const onErr = (e) => errors.push(e);
  process.on('unhandledRejection', onErr);
  process.on('uncaughtException', onErr);
  await assert.rejects(gzipFile(join(tmp.dir, 'nope2.txt'), join(tmp.dir, 'n2.gz')));
  await new Promise((r) => setTimeout(r, 50));
  process.off('unhandledRejection', onErr);
  process.off('uncaughtException', onErr);
  assert.deepEqual(errors, []);
});
