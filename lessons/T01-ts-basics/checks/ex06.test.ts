import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { getEnv } from '../answers/ex06.js';

const env: Record<string, string | undefined> = { A: 'x', EMPTY: '' };
const r1 = getEnv(env, 'A');
const r2 = getEnv(env, 'A', 'd');
type _1 = Expect<Equal<typeof r1, string | undefined>>;
type _2 = Expect<Equal<typeof r2, string>>;

test('ex06 · không fallback', () => {
  assert.equal(getEnv(env, 'A'), 'x');
  assert.equal(getEnv(env, 'MISSING'), undefined);
  assert.equal(getEnv(env, 'EMPTY'), undefined);
});
test('ex06 · có fallback', () => {
  assert.equal(getEnv(env, 'MISSING', 'd'), 'd');
  assert.equal(getEnv(env, 'EMPTY', 'd'), 'd');
  assert.equal(getEnv(env, 'A', 'd'), 'x');
});
