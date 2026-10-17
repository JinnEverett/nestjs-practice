import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLimit } from '../answers/ex03.js';

test('ex03 · thiếu hoặc rỗng → 20', () => {
  assert.equal(parseLimit(undefined), 20);
  assert.equal(parseLimit(''), 20);
  assert.equal(parseLimit('   '), 20);
});
test('ex03 · số hợp lệ trả nguyên', () => {
  assert.equal(parseLimit('50'), 50);
  assert.equal(parseLimit('1'), 1);
  assert.equal(parseLimit('100'), 100);
});
test('ex03 · bỏ khoảng trắng 2 đầu', () => assert.equal(parseLimit(' 7 '), 7));
test('ex03 · "12abc" không được coi là 12', () => assert.equal(parseLimit('12abc'), 20));
test('ex03 · số thập phân, chữ, NaN, Infinity → 20', () => {
  assert.equal(parseLimit('3.5'), 20);
  assert.equal(parseLimit('abc'), 20);
  assert.equal(parseLimit('NaN'), 20);
  assert.equal(parseLimit('Infinity'), 20);
});
test('ex03 · kẹp vào [1, 100]', () => {
  assert.equal(parseLimit('0'), 1);
  assert.equal(parseLimit('-5'), 1);
  assert.equal(parseLimit('1000'), 100);
});
test('ex03 · trả về number', () => assert.equal(typeof parseLimit('5'), 'number'));
