import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Entity, Sealed, getTableName } from '../answers/ex01.js';

@Entity('users')
class User {}

@Sealed
class Locked {
  hello() {
    return 'hi';
  }
}

class Plain {}

test('ex01 · Entity', () => {
  assert.equal(getTableName(User), 'users');
  assert.throws(() => getTableName(Plain));
});
test('ex01 · Sealed', () => {
  assert.equal(new Locked().hello(), 'hi');
  assert.throws(() => {
    (Locked as unknown as Record<string, unknown>).extra = 1;
  }, TypeError);
  assert.throws(() => {
    (Locked.prototype as unknown as Record<string, unknown>).bye = () => 'bye';
  }, TypeError);
});
