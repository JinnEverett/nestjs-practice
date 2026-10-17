import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pick, omit } from '../answers/ex02.js';

test('ex02 · pick giữ key có thật', () => assert.deepEqual(pick({ a: 1, b: 2, c: 3 }, ['a', 'c', 'z']), { a: 1, c: 3 }));
test('ex02 · pick giữ key có giá trị undefined nếu là own property', () => {
  const r = pick({ a: undefined, b: 1 }, ['a']);
  assert.equal(Object.hasOwn(r, 'a'), true);
});
test('ex02 · pick không lấy thuộc tính kế thừa', () => {
  const r = pick({ a: 1 }, ['a', 'toString', 'hasOwnProperty']);
  assert.deepEqual(Object.keys(r), ['a']);
});
test('ex02 · omit', () => {
  assert.deepEqual(omit({ a: 1, b: 2, c: 3 }, ['b']), { a: 1, c: 3 });
  assert.deepEqual(omit({ a: 1 }, ['z']), { a: 1 });
});
test('ex02 · trả object mới, không mutate', () => {
  const src = Object.freeze({ a: 1, b: 2 });
  assert.notEqual(pick(src, ['a', 'b']), src);
  assert.notEqual(omit(src, []), src);
});
