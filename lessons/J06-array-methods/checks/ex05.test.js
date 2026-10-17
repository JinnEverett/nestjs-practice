import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topCustomers } from '../answers/ex05.js';

const orders = [
  { customerId: 3, total: 500, status: 'paid' },
  { customerId: 1, total: 200, status: 'paid' },
  { customerId: 2, total: 700, status: 'delivered' },
  { customerId: 1, total: 300, status: 'pending' },
  { customerId: 4, total: 9000, status: 'cancelled' },
  { customerId: 5, total: 100, status: 'paid' },
];
test('ex05 · top 3 mặc định, bỏ đơn cancelled, tie theo customerId', () => {
  assert.deepEqual(topCustomers(orders), [
    { customerId: 2, revenue: 700, orderCount: 1 },
    { customerId: 1, revenue: 500, orderCount: 2 },
    { customerId: 3, revenue: 500, orderCount: 1 },
  ]);
});
test('ex05 · n tùy chọn', () => assert.equal(topCustomers(orders, 10).length, 4));
test('ex05 · rỗng', () => assert.deepEqual(topCustomers([]), []));
