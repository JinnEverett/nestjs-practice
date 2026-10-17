import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curry } from '../answers/ex06.js';

const add3 = (a, b, c) => a + b + c;
test('ex06 · từng tham số', () => assert.equal(curry(add3)(1)(2)(3), 6));
test('ex06 · gom nhiều tham số một lần', () => {
  assert.equal(curry(add3)(1, 2)(3), 6);
  assert.equal(curry(add3)(1)(2, 3), 6);
  assert.equal(curry(add3)(1, 2, 3), 6);
});
test('ex06 · các nhánh không ảnh hưởng nhau', () => {
  const add1 = curry(add3)(1);
  assert.equal(add1(2)(3), 6);
  assert.equal(add1(10)(10), 21);
  const add1and2 = add1(2);
  assert.equal(add1and2(3), 6);
  assert.equal(add1and2(4), 7);
});
test('ex06 · hàm 1 tham số', () => assert.equal(curry((x) => x * 2)(4), 8));
test('ex06 · hàm 0 tham số gọi ngay', () => assert.equal(curry(() => 'now')(), 'now'));
