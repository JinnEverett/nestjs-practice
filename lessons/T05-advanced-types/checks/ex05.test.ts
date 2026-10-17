import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { toUserResponse, type CreateUserDto, type UpdateUserDto, type UserResponse, type UserEntity } from '../answers/ex05.js';

type _c = Expect<Equal<CreateUserDto, { email: string; fullName: string; password: string }>>;
type _u = Expect<Equal<Required<UpdateUserDto>, { fullName: string; password: string }>>;
type _uOpt = Expect<Equal<{} extends UpdateUserDto ? true : false, true>>;
type _r = Expect<Equal<UserResponse, { id: number; email: string; fullName: string; role: 'user' | 'admin'; createdAt: string; updatedAt: string }>>;

const user: UserEntity = {
  id: 1,
  email: 'a@x.vn',
  passwordHash: 'h',
  fullName: 'An',
  role: 'user',
  createdAt: new Date('2026-10-01T00:00:00Z'),
  updatedAt: new Date('2026-10-02T00:00:00Z'),
};

test('ex05 · toUserResponse', () => {
  assert.deepEqual(toUserResponse(user), {
    id: 1,
    email: 'a@x.vn',
    fullName: 'An',
    role: 'user',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  });
});
