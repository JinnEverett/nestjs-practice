import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { requireApiKey, requireRole } from '../answers/ex06.js';
import { serve, call } from '../_lib/http.js';

const KEYS = JSON.parse(`{
  "key-admin-123": { "name": "admin-bot", "roles": ["admin", "read"] },
  "key-reader-456": { "name": "reporter", "roles": ["read"] },
  "__proto__": { "name": "evil", "roles": ["admin"] }
}`);
let s;
before(async () => {
  const a = express();
  a.use(requireApiKey(KEYS));
  a.get('/me', (req, res) => res.json(res.locals.user));
  a.delete('/danger', requireRole('admin'), (req, res) => res.json({ deleted: true }));
  s = await serve(a);
});
after(() => s.close());
const withKey = (key) => ({ headers: key === undefined ? {} : { 'x-api-key': key } });

test('ex06 · khóa hợp lệ → res.locals.user', async () => {
  const r = await call(`${s.url}/me`, withKey('key-reader-456'));
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { name: 'reporter', roles: ['read'] });
});
test('ex06 · thiếu khóa → 401 + WWW-Authenticate', async () => {
  const r = await call(`${s.url}/me`, withKey());
  assert.equal(r.status, 401);
  assert.deepEqual(r.json, { error: 'Unauthorized' });
  assert.equal(r.headers.get('www-authenticate'), 'ApiKey');
});
test('ex06 · khóa sai (đúng tiền tố, khác độ dài, rỗng) → 401', async () => {
  for (const bad of ['key-admin-12', 'key-admin-1234', 'x', '', 'KEY-ADMIN-123']) {
    const r = await call(`${s.url}/me`, withKey(bad));
    assert.equal(r.status, 401, JSON.stringify(bad));
  }
});
test('ex06 · khóa kiểu prototype ("constructor", "toString", "hasOwnProperty") → 401, không crash', async () => {
  for (const bad of ['constructor', 'toString', 'hasOwnProperty', 'valueOf']) {
    const r = await call(`${s.url}/me`, withKey(bad));
    assert.equal(r.status, 401, bad);
  }
});
test('ex06 · khóa tên "__proto__" khai báo trong cấu hình vẫn chỉ khớp đúng chuỗi đó', async () => {
  const r = await call(`${s.url}/me`, withKey('__proto__'));
  assert.equal(r.status, 200);
  assert.equal(r.json.name, 'evil');
  assert.equal((await call(`${s.url}/me`, withKey('nope'))).status, 401);
});
test('ex06 · requireRole: đủ quyền → qua; thiếu → 403', async () => {
  const ok = await call(`${s.url}/danger`, { method: 'DELETE', ...withKey('key-admin-123') });
  assert.equal(ok.status, 200);
  const no = await call(`${s.url}/danger`, { method: 'DELETE', ...withKey('key-reader-456') });
  assert.equal(no.status, 403);
  assert.deepEqual(no.json, { error: 'Forbidden' });
});
test('ex06 · requireRole không có user (chưa xác thực) → 403 chứ không crash', async () => {
  const a = express();
  a.get('/x', requireRole('admin'), (req, res) => res.json({}));
  const srv = await serve(a);
  const r = await call(`${srv.url}/x`);
  await srv.close();
  assert.equal(r.status, 403);
});
test('ex06 · không mutate cấu hình keys khi gán roles cho user', async () => {
  const r = await call(`${s.url}/me`, withKey('key-admin-123'));
  r.json.roles.push('hacked');
  const again = await call(`${s.url}/me`, withKey('key-admin-123'));
  assert.deepEqual(again.json.roles, ['admin', 'read']);
});
test('ex06 · hàm so sánh dùng băm + timingSafeEqual (không ném lỗi với khóa độ dài khác nhau và Unicode)', async () => {
  const r = await call(`${s.url}/me`, withKey(encodeURIComponent('khóa-đặc-biệt-😀')));
  assert.equal(r.status, 401);
});
