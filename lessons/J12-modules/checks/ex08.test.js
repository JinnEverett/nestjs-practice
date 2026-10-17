import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const target = fileURLToPath(new URL('../node_modules/shop-utils/', import.meta.url));
before(() => {
  rmSync(target, { recursive: true, force: true });
  cpSync(fileURLToPath(new URL('../answers/ex08/', import.meta.url)), target, { recursive: true });
});

test('ex08 · import → bản ESM', async () => {
  const m = await import('shop-utils');
  assert.equal(m.FORMAT, 'esm');
  assert.equal(m.VERSION, '1.0.0');
  assert.equal(m.formatVnd(150000).replace(/ /g, ' '), '150.000 ₫');
});
test('ex08 · require → bản CJS', () => {
  const require = createRequire(import.meta.url);
  const m = require('shop-utils');
  assert.equal(m.FORMAT, 'cjs');
  assert.equal(m.VERSION, '1.0.0');
  assert.equal(m.formatVnd(150000).replace(/ /g, ' '), '150.000 ₫');
});
test('ex08 · subpath ./errors', async () => {
  const { ShopError } = await import('shop-utils/errors');
  assert.ok(new ShopError('x') instanceof Error);
});
test('ex08 · file nội bộ bị chặn', async () => {
  await assert.rejects(import('shop-utils/src/internal.js'), (e) => e.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED');
});
