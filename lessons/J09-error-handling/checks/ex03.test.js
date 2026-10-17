import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toErrorResponse } from '../answers/ex03.js';
import { NotFoundError, ValidationError, AppError } from '../answers/ex02.js';

test('ex03 · AppError', () => {
  assert.deepEqual(toErrorResponse(new NotFoundError('Order 5 not found')), {
    statusCode: 404,
    body: { code: 'NOT_FOUND', message: 'Order 5 not found' },
  });
  assert.deepEqual(toErrorResponse(new AppError('x', { code: 'RATE', statusCode: 429 })), { statusCode: 429, body: { code: 'RATE', message: 'x' } });
});
test('ex03 · details', () => {
  const r = toErrorResponse(new ValidationError([{ field: 'qty', message: 'must be ≥ 1' }]));
  assert.equal(r.statusCode, 400);
  assert.deepEqual(r.body.details, [{ field: 'qty', message: 'must be ≥ 1' }]);
});
test('ex03 · lỗi lạ → 500 không lộ message', () => {
  const internal = { statusCode: 500, body: { code: 'INTERNAL_ERROR', message: 'Internal server error' } };
  assert.deepEqual(toErrorResponse(new Error('relation "users" does not exist')), internal);
  assert.deepEqual(toErrorResponse('string thrown'), internal);
  assert.deepEqual(toErrorResponse(null), internal);
  assert.deepEqual(toErrorResponse(undefined), internal);
});
test('ex03 · object giả mạo có statusCode không được tin', () => {
  assert.equal(toErrorResponse({ statusCode: 200, code: 'OK', message: 'hack' }).statusCode, 500);
});
