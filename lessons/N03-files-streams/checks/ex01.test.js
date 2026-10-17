import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readJson } from '../answers/ex01.js';
import { tempDir } from '../_lib/mem.js';

let tmp;
before(async () => { tmp = await tempDir(); });
after(() => tmp.cleanup());

test('ex01 · đọc và parse JSON', async () => {
  const p = join(tmp.dir, 'a.json');
  await writeFile(p, '{"a":1,"b":[1,2]}');
  assert.deepEqual(await readJson(p), { a: 1, b: [1, 2] });
});
test('ex01 · ENOENT + có fallback → trả fallback (kể cả null, 0, rỗng)', async () => {
  const p = join(tmp.dir, 'missing.json');
  assert.deepEqual(await readJson(p, { x: 1 }), { x: 1 });
  assert.equal(await readJson(p, null), null);
  assert.equal(await readJson(p, 0), 0);
  assert.equal(await readJson(p, undefined), undefined);
});
test('ex01 · ENOENT + không fallback → ném lại lỗi gốc ENOENT', async () => {
  await assert.rejects(readJson(join(tmp.dir, 'missing.json')), { code: 'ENOENT' });
});
test('ex01 · đường dẫn là thư mục → luôn ném (không nuốt vào fallback)', async () => {
  const d = join(tmp.dir, 'dir');
  await mkdir(d);
  await assert.rejects(readJson(d, 'fb'), (e) => e.code === 'EISDIR' || e.code === 'EPERM' || e.code === 'EACCES');
});
test('ex01 · JSON sai cú pháp → Error "Invalid JSON in <path>" có cause', async () => {
  const p = join(tmp.dir, 'bad.json');
  await writeFile(p, '{"a":');
  await assert.rejects(readJson(p, 'fb'), (e) => {
    assert.equal(e.message, `Invalid JSON in ${p}`);
    assert.ok(e.cause instanceof SyntaxError);
    return true;
  });
});
test('ex01 · file có BOM vẫn parse được', async () => {
  const p = join(tmp.dir, 'bom.json');
  await writeFile(p, '﻿{"ok":true}');
  assert.deepEqual(await readJson(p), { ok: true });
});
test('ex01 · JSON hợp lệ nhưng là giá trị rỗng (null/0) không bị nhầm với "không có file"', async () => {
  const p = join(tmp.dir, 'null.json');
  await writeFile(p, 'null');
  assert.equal(await readJson(p, { fallback: true }), null);
});
