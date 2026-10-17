import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { isPromiseLike, type ElementType, type MyAwaited, type FirstArg, type MyReturnType } from '../answers/ex03.js';

type _e1 = Expect<Equal<ElementType<string[]>, string>>;
type _e2 = Expect<Equal<ElementType<readonly [1, 'a']>, 1 | 'a'>>;
type _e3 = Expect<Equal<ElementType<number>, never>>;
type _a1 = Expect<Equal<MyAwaited<Promise<Promise<number>>>, number>>;
type _a2 = Expect<Equal<MyAwaited<string>, string>>;
type _f1 = Expect<Equal<FirstArg<(id: number, name: string) => void>, number>>;
type _f2 = Expect<Equal<FirstArg<() => void>, never>>;
type _r1 = Expect<Equal<MyReturnType<() => Promise<boolean>>, Promise<boolean>>>;

test('ex03 · isPromiseLike', () => {
  assert.equal(isPromiseLike(Promise.resolve(1)), true);
  assert.equal(isPromiseLike({ then: () => {} }), true);
  assert.equal(isPromiseLike({ then: 1 }), false);
  assert.equal(isPromiseLike(null), false);
});
