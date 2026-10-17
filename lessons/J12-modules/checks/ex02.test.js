import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import createSlugger, { slugify, DEFAULT_SEPARATOR } from '../answers/ex02.js';

test('ex02 · named export', () => {
  assert.equal(DEFAULT_SEPARATOR, '-');
  assert.equal(slugify('Áo Thun Đẹp!'), 'ao-thun-dep');
});
test('ex02 · default export', () => {
  const underscore = createSlugger('_');
  assert.equal(underscore('Quần Jean Nam'), 'quan_jean_nam');
});
test('ex02 · là ESM thuần', () => {
  const src = readFileSync(new URL('../answers/ex02.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  assert.equal(/require\(|module\.exports|exports\./.test(src), false);
});
