import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AppError, NotFoundError, ValidationError, ConflictError } from '../answers/ex02.js';

test('ex02 · AppError mặc định', () => {
  const e = new AppError('boom');
  assert.ok(e instanceof Error);
  assert.equal(e.message, 'boom');
  assert.equal(e.code, 'INTERNAL_ERROR');
  assert.equal(e.statusCode, 500);
  assert.equal(e.details, undefined);
  assert.equal(e.name, 'AppError');
  assert.ok(e.stack.includes('boom'));
});
test('ex02 · AppError với options và cause', () => {
  const root = new Error('db');
  const e = new AppError('wrap', { code: 'X', statusCode: 502, details: { a: 1 }, cause: root });
  assert.equal(e.code, 'X');
  assert.equal(e.statusCode, 502);
  assert.deepEqual(e.details, { a: 1 });
  assert.equal(e.cause, root);
});
test('ex02 · lớp con', () => {
  const nf = new NotFoundError();
  assert.ok(nf instanceof NotFoundError && nf instanceof AppError && nf instanceof Error);
  assert.deepEqual([nf.name, nf.code, nf.statusCode, nf.message], ['NotFoundError', 'NOT_FOUND', 404, 'Not found']);
  const v = new ValidationError([{ field: 'x', message: 'bad' }]);
  assert.deepEqual([v.name, v.code, v.statusCode, v.message], ['ValidationError', 'VALIDATION_ERROR', 400, 'Validation failed']);
  assert.deepEqual(v.details, [{ field: 'x', message: 'bad' }]);
  const c = new ConflictError('Email đã tồn tại');
  assert.deepEqual([c.name, c.code, c.statusCode, c.message], ['ConflictError', 'CONFLICT', 409, 'Email đã tồn tại']);
});
test('ex02 · cause qua lớp con', () => {
  const root = new SyntaxError('x');
  assert.equal(new ValidationError([], 'Invalid JSON', { cause: root }).cause, root);
  assert.equal(new NotFoundError('nf', { cause: root }).cause, root);
});
test('ex02 · lớp con tự đặt name', () => {
  class PaymentError extends AppError {}
  assert.equal(new PaymentError('x').name, 'PaymentError');
});
test('ex02 · toJSON', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(new NotFoundError('nope'))), { name: 'NotFoundError', code: 'NOT_FOUND', message: 'nope' });
  assert.deepEqual(JSON.parse(JSON.stringify(new ValidationError([{ field: 'a', message: 'b' }]))).details, [{ field: 'a', message: 'b' }]);
});
