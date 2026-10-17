import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Counter } from '../answers/ex02.js';

test('ex02 · add và gọi nối', () => {
  const c = new Counter();
  assert.equal(c.total, 0);
  c.add(1).add(2);
  assert.equal(c.total, 3);
});
test('ex02 · addAll không mất this', () => {
  const c = new Counter();
  assert.equal(c.addAll([1, 2, 3]), c);
  assert.equal(c.total, 6);
});
test('ex02 · tách method ra vẫn cộng đúng instance', () => {
  const c = new Counter();
  const { add } = c;
  add(5);
  [1, 1].forEach(c.add);
  assert.equal(c.total, 7);
});
test('ex02 · hai instance độc lập', () => {
  const a = new Counter();
  const b = new Counter();
  a.add(10);
  const { add } = b;
  add(1);
  assert.equal(a.total, 10);
  assert.equal(b.total, 1);
});
