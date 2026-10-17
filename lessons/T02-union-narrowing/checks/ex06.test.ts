import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NotFoundError, ValidationError, toHttpStatus } from '../answers/ex06.js';

test('ex06 · class lỗi', () => {
  assert.equal(toHttpStatus(new NotFoundError('x')), 404);
  assert.equal(toHttpStatus(new ValidationError('x')), 400);
  assert.ok(new NotFoundError('x') instanceof Error);
});
test('ex06 · object có status', () => {
  assert.equal(toHttpStatus({ status: 429 }), 429);
  assert.equal(toHttpStatus(Object.assign(new Error('x'), { status: 503 })), 503);
});
test('ex06 · còn lại 500', () => {
  for (const e of [new Error('x'), 'boom', null, undefined, { status: '404' }, { status: 200 }, { status: 700 }]) {
    assert.equal(toHttpStatus(e), 500, JSON.stringify(e));
  }
});
