import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadUserProfile } from '../answers/ex06.js';
import { AppError, NotFoundError } from '../answers/ex02.js';

test('ex06 · thành công', () => {
  const repo = { findById: (id) => ({ id, name: 'An', passwordHash: 'x' }) };
  assert.deepEqual(loadUserProfile(1, repo), { id: 1, name: 'An' });
});
test('ex06 · không tìm thấy → NotFoundError', () => {
  assert.throws(
    () => loadUserProfile(7, { findById: () => null }),
    (e) => e instanceof NotFoundError && e.message === 'User 7 not found',
  );
});
test('ex06 · repo lỗi → bọc, giữ cause', () => {
  const dbError = new Error('connection refused');
  assert.throws(
    () => loadUserProfile(1, { findById: () => { throw dbError; } }),
    (e) => e instanceof AppError && !(e instanceof NotFoundError) && e.code === 'PROFILE_LOAD_FAILED' && e.statusCode === 503 && e.cause === dbError,
  );
});
test('ex06 · không console.log', (t) => {
  const spy = t.mock.method(console, 'log');
  assert.throws(() => loadUserProfile(1, { findById: () => { throw new Error('x'); } }));
  assert.equal(spy.mock.callCount(), 0);
});
