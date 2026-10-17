import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { first, last, compact } from '../answers/ex01.js';

const nums = [1, 2, 3];
const f = first(nums);
const l = last(['a', 'b'] as const);
const c = compact([1, null, 2, undefined]);
type _f = Expect<Equal<typeof f, number | undefined>>;
type _l = Expect<Equal<typeof l, 'a' | 'b' | undefined>>;
type _c = Expect<Equal<typeof c, number[]>>;

test('ex01 · first/last', () => {
  assert.equal(first(nums), 1);
  assert.equal(last(nums), 3);
  assert.equal(first([]), undefined);
});
test('ex01 · compact giữ 0 và chuỗi rỗng', () => assert.deepEqual(compact([0, null, '', undefined, false]), [0, '', false]));
