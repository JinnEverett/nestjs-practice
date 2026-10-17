import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withTimestamps, withSoftDelete } from '../answers/ex06.js';

class Entity {
  constructor(id, title) {
    this.id = id;
    this.title = title;
  }
}

test('ex06 · timestamps', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1000 });
  const Stamped = withTimestamps(Entity);
  const e = new Stamped(1, 'a');
  assert.equal(e.id, 1);
  assert.equal(e.title, 'a');
  assert.equal(e.createdAt.getTime(), 1000);
  assert.equal(e.updatedAt.getTime(), 1000);
  t.mock.timers.tick(500);
  e.touch();
  assert.equal(e.updatedAt.getTime(), 1500);
  assert.equal(e.createdAt.getTime(), 1000);
});
test('ex06 · soft delete', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 2000 });
  const S = withSoftDelete(Entity);
  const e = new S(1, 'a');
  assert.equal(e.deletedAt, null);
  assert.equal(e.isDeleted, false);
  e.softDelete();
  assert.equal(e.isDeleted, true);
  assert.equal(e.deletedAt.getTime(), 2000);
  e.restore();
  assert.equal(e.isDeleted, false);
  assert.equal(e.deletedAt, null);
});
test('ex06 · kết hợp 2 mixin và kế thừa thêm', () => {
  class Post extends withSoftDelete(withTimestamps(Entity)) {
    summary() {
      return `${this.id}:${this.title}`;
    }
  }
  const p = new Post(7, 'Hello');
  assert.equal(p.summary(), '7:Hello');
  assert.ok(p instanceof Entity);
  assert.ok(p.createdAt instanceof Date);
  p.softDelete();
  assert.equal(p.isDeleted, true);
});
