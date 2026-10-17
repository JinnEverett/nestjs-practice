import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sleep, promisify } from '../answers/ex02.js';

test('ex02 · sleep đợi đúng và trả value', async () => {
  const start = performance.now();
  const v = await sleep(50, 'xong');
  assert.equal(v, 'xong');
  assert.ok(performance.now() - start >= 45);
});
test('ex02 · sleep trả Promise', () => assert.ok(sleep(0) instanceof Promise));
test('ex02 · promisify thành công', async () => {
  const add = (a, b, cb) => setTimeout(() => cb(null, a + b), 5);
  assert.equal(await promisify(add)(2, 3), 5);
});
test('ex02 · promisify lỗi', async () => {
  const err = new Error('io');
  const fail = (cb) => setImmediate(() => cb(err));
  await assert.rejects(promisify(fail)(), (e) => e === err);
});
test('ex02 · promisify giữ this', async () => {
  const obj = {
    prefix: 'ORD',
    format(id, cb) {
      cb(null, `${this.prefix}-${id}`);
    },
  };
  obj.formatAsync = promisify(obj.format);
  assert.equal(await obj.formatAsync(7), 'ORD-7');
});
test('ex02 · không dùng util.promisify', () => {
  const src = readFileSync(new URL('../answers/ex02.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  assert.equal(/node:util|from 'util'|require\('util'\)/.test(src), false);
});
