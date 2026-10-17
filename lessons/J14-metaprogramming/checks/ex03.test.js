import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createValidatedObject } from '../answers/ex03.js';

const schema = { name: 'string', age: 'number', active: 'boolean' };

test('ex03 · gán đúng kiểu', () => {
  const u = createValidatedObject(schema, { name: 'An' });
  u.age = 30;
  u.active = true;
  assert.deepEqual({ ...u }, { name: 'An', age: 30, active: true });
  assert.equal(JSON.stringify(u), '{"name":"An","age":30,"active":true}');
});
test('ex03 · sai kiểu / field lạ', () => {
  const u = createValidatedObject(schema);
  assert.throws(() => {
    u.age = '30';
  }, TypeError);
  assert.throws(() => {
    u.isAdmin = true;
  }, TypeError);
  assert.equal(u.age, undefined);
  assert.equal('isAdmin' in u, false);
});
test('ex03 · initial cũng được kiểm', () => {
  assert.throws(() => createValidatedObject(schema, { age: 'x' }), TypeError);
  assert.throws(() => createValidatedObject(schema, { role: 'admin' }), TypeError);
});
test('ex03 · không cho xóa', () => {
  const u = createValidatedObject(schema, { name: 'An' });
  assert.throws(() => {
    delete u.name;
  }, TypeError);
  assert.equal(u.name, 'An');
});
