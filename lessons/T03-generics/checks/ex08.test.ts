import { test } from 'node:test';
import assert from 'node:assert/strict';
import { query } from '../answers/ex08.js';

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
}
const products: Product[] = [
  { id: 1, name: 'A', price: 300, categoryId: 1 },
  { id: 2, name: 'B', price: 100, categoryId: 2 },
  { id: 3, name: 'C', price: 200, categoryId: 1 },
  { id: 4, name: 'D', price: 500, categoryId: 1 },
  { id: 5, name: 'E', price: 50, categoryId: 3 },
];

function _typeTests() {
  // @ts-expect-error value sai kiểu
  query<Product>().where('price', 'abc');
  // @ts-expect-error key lạ
  query<Product>().orderBy('stock');
  // @ts-expect-error whereIn value sai kiểu
  query<Product>().whereIn('categoryId', ['1']);
}

test('ex08 · where + orderBy + limit', () => {
  const r = query<Product>().where('categoryId', 1).orderBy('price', 'desc').limit(2).run(products);
  assert.deepEqual(r.map((p) => p.id), [4, 1]);
});
test('ex08 · whereIn + offset', () => {
  const r = query<Product>().whereIn('categoryId', [1, 3]).orderBy('price').offset(1).limit(2).run(products);
  assert.deepEqual(r.map((p) => p.id), [3, 1]);
});
test('ex08 · builder bất biến', () => {
  const base = query<Product>().where('categoryId', 1);
  const cheap = base.orderBy('price').limit(1);
  assert.equal(base.run(products).length, 3);
  assert.deepEqual(cheap.run(products).map((p) => p.id), [3]);
});
test('ex08 · không mutate input', () => {
  const copy = [...products];
  query<Product>().orderBy('price').run(products);
  assert.deepEqual(products, copy);
});
