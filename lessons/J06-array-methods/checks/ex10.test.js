import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyQuery } from '../answers/ex10.js';

const P = Object.freeze([
  { id: 1, name: 'Áo thun trắng', price: 150, categoryId: 1, isActive: true },
  { id: 2, name: 'Quần jean', price: 450, categoryId: 2, isActive: true },
  { id: 3, name: 'Áo khoác', price: 900, categoryId: 1, isActive: false },
  { id: 4, name: 'Đầm dạ hội', price: 1200, categoryId: 3, isActive: true },
  { id: 5, name: 'ÁO SƠ MI', price: 450, categoryId: 1, isActive: true },
  { id: 6, name: 'Dép', price: 80, categoryId: 4, isActive: true },
]);
const ids = (r) => r.data.map((p) => p.id);

test('ex10 · mặc định: chỉ active, theo id, có meta', () => {
  const r = applyQuery(P);
  assert.deepEqual(ids(r), [1, 2, 4, 5, 6]);
  assert.deepEqual({ total: r.total, page: r.page, limit: r.limit, totalPages: r.totalPages }, { total: 5, page: 1, limit: 20, totalPages: 1 });
});
test('ex10 · q không phân biệt hoa thường và dấu', () => {
  assert.deepEqual(ids(applyQuery(P, { q: ' ao ' })), [1, 5]);
  assert.deepEqual(ids(applyQuery(P, { q: 'dam' })), [4]);
  assert.deepEqual(ids(applyQuery(P, { q: 'ĐẦM' })), [4]);
  assert.deepEqual(ids(applyQuery(P, { q: '' })), [1, 2, 4, 5, 6]);
});
test('ex10 · khoảng giá bao gồm 2 đầu', () => assert.deepEqual(ids(applyQuery(P, { minPrice: 150, maxPrice: 450 })), [1, 2, 5]));
test('ex10 · categoryIds', () => {
  assert.deepEqual(ids(applyQuery(P, { categoryIds: [1, 3] })), [1, 4, 5]);
  assert.deepEqual(ids(applyQuery(P, { categoryIds: [] })), [1, 2, 4, 5, 6]);
});
test('ex10 · sort', () => {
  assert.deepEqual(ids(applyQuery(P, { sort: 'price' })), [6, 1, 2, 5, 4]);
  assert.deepEqual(ids(applyQuery(P, { sort: '-price' })), [4, 2, 5, 1, 6]);
  assert.deepEqual(ids(applyQuery(P, { sort: 'name' })), [5, 1, 6, 4, 2]);
});
test('ex10 · phân trang', () => {
  const r = applyQuery(P, { sort: 'price', page: 2, limit: 2 });
  assert.deepEqual(ids(r), [2, 5]);
  assert.equal(r.totalPages, 3);
  assert.deepEqual(applyQuery(P, { page: 9, limit: 2 }).data, []);
});
test('ex10 · kết hợp lọc + total đúng trước khi cắt trang', () => {
  const r = applyQuery(P, { q: 'áo', limit: 1 });
  assert.equal(r.total, 2);
  assert.equal(r.data.length, 1);
});
