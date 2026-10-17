import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBlank } from '../answers/ex02.js';

test('ex02 · null, undefined, chuỗi rỗng → true', () => {
  assert.equal(isBlank(null), true);
  assert.equal(isBlank(undefined), true);
  assert.equal(isBlank(''), true);
});
test('ex02 · chuỗi toàn khoảng trắng (space, tab, xuống dòng) → true', () => {
  assert.equal(isBlank('   '), true);
  assert.equal(isBlank('\t\n '), true);
});
test('ex02 · falsy nhưng không phải "trống" → false', () => {
  assert.equal(isBlank(0), false);
  assert.equal(isBlank(false), false);
  assert.equal(isBlank(NaN), false);
});
test('ex02 · chuỗi có nội dung và object → false', () => {
  assert.equal(isBlank(' a '), false);
  assert.equal(isBlank('0'), false);
  assert.equal(isBlank([]), false);
  assert.equal(isBlank({}), false);
});
test('ex02 · luôn trả boolean thật', () => {
  assert.equal(typeof isBlank('x'), 'boolean');
  assert.equal(typeof isBlank(null), 'boolean');
  assert.equal(typeof isBlank(5), 'boolean');
});
