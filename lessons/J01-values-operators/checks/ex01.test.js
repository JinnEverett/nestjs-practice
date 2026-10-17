import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typeOf } from '../answers/ex01.js';

test('ex01 · null → "null"', () => assert.equal(typeOf(null), 'null'));
test('ex01 · mảng → "array" (kể cả mảng rỗng)', () => {
  assert.equal(typeOf([1, 2]), 'array');
  assert.equal(typeOf([]), 'array');
});
test('ex01 · NaN → "nan"', () => assert.equal(typeOf(NaN), 'nan'));
test('ex01 · số bình thường vẫn là "number"', () => {
  assert.equal(typeOf(0), 'number');
  assert.equal(typeOf(Infinity), 'number');
});
test('ex01 · chuỗi "abc" không bị nhận nhầm là nan', () => assert.equal(typeOf('abc'), 'string'));
test('ex01 · các kiểu còn lại giống typeof', () => {
  assert.equal(typeOf(undefined), 'undefined');
  assert.equal(typeOf(true), 'boolean');
  assert.equal(typeOf(1n), 'bigint');
  assert.equal(typeOf(Symbol('x')), 'symbol');
  assert.equal(typeOf({}), 'object');
  assert.equal(typeOf(new Date()), 'object');
  assert.equal(typeOf(() => {}), 'function');
});
