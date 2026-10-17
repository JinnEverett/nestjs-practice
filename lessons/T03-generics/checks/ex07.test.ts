import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { ok, err, mapResult, andThen, combine, type Result } from '../answers/ex07.js';

const parseQty = (s: string): Result<number, string> => (/^\d+$/.test(s) ? ok(Number(s)) : err(`bad: ${s}`));
const r1 = mapResult(parseQty('3'), (n) => `${n} cái`);
type _1 = Expect<Equal<typeof r1, Result<string, string>>>;
const r2 = andThen(parseQty('3'), (n) => (n > 0 ? ok(n * 2) : err('zero')));
type _2 = Expect<Equal<typeof r2, Result<number, string>>>;
const r3 = combine([parseQty('1'), parseQty('2')]);
type _3 = Expect<Equal<typeof r3, Result<number[], string>>>;

test('ex07 · mapResult', () => {
  assert.deepEqual(r1, { ok: true, value: '3 cái' });
  assert.deepEqual(mapResult(parseQty('x'), (n) => n + 1), { ok: false, error: 'bad: x' });
});
test('ex07 · andThen', () => {
  assert.deepEqual(r2, { ok: true, value: 6 });
  assert.deepEqual(andThen(parseQty('0'), (n) => (n > 0 ? ok(n) : err('zero'))), { ok: false, error: 'zero' });
});
test('ex07 · combine', () => {
  assert.deepEqual(r3, { ok: true, value: [1, 2] });
  assert.deepEqual(combine([parseQty('1'), parseQty('a'), parseQty('b')]), { ok: false, error: 'bad: a' });
  assert.deepEqual(combine<number, string>([]), { ok: true, value: [] });
});
