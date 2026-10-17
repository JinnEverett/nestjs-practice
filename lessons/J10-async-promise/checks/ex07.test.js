import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createDeferred } from '../answers/ex07.js';

test('ex07 · resolve từ bên ngoài', async () => {
  const d = createDeferred();
  assert.ok(d.promise instanceof Promise);
  setTimeout(() => d.resolve('ok'), 5);
  assert.equal(await d.promise, 'ok');
});
test('ex07 · reject từ bên ngoài', async () => {
  const d = createDeferred();
  d.reject(new Error('no'));
  await assert.rejects(d.promise, /no/);
});
test('ex07 · mỗi deferred độc lập', async () => {
  const a = createDeferred();
  const b = createDeferred();
  a.resolve(1);
  b.resolve(2);
  assert.deepEqual(await Promise.all([a.promise, b.promise]), [1, 2]);
});
test('ex07 · không dùng Promise.withResolvers', () => {
  const src = readFileSync(new URL('../answers/ex07.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  assert.equal(/withResolvers/.test(src), false);
});
