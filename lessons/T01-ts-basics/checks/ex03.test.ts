import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { minMax } from '../answers/ex03.js';

type _ret = Expect<Equal<ReturnType<typeof minMax>, [number, number] | undefined>>;
type _param = Expect<Equal<Parameters<typeof minMax>[0], readonly number[]>>;

test('ex03 · min max', () => {
  assert.deepEqual(minMax([3, -1, 7, 2]), [-1, 7]);
  assert.deepEqual(minMax([5]), [5, 5]);
});
test('ex03 · rỗng', () => assert.equal(minMax([]), undefined));
test('ex03 · không mutate', () => {
  const xs = Object.freeze([3, 1, 2]);
  minMax(xs);
  assert.deepEqual(xs, [3, 1, 2]);
});
