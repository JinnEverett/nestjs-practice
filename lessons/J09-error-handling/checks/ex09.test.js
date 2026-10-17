import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createErrorHandler } from '../answers/ex09.js';
import { NotFoundError, AppError, ValidationError } from '../answers/ex02.js';

const fakeLogger = () => {
  const l = { errors: [], warns: [] };
  l.error = (x) => l.errors.push(x);
  l.warn = (x) => l.warns.push(x);
  l.info = () => {};
  return l;
};

test('ex09 · 4xx: trả message, log warn một lần', () => {
  const logger = fakeLogger();
  const handle = createErrorHandler({ logger });
  const r = handle(new NotFoundError('Order 1 not found'), { requestId: 'req-1' });
  assert.deepEqual(r, { statusCode: 404, body: { code: 'NOT_FOUND', message: 'Order 1 not found', requestId: 'req-1' } });
  assert.deepEqual(logger.warns, [{ code: 'NOT_FOUND', message: 'Order 1 not found', requestId: 'req-1' }]);
  assert.equal(logger.errors.length, 0);
});
test('ex09 · details của validation', () => {
  const r = createErrorHandler({ logger: fakeLogger() })(new ValidationError([{ field: 'a', message: 'b' }]));
  assert.deepEqual(r.body, { code: 'VALIDATION_ERROR', message: 'Validation failed', details: [{ field: 'a', message: 'b' }] });
});
test('ex09 · 5xx production: giấu message, log error kèm err', () => {
  const logger = fakeLogger();
  const handle = createErrorHandler({ logger });
  const boom = new Error('SELECT * FROM users failed');
  const r = handle(boom, { requestId: 'r2' });
  assert.deepEqual(r, { statusCode: 500, body: { code: 'INTERNAL_ERROR', message: 'Internal server error', requestId: 'r2' } });
  assert.equal(logger.errors.length, 1);
  assert.equal(logger.errors[0].err, boom);
  assert.equal(logger.errors[0].requestId, 'r2');
  assert.equal(logger.warns.length, 0);
});
test('ex09 · AppError 503 production vẫn giấu message, giữ code', () => {
  const r = createErrorHandler({ logger: fakeLogger() })(new AppError('Redis down at 10.0.0.5', { code: 'DEP_DOWN', statusCode: 503 }));
  assert.deepEqual(r, { statusCode: 503, body: { code: 'DEP_DOWN', message: 'Internal server error' } });
});
test('ex09 · dev: có stack cho 5xx', () => {
  const r = createErrorHandler({ logger: fakeLogger(), isProduction: false })(new Error('dev boom'));
  assert.equal(typeof r.body.stack, 'string');
  assert.ok(r.body.stack.includes('dev boom'));
  const r4 = createErrorHandler({ logger: fakeLogger(), isProduction: false })(new NotFoundError());
  assert.equal('stack' in r4.body, false);
});
test('ex09 · throw giá trị không phải Error vẫn log được Error', () => {
  const logger = fakeLogger();
  createErrorHandler({ logger })('oops');
  assert.ok(logger.errors[0].err instanceof Error);
});
