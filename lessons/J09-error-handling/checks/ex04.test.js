import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ensureError, attempt } from '../answers/ex04.js';

test('ex04 · ensureError giữ nguyên Error', () => {
  const e = new TypeError('x');
  assert.equal(ensureError(e), e);
});
test('ex04 · ensureError bọc giá trị khác, giữ cause', () => {
  for (const v of ['chuỗi', 42, null, undefined, { a: 1 }]) {
    const e = ensureError(v);
    assert.ok(e instanceof Error);
    assert.ok(e.message.startsWith('Non-error thrown'));
    assert.equal(e.cause, v);
  }
  assert.ok(ensureError('chuỗi').message.includes('chuỗi'));
});
test('ex04 · attempt thành công', () => {
  assert.deepEqual(attempt((a, b) => a + b, 2, 3), [null, 5]);
});
test('ex04 · attempt thất bại', () => {
  const [err, result] = attempt(() => {
    throw new RangeError('r');
  });
  assert.ok(err instanceof RangeError);
  assert.equal(result, undefined);
  const [err2] = attempt(() => {
    throw 'str';
  });
  assert.ok(err2 instanceof Error);
});
