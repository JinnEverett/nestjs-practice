import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toUserResponse } from '../answers/ex03.js';

const makeUser = () => ({
  id: 7,
  email: 'an@x.vn',
  passwordHash: '$argon2id$secret',
  profile: { fullName: 'Nguyễn An', avatarUrl: 'https://cdn/a.png' },
  address: { city: 'Hà Nội' },
  roles: ['user', 'admin'],
  createdAt: new Date('2026-10-01T03:00:00Z'),
  internalNote: 'VIP',
});

test('ex03 · map đủ field', () => {
  assert.deepEqual(toUserResponse(makeUser()), {
    id: 7,
    email: 'an@x.vn',
    fullName: 'Nguyễn An',
    avatarUrl: 'https://cdn/a.png',
    city: 'Hà Nội',
    roles: ['user', 'admin'],
    createdAt: '2026-10-01T03:00:00.000Z',
  });
});
test('ex03 · không có passwordHash hay field lạ', () => {
  const r = toUserResponse(makeUser());
  assert.equal('passwordHash' in r, false);
  assert.equal('internalNote' in r, false);
  assert.equal(JSON.stringify(r).includes('argon2'), false);
});
test('ex03 · field thiếu → null / []', () => {
  const u = { id: 1, email: 'b@x.vn', passwordHash: 'h', profile: { fullName: 'B' }, createdAt: new Date(0) };
  const r = toUserResponse(u);
  assert.equal(r.avatarUrl, null);
  assert.equal(r.city, null);
  assert.deepEqual(r.roles, []);
});
test('ex03 · roles là mảng mới, không mutate input', () => {
  const u = makeUser();
  const r = toUserResponse(u);
  r.roles.push('hacker');
  assert.deepEqual(u.roles, ['user', 'admin']);
  assert.equal(u.passwordHash, '$argon2id$secret');
});
