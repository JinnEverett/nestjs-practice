import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { ok, err, unwrapOr, parseQuantity, type Result } from '../answers/ex03.js';

type _r = Expect<Equal<ReturnType<typeof parseQuantity>, Result<number, string>>>;

function _typeTests(r: Result<number>) {
  // @ts-expect-error chưa kiểm ok thì không có value
  r.value;
  if (r.ok) {
    const n: number = r.value;
    void n;
  } else {
    const e: string = r.error;
    void e;
  }
}

test('ex03 · ok / err', () => {
  assert.deepEqual(ok(5), { ok: true, value: 5 });
  assert.deepEqual(err('x'), { ok: false, error: 'x' });
});
test('ex03 · unwrapOr', () => {
  assert.equal(unwrapOr(ok(5), 0), 5);
  assert.equal(unwrapOr(err('x'), 0), 0);
});
test('ex03 · parseQuantity', () => {
  assert.deepEqual(parseQuantity('3'), { ok: true, value: 3 });
  for (const bad of ['0', '100', '1.5', 'abc', '']) {
    const r = parseQuantity(bad);
    assert.equal(r.ok, false, bad);
    if (!r.ok) assert.ok(r.error.length > 0);
  }
});
