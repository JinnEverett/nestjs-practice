import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { parsePort } from '../answers/ex02.js';

type _param = Expect<Equal<Parameters<typeof parsePort>, [value: unknown]>>;
type _ret = Expect<Equal<ReturnType<typeof parsePort>, number>>;

test('ex02 · hợp lệ', () => {
  assert.equal(parsePort(8080), 8080);
  assert.equal(parsePort('3000'), 3000);
  assert.equal(parsePort(65535), 65535);
});
test('ex02 · không hợp lệ', () => {
  for (const v of [0, 70000, 1.5, '12abc', '', ' 80', null, undefined, {}, true, NaN]) {
    assert.throws(() => parsePort(v), TypeError, String(v));
  }
});
