import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { describeValue } from '../answers/ex01.js';

type _p = Expect<Equal<Parameters<typeof describeValue>[0], string | number | boolean | null | undefined>>;

test('ex01 · các nhánh', () => {
  assert.equal(describeValue(null), '(trống)');
  assert.equal(describeValue(undefined), '(trống)');
  assert.equal(describeValue(true), 'có');
  assert.equal(describeValue(false), 'không');
  assert.equal(describeValue(3.14159), '3.14');
  assert.equal(describeValue(0), '0.00');
  assert.equal(describeValue('  Áo '), 'Áo');
  assert.equal(describeValue('   '), '(trống)');
});
