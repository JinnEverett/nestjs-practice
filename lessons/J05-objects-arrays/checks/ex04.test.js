import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deepEqual } from '../answers/ex04.js';

test('ex04 · primitive', () => {
  assert.equal(deepEqual(1, 1), true);
  assert.equal(deepEqual('a', 'b'), false);
  assert.equal(deepEqual(NaN, NaN), true);
  assert.equal(deepEqual(0, -0), true);
  assert.equal(deepEqual(1, '1'), false);
  assert.equal(deepEqual(null, undefined), false);
});
test('ex04 · mảng đúng thứ tự', () => {
  assert.equal(deepEqual([1, [2, 3]], [1, [2, 3]]), true);
  assert.equal(deepEqual([1, 2], [2, 1]), false);
  assert.equal(deepEqual([1], [1, undefined]), false);
});
test('ex04 · object không quan tâm thứ tự key', () => {
  assert.equal(deepEqual({ a: 1, b: { c: [1] } }, { b: { c: [1] }, a: 1 }), true);
  assert.equal(deepEqual({ a: 1 }, { a: 1, b: 2 }), false);
  assert.equal(deepEqual({ a: undefined }, { b: undefined }), false);
});
test('ex04 · Date so theo thời điểm', () => {
  assert.equal(deepEqual(new Date(5), new Date(5)), true);
  assert.equal(deepEqual(new Date(5), new Date(6)), false);
  assert.equal(deepEqual({ at: new Date(1) }, { at: new Date(1) }), true);
});
test('ex04 · khác kiểu', () => {
  assert.equal(deepEqual([1], { 0: 1 }), false);
  assert.equal(deepEqual(null, {}), false);
  assert.equal(deepEqual({}, null), false);
  assert.equal(deepEqual(new Date(0), {}), false);
});
