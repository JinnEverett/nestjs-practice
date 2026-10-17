import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { applyCors } from '../answers/ex05.js';
import { serve } from '../_lib/http.js';

const servers = [];
after(() => Promise.all(servers.map((s) => s.close())));

async function app(options) {
  const s = await serve((req, res) => {
    if (applyCors(req, res, options)) return;
    res.writeHead(200, { 'content-type': 'text/plain' }).end('handler');
  });
  servers.push(s);
  return s.url;
}
const ALLOWED = 'https://app.shop.vn';

test('ex05 · không có Origin → không đặt header CORS, đi tiếp handler', async () => {
  const r = await fetch(await app({ origins: [ALLOWED] }));
  assert.equal(r.headers.get('access-control-allow-origin'), null);
  assert.equal(await r.text(), 'handler');
});
test('ex05 · origin được phép: echo origin + Vary: Origin, đi tiếp handler', async () => {
  const r = await fetch(await app({ origins: [ALLOWED, 'https://admin.shop.vn'] }), { headers: { origin: ALLOWED } });
  assert.equal(r.headers.get('access-control-allow-origin'), ALLOWED);
  assert.match(r.headers.get('vary') ?? '', /Origin/i);
  assert.equal(await r.text(), 'handler');
});
test('ex05 · origin lạ → không có Allow-Origin', async () => {
  const r = await fetch(await app({ origins: [ALLOWED] }), { headers: { origin: 'https://evil.example' } });
  assert.equal(r.headers.get('access-control-allow-origin'), null);
});
test('ex05 · origins chứa "*" → Allow-Origin: *', async () => {
  const r = await fetch(await app({ origins: ['*'] }), { headers: { origin: 'https://bat-ky.example' } });
  assert.equal(r.headers.get('access-control-allow-origin'), '*');
});
test('ex05 · preflight hợp lệ → 204, Allow-Methods/Headers/Max-Age, handler KHÔNG chạy', async () => {
  const r = await fetch(await app({ origins: [ALLOWED] }), {
    method: 'OPTIONS',
    headers: { origin: ALLOWED, 'access-control-request-method': 'PUT', 'access-control-request-headers': 'content-type' },
  });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), ALLOWED);
  assert.equal(r.headers.get('access-control-allow-methods'), 'GET, POST, PUT, PATCH, DELETE');
  assert.equal(r.headers.get('access-control-allow-headers'), 'Content-Type, Authorization');
  assert.equal(r.headers.get('access-control-max-age'), '600');
  assert.equal(await r.text(), '');
});
test('ex05 · cấu hình methods/headers/maxAge tùy biến', async () => {
  const r = await fetch(await app({ origins: [ALLOWED], methods: ['GET'], headers: ['X-Token'], maxAge: 5 }), {
    method: 'OPTIONS', headers: { origin: ALLOWED, 'access-control-request-method': 'GET' },
  });
  assert.equal(r.headers.get('access-control-allow-methods'), 'GET');
  assert.equal(r.headers.get('access-control-allow-headers'), 'X-Token');
  assert.equal(r.headers.get('access-control-max-age'), '5');
});
test('ex05 · preflight từ origin lạ: 204 nhưng KHÔNG có Allow-Origin', async () => {
  const r = await fetch(await app({ origins: [ALLOWED] }), {
    method: 'OPTIONS', headers: { origin: 'https://evil.example', 'access-control-request-method': 'GET' },
  });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('access-control-allow-origin'), null);
});
test('ex05 · OPTIONS không phải preflight (thiếu Access-Control-Request-Method) → đi tiếp handler', async () => {
  const r = await fetch(await app({ origins: [ALLOWED] }), { method: 'OPTIONS', headers: { origin: ALLOWED } });
  assert.equal(await r.text(), 'handler');
});
test('ex05 · applyCors trả đúng boolean', () => {
  const fakeRes = () => { const h = {}; return { setHeader: (k, v) => { h[k] = v; }, writeHead() {}, end() {}, h }; };
  assert.equal(applyCors({ method: 'GET', headers: {} }, fakeRes(), { origins: [ALLOWED] }), false);
  assert.equal(applyCors({ method: 'OPTIONS', headers: { origin: ALLOWED, 'access-control-request-method': 'GET' } }, fakeRes(), { origins: [ALLOWED] }), true);
});
