import { test } from 'node:test';
import assert from 'node:assert/strict';
import { revenueByCategory } from '../answers/ex09.js';

test('ex09 · gom theo danh mục, chỉ delivered, sản phẩm lạ → Khác', () => {
  const products = [
    { id: 1, categoryName: 'Áo' },
    { id: 2, categoryName: 'Quần' },
    { id: 3, categoryName: 'Áo' },
  ];
  const orders = [
    { id: 1, status: 'delivered', items: [{ productId: 1, qty: 2, unitPrice: 100 }, { productId: 2, qty: 1, unitPrice: 300 }] },
    { id: 2, status: 'delivered', items: [{ productId: 3, qty: 1, unitPrice: 100 }, { productId: 99, qty: 1, unitPrice: 50 }] },
    { id: 3, status: 'cancelled', items: [{ productId: 2, qty: 10, unitPrice: 1000 }] },
  ];
  assert.deepEqual(revenueByCategory(orders, products), [
    { category: 'Áo', revenue: 300, units: 3 },
    { category: 'Quần', revenue: 300, units: 1 },
    { category: 'Khác', revenue: 50, units: 1 },
  ]);
});
test('ex09 · rỗng', () => assert.deepEqual(revenueByCategory([], []), []));
test('ex09 · hiệu năng: 50k đơn × 4 dòng, 30k sản phẩm < 1s', () => {
  const products = Array.from({ length: 30_000 }, (_, i) => ({ id: i + 1, categoryName: `C${i % 40}` }));
  const orders = Array.from({ length: 50_000 }, (_, i) => ({
    id: i,
    status: i % 5 === 0 ? 'cancelled' : 'delivered',
    items: Array.from({ length: 4 }, (_, j) => ({ productId: ((i * 7 + j * 13) % 30_000) + 1, qty: 1 + (j % 3), unitPrice: 1000 })),
  }));
  const start = performance.now();
  const r = revenueByCategory(orders, products);
  const ms = performance.now() - start;
  assert.equal(r.length, 40);
  assert.ok(ms < 1000, `chạy mất ${ms.toFixed(0)} ms — có đang find() trong vòng lặp không?`);
});
