import { test } from 'node:test';
import assert from 'node:assert/strict';
import { union, intersection, difference, symmetricDifference, isSubsetOf } from '../answers/ex02.js';

const arr = (s) => [...s];
test('ex02 · union / intersection / difference giữ thứ tự', () => {
  assert.deepEqual(arr(union([1, 2, 3], [3, 4, 1])), [1, 2, 3, 4]);
  assert.deepEqual(arr(intersection([1, 2, 3, 4], new Set([4, 2, 9]))), [2, 4]);
  assert.deepEqual(arr(difference('abcd', 'bd')), ['a', 'c']);
  assert.deepEqual(arr(symmetricDifference([1, 2, 3], [3, 4])), [1, 2, 4]);
});
test('ex02 · trả Set mới', () => {
  const a = new Set([1]);
  const u = union(a, []);
  assert.ok(u instanceof Set);
  assert.notEqual(u, a);
});
test('ex02 · trùng trong input', () => assert.deepEqual(arr(intersection([1, 1, 2], [1, 1])), [1]));
test('ex02 · isSubsetOf', () => {
  assert.equal(isSubsetOf(['read'], ['read', 'write']), true);
  assert.equal(isSubsetOf(['read', 'delete'], ['read', 'write']), false);
  assert.equal(isSubsetOf([], ['x']), true);
});
test('ex02 · nhận iterable chỉ duyệt được một lần', () => {
  function* once() {
    yield 1;
    yield 2;
  }
  assert.deepEqual(arr(difference(once(), [2])), [1]);
});
