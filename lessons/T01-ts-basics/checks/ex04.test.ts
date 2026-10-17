import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { updateUser, type User, type UserPatch } from '../answers/ex04.js';

type _patch = Expect<Equal<Required<UserPatch>, { name: string; email: string }>>;
type _optional = Expect<Equal<{} extends UserPatch ? true : false, true>>;

function _typeTests(u: User) {
  // @ts-expect-error id là readonly
  u.id = 2;
  // @ts-expect-error patch không được có id
  updateUser(u, { id: 2 });
  // @ts-expect-error field lạ
  updateUser(u, { role: 'admin' });
}

test('ex04 · cập nhật, không mutate', () => {
  const u: User = Object.freeze({ id: 1, name: 'An' });
  const r = updateUser(u, { email: 'a@x.vn' });
  assert.deepEqual(r, { id: 1, name: 'An', email: 'a@x.vn' });
  assert.notEqual(r, u);
});
test('ex04 · undefined không ghi đè', () => {
  const r = updateUser({ id: 1, name: 'An', email: 'a@x.vn' }, { name: undefined, email: 'b@x.vn' });
  assert.deepEqual(r, { id: 1, name: 'An', email: 'b@x.vn' });
});
