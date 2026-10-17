import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { pick } from '../answers/ex03.js';

const user = { id: 1, name: 'An', passwordHash: 'x', age: 30 };
const r = pick(user, ['id', 'name']);
type _r = Expect<Equal<typeof r, { id: number; name: string }>>;

function _typeTests() {
  // @ts-expect-error key không tồn tại
  pick(user, ['email']);
}

test('ex03 · pick', () => {
  assert.deepEqual(r, { id: 1, name: 'An' });
  assert.equal('passwordHash' in r, false);
});
