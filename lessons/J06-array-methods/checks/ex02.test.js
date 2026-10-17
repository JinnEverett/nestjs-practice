import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortProducts } from '../answers/ex02.js';

const products = Object.freeze([
  { name: 'Đèn', price: 100 },
  { name: 'Áo', price: 9 },
  { name: 'Bút', price: 100 },
  { name: 'Ấm', price: 1000 },
  { name: 'Dép', price: 100 },
]);
test('ex02 · giá tăng dần theo SỐ (9 < 100 < 1000)', () => {
  assert.deepEqual(sortProducts(products).map((p) => p.price), [9, 100, 100, 100, 1000]);
});
test('ex02 · cùng giá theo tên tiếng Việt (Bút < Dép < Đèn)', () => {
  assert.deepEqual(sortProducts(products).map((p) => p.name), ['Áo', 'Bút', 'Dép', 'Đèn', 'Ấm']);
});
test('ex02 · không mutate (input bị freeze)', () => {
  const r = sortProducts(products);
  assert.notEqual(r, products);
  assert.equal(products[0].name, 'Đèn');
});
