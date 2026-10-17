import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CachedProductRepository, LoggingProductRepository, type Product, type ProductRepository } from '../answers/ex08.js';

const makeDb = () => {
  const rows = new Map<number, Product>([[1, { id: 1, name: 'Áo', price: 100 }]]);
  let reads = 0;
  const repo: ProductRepository = {
    findById: async (id) => (reads++, rows.get(id) ?? null),
    update: async (id, patch) => {
      const row = { ...rows.get(id)!, ...patch };
      rows.set(id, row);
      return row;
    },
  };
  return { repo, reads: () => reads };
};

test('ex08 · cache trong TTL, kể cả null', async () => {
  let t = 0;
  const db = makeDb();
  const repo = new CachedProductRepository(db.repo, 1000, () => t);
  await repo.findById(1);
  await repo.findById(1);
  assert.equal(await repo.findById(99), null);
  await repo.findById(99);
  assert.equal(db.reads(), 2);
  t = 1000;
  await repo.findById(1);
  assert.equal(db.reads(), 3);
});
test('ex08 · update làm mới cache', async () => {
  const db = makeDb();
  const repo = new CachedProductRepository(db.repo, 60_000);
  await repo.findById(1);
  await repo.update(1, { price: 200 });
  assert.deepEqual(await repo.findById(1), { id: 1, name: 'Áo', price: 200 });
  assert.equal(db.reads(), 1);
});
test('ex08 · bọc nhiều lớp', async () => {
  const db = makeDb();
  const log: string[] = [];
  const repo: ProductRepository = new CachedProductRepository(new LoggingProductRepository(db.repo, log), 60_000);
  await repo.findById(1);
  await repo.findById(1);
  await repo.update(1, { name: 'Áo mới' });
  assert.deepEqual(log, ['findById 1', 'update 1']);
});
