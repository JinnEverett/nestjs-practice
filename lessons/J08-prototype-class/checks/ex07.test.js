import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BaseRepository, CachedRepository } from '../answers/ex07.js';

const items = () => [
  { id: 1, name: 'a' },
  { id: 2, name: 'b' },
];

test('ex07 · BaseRepository', () => {
  const src = items();
  const repo = new BaseRepository(src);
  assert.deepEqual(repo.findById(2), { id: 2, name: 'b' });
  assert.equal(repo.findById(99), null);
  const all = repo.findAll();
  all.push({ id: 3 });
  assert.equal(repo.findAll().length, 2, 'findAll phải trả bản copy');
  src.push({ id: 4 });
  assert.equal(repo.findAll().length, 2, 'constructor phải lưu bản copy');
});
test('ex07 · CachedRepository gọi super.findById một lần mỗi id', (t) => {
  const spy = t.mock.method(BaseRepository.prototype, 'findById');
  const repo = new CachedRepository(items());
  assert.deepEqual(repo.findById(1), { id: 1, name: 'a' });
  repo.findById(1);
  repo.findById(1);
  assert.equal(repo.findById(99), null);
  repo.findById(99);
  assert.equal(spy.mock.callCount(), 2);
});
test('ex07 · invalidate', (t) => {
  const spy = t.mock.method(BaseRepository.prototype, 'findById');
  const repo = new CachedRepository(items());
  repo.findById(1);
  repo.invalidate(1);
  repo.findById(1);
  assert.equal(spy.mock.callCount(), 2);
});
test('ex07 · là lớp con thật', () => assert.ok(new CachedRepository([]) instanceof BaseRepository));
