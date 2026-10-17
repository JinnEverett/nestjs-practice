import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sumMoney } from '../answers/ex05.js';

test('ex05 · 0.1 + 0.2 = 0.3 chính xác', () => assert.equal(sumMoney([0.1, 0.2]), 0.3));
test('ex05 · nhiều số lẻ cent', () => assert.equal(sumMoney([19.99, 5.01, 0.15]), 25.15));
test('ex05 · mảng rỗng → 0', () => assert.equal(sumMoney([]), 0));
test('ex05 · cộng dồn nhiều lần không trôi', () => {
  assert.equal(sumMoney(Array(10).fill(0.1)), 1);
  assert.equal(sumMoney(Array(1000).fill(0.01)), 10);
});
test('ex05 · số âm (hoàn tiền)', () => assert.equal(sumMoney([10.1, -0.3, -2.2]), 7.6));
test('ex05 · không mutate mảng đầu vào', () => {
  const xs = [1.1, 2.2];
  sumMoney(xs);
  assert.deepEqual(xs, [1.1, 2.2]);
});
