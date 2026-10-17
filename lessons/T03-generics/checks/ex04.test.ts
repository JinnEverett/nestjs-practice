import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { InMemoryRepository } from '../answers/ex04.js';

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
}

function _typeTests(repo: InMemoryRepository<Product>) {
  // @ts-expect-error create không nhận id
  repo.create({ id: 5, name: 'x', price: 1, categoryId: 1 });
  // @ts-expect-error thiếu field
  repo.create({ name: 'x' });
  // @ts-expect-error update không đổi id
  repo.update(1, { id: 9 });
  const found = repo.findById(1);
  type _f = Expect<Equal<typeof found, Product | undefined>>;
}

test('ex04 · create tự tăng id, findById', () => {
  const repo = new InMemoryRepository<Product>();
  const a = repo.create({ name: 'Áo', price: 100, categoryId: 1 });
  const b = repo.create({ name: 'Quần', price: 200, categoryId: 2 });
  assert.deepEqual([a.id, b.id], [1, 2]);
  assert.deepEqual(repo.findById(2), { id: 2, name: 'Quần', price: 200, categoryId: 2 });
  assert.equal(repo.findById(9), undefined);
});
test('ex04 · findAll với điều kiện', () => {
  const repo = new InMemoryRepository<Product>();
  repo.create({ name: 'A', price: 1, categoryId: 1 });
  repo.create({ name: 'B', price: 2, categoryId: 2 });
  repo.create({ name: 'C', price: 1, categoryId: 1 });
  assert.deepEqual(repo.findAll({ categoryId: 1, price: 1 }).map((p) => p.name), ['A', 'C']);
  assert.equal(repo.findAll().length, 3);
});
test('ex04 · update / delete', () => {
  const repo = new InMemoryRepository<Product>();
  repo.create({ name: 'A', price: 1, categoryId: 1 });
  assert.deepEqual(repo.update(1, { price: 9 }), { id: 1, name: 'A', price: 9, categoryId: 1 });
  assert.throws(() => repo.update(99, { price: 1 }));
  assert.equal(repo.delete(1), true);
  assert.equal(repo.delete(1), false);
});
test('ex04 · trả bản copy', () => {
  const repo = new InMemoryRepository<Product>();
  const a = repo.create({ name: 'A', price: 1, categoryId: 1 });
  a.price = 999;
  repo.findById(1)!.name = 'hack';
  assert.deepEqual(repo.findById(1), { id: 1, name: 'A', price: 1, categoryId: 1 });
});
