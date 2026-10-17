import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { errorHandler, notFound } from '../answers/ex05.js';
import { serve, call } from '../_lib/http.js';

const servers = [];
after(() => Promise.all(servers.map((s) => s.close())));

async function app(onError) {
  const a = express();
  a.use((req, res, next) => { req.id = 'req-id-12345'; next(); });
  a.post('/json', express.json({ limit: '100b' }), (req, res) => res.json(req.body));
  a.get('/expose', () => { throw Object.assign(new Error('Đơn không tồn tại'), { status: 404, expose: true }); });
  a.get('/expose-teapot', () => { throw Object.assign(new Error('ấm trà'), { status: 418, expose: true }); });
  a.get('/secret', () => { throw Object.assign(new Error('SQL: password=hunter2'), { status: 500 }); });
  a.get('/plain', () => { throw new Error('boom nội bộ'); });
  a.get('/async', async () => { throw new Error('async nội bộ'); });
  a.get('/partial', (req, res) => { res.write('một phần'); throw new Error('hỏng giữa chừng'); });
  a.use(notFound());
  a.use(errorHandler({ onError }));
  const s = await serve(a);
  servers.push(s);
  return s.url;
}

test('ex05 · notFound → 404 JSON', async () => {
  const r = await call(`${await app()}/khong-co`);
  assert.equal(r.status, 404);
  assert.deepEqual(r.json, { error: 'Not Found' });
});
test('ex05 · lỗi expose → đúng status + message', async () => {
  const url = await app();
  const a = await call(`${url}/expose`);
  assert.equal(a.status, 404);
  assert.deepEqual(a.json, { error: 'Đơn không tồn tại' });
  assert.equal((await call(`${url}/expose-teapot`)).status, 418);
});
test('ex05 · lỗi body-parser: JSON hỏng → 400 Invalid JSON; quá lớn → 413', async () => {
  const url = await app();
  const bad = await call(`${url}/json`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"a":' });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.json, { error: 'Invalid JSON' });
  const big = await call(`${url}/json`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pad: 'x'.repeat(500) }) });
  assert.equal(big.status, 413);
  assert.deepEqual(big.json, { error: 'Payload Too Large' });
});
test('ex05 · lỗi lạ (kể cả có status 500 hay async) → 500 chung chung, gọi onError, không lộ message', async () => {
  const seen = [];
  const url = await app((err, req) => seen.push({ message: err.message, id: req.id }));
  for (const p of ['/plain', '/secret', '/async']) {
    const r = await call(`${url}${p}`);
    assert.equal(r.status, 500, p);
    assert.deepEqual(r.json, { error: 'Internal Server Error' }, p);
    assert.ok(!/hunter2|nội bộ/.test(r.text), p);
  }
  assert.equal(seen.length, 3);
  assert.equal(seen[0].id, 'req-id-12345');
  assert.match(seen[0].message, /boom nội bộ/);
});
test('ex05 · lỗi có expose KHÔNG gọi onError', async () => {
  let n = 0;
  const url = await app(() => { n++; });
  await call(`${url}/expose`);
  assert.equal(n, 0);
});
test('ex05 · có req.id thì gắn X-Request-Id vào response lỗi', async () => {
  const url = await app();
  const r = await call(`${url}/plain`);
  assert.equal(r.headers.get('x-request-id'), 'req-id-12345');
});
test('ex05 · headersSent: không ghi thêm, kết nối bị đóng, server vẫn sống', async () => {
  const url = await app();
  await call(`${url}/partial`).catch(() => {});
  assert.equal((await call(`${url}/expose`)).status, 404);
});
