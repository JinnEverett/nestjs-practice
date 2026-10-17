import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reduceFetch, type FetchState } from '../answers/ex08.js';

const idle: FetchState<number[]> = { status: 'idle' };

test('ex08 · luồng chuẩn', () => {
  const loading = reduceFetch(idle, { type: 'start' });
  assert.deepEqual(loading, { status: 'loading' });
  assert.deepEqual(reduceFetch(loading, { type: 'resolve', data: [1, 2] }), { status: 'success', data: [1, 2] });
  assert.deepEqual(reduceFetch(loading, { type: 'reject', error: 'timeout' }), { status: 'error', error: 'timeout' });
});
test('ex08 · start khi đang loading giữ nguyên object', () => {
  const loading: FetchState<number> = { status: 'loading' };
  assert.equal(reduceFetch(loading, { type: 'start' }), loading);
});
test('ex08 · resolve/reject ngoài loading bị bỏ qua', () => {
  assert.equal(reduceFetch(idle, { type: 'resolve', data: [1] }), idle);
  const ok: FetchState<number> = { status: 'success', data: 1 };
  assert.equal(reduceFetch(ok, { type: 'reject', error: 'x' }), ok);
});
test('ex08 · retry từ error, reset', () => {
  const failed: FetchState<number> = { status: 'error', error: 'x' };
  assert.deepEqual(reduceFetch(failed, { type: 'start' }), { status: 'loading' });
  assert.deepEqual(reduceFetch(failed, { type: 'reset' }), { status: 'idle' });
});
