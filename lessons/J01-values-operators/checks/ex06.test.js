import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeDivide } from '../answers/ex06.js';

test('ex06 · chia bình thường', () => {
  assert.equal(safeDivide(10, 4), 2.5);
  assert.equal(safeDivide(-9, 3), -3);
  assert.equal(safeDivide(0, 5), 0);
});
test('ex06 · chia cho 0 (kể cả -0) → null', () => {
  assert.equal(safeDivide(1, 0), null);
  assert.equal(safeDivide(0, 0), null);
  assert.equal(safeDivide(1, -0), null);
});
test('ex06 · chuỗi số không được chấp nhận', () => {
  assert.equal(safeDivide('10', 2), null);
  assert.equal(safeDivide(10, '2'), null);
});
test('ex06 · NaN, Infinity → null', () => {
  assert.equal(safeDivide(NaN, 2), null);
  assert.equal(safeDivide(Infinity, 2), null);
  assert.equal(safeDivide(1, Infinity), null);
});
test('ex06 · null, undefined, boolean → null', () => {
  assert.equal(safeDivide(null, 2), null);
  assert.equal(safeDivide(4, undefined), null);
  assert.equal(safeDivide(true, 1), null);
});
