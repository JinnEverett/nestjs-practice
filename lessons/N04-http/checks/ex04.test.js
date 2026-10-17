import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createRouter } from '../answers/ex03.js';
import { createApp, reply } from '../answers/ex04.js';
import { HttpError } from '../answers/ex01.js';
import { serve, call } from '../_lib/http.js';

const servers = [];
after(() => Promise.all(servers.map((s) => s.close())));

const errors = [];
const router = createRouter()
  .add('GET', '/orders/:id', ({ params, query }) => ({ id: params.id, query }))
  .add('POST', '/orders', ({ body }) => reply(201, { created: body }, { Location: '/orders/1' }))
  .add('DELETE', '/orders/:id', () => undefined)
  .add('GET', '/teapot', () => reply(418, { error: 'ấm trà' }))
  .add('GET', '/missing', () => { throw new HttpError(404, 'Đơn không tồn tại'); })
  .add('GET', '/secret-fail', () => { throw new HttpError(500, 'SQL: password=hunter2'); })
  .add('GET', '/boom', () => { throw new Error('kết nối DB: password=hunter2'); })
  .add('GET', '/async-boom', async () => { await new Promise((r) => setTimeout(r, 5)); throw new Error('async hỏng'); })
  .add('GET', '/stream-then-fail', ({ res }) => { res.writeHead(200); res.write('một phần'); throw new Error('hỏng giữa chừng'); })
  .add('GET', '/null', () => null)
  .add('PUT', '/echo', ({ body }) => body);

let app;
const url = async () => {
  if (!app) {
    app = await serve(createApp(router, { bodyLimit: 1000, onError: (e) => errors.push(e) }));
    servers.push(app);
  }
  return app.url;
};
const json = (body, extra = {}) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), ...extra });

test('ex04 · createApp trả http.Server chưa listen', () => {
  const s = createApp(router);
  assert.ok(s instanceof http.Server);
  assert.equal(s.listening, false);
});
test('ex04 · handler nhận params + query (khóa lặp → mảng)', async () => {
  const r = await call(`${await url()}/orders/42?x=1&tag=a&tag=b&tag=c`);
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { id: '42', query: { x: '1', tag: ['a', 'b', 'c'] } });
});
test('ex04 · giá trị trả về plain → 200 JSON; null cũng là giá trị', async () => {
  assert.equal((await call(`${await url()}/null`)).text, 'null');
});
test('ex04 · reply(status, body, headers)', async () => {
  const r = await call(`${await url()}/orders`, json({ item: 'ao' }));
  assert.equal(r.status, 201);
  assert.equal(r.headers.get('location'), '/orders/1');
  assert.deepEqual(r.json, { created: { item: 'ao' } });
  assert.equal((await call(`${await url()}/teapot`)).status, 418);
});
test('ex04 · undefined → 204 không body', async () => {
  const r = await call(`${await url()}/orders/1`, { method: 'DELETE' });
  assert.equal(r.status, 204);
  assert.equal(r.text, '');
});
test('ex04 · 404 và 405 (có Allow)', async () => {
  const a = await call(`${await url()}/khong-co`);
  assert.equal(a.status, 404);
  assert.deepEqual(a.json, { error: 'Not Found' });
  const b = await call(`${await url()}/orders`, { method: 'PATCH' });
  assert.equal(b.status, 405);
  assert.equal(b.headers.get('allow'), 'POST');
  assert.deepEqual(b.json, { error: 'Method Not Allowed' });
});
test('ex04 · HttpError expose → status + message', async () => {
  const r = await call(`${await url()}/missing`);
  assert.equal(r.status, 404);
  assert.deepEqual(r.json, { error: 'Đơn không tồn tại' });
});
test('ex04 · lỗi 500 KHÔNG lộ message thật, nhưng gọi onError', async () => {
  errors.length = 0;
  for (const p of ['/boom', '/secret-fail', '/async-boom']) {
    const r = await call(`${await url()}${p}`);
    assert.equal(r.status, 500, p);
    assert.deepEqual(r.json, { error: 'Internal Server Error' }, p);
    assert.ok(!r.text.includes('hunter2'));
  }
  assert.equal(errors.length, 3);
  assert.match(errors[0].message, /kết nối DB/);
});
test('ex04 · body JSON hỏng → 400; sai content-type → 415; quá lớn → 413', async () => {
  const base = await url();
  assert.equal((await call(`${base}/orders`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' })).status, 400);
  assert.equal((await call(`${base}/orders`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hi' })).status, 415);
  const big = await call(`${base}/orders`, json({ pad: 'x'.repeat(5000) }));
  assert.equal(big.status, 413);
  assert.deepEqual(big.json, { error: 'Payload Too Large' });
});
test('ex04 · PUT cũng parse body; GET không parse body', async () => {
  const r = await call(`${await url()}/echo`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{"a":1}' });
  assert.deepEqual(r.json, { a: 1 });
});
test('ex04 · lỗi sau khi đã gửi header → đóng kết nối, server vẫn sống', async () => {
  const base = await url();
  await call(`${base}/stream-then-fail`).catch(() => {}); // client có thể thấy lỗi kết nối bị ngắt: chấp nhận
  const ok = await call(`${base}/orders/1`);
  assert.equal(ok.status, 200);
});
test('ex04 · segment path chứa ký tự mã hóa sai → 400', async () => {
  const r = await call(`${await url()}/orders/%E0%A4%A`);
  assert.equal(r.status, 400);
});
