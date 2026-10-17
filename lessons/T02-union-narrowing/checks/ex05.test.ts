import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { isUser, parseUsers, type User } from '../answers/ex05.js';

type _g = Expect<Equal<ReturnType<typeof parseUsers>, User[]>>;

function _typeTests(x: unknown) {
  if (isUser(x)) {
    const email: string = x.email;
    void email;
  }
}

test('ex05 · isUser', () => {
  assert.equal(isUser({ id: 1, email: 'a@x.vn' }), true);
  assert.equal(isUser({ id: 1, email: 'a@x.vn', name: 'An' }), true);
  for (const bad of [null, 'x', [], { id: '1', email: 'a@x' }, { id: 0, email: 'a@x' }, { id: 1.5, email: 'a@x' }, { id: 1, email: 'ax' }, { id: 1 }, { id: 1, email: 'a@x', name: 5 }]) {
    assert.equal(isUser(bad), false, JSON.stringify(bad));
  }
});
test('ex05 · parseUsers', () => {
  assert.deepEqual(parseUsers('[{"id":1,"email":"a@x"},{"id":"bad"},{"id":2,"email":"b@x","name":"B"}]'), [
    { id: 1, email: 'a@x' },
    { id: 2, email: 'b@x', name: 'B' },
  ]);
  assert.deepEqual(parseUsers('{bad json'), []);
  assert.deepEqual(parseUsers('{"id":1}'), []);
});
