import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totalRevenue } from '../answers/ex01.js';

test('ex01 · chỉ tính paid và delivered', () => {
  const orders = [
    { status: 'paid', total: 100 },
    { status: 'delivered', total: 250 },
    { status: 'pending', total: 1000 },
    { status: 'cancelled', total: 5000 },
  ];
  assert.equal(totalRevenue(orders), 350);
});
test('ex01 · mảng rỗng → 0', () => assert.equal(totalRevenue([]), 0));
test('ex01 · không có đơn hợp lệ → 0', () => assert.equal(totalRevenue([{ status: 'pending', total: 1 }]), 0));
