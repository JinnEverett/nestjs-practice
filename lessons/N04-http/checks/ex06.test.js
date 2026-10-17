import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { conditionalJson } from '../answers/ex06.js';
import { serve } from '../_lib/http.js';

const servers = [];
after(() => Promise.all(servers.map((s) => s.close())));

const DATA = { id: 1, name: 'Áo thun Đen', price: 199000 };
const etagOf = (v) => `"${createHash('sha1').update(JSON.stringify(v)).digest('hex')}"`;
let base;
const url = async () => {
  if (!base) {
    const s = await serve((req, res) => conditionalJson(req, res, DATA));
    servers.push(s);
    base = s.url;
  }
  return base;
};

test('ex06 · lần đầu: 200 + ETag đúng + Cache-Control: no-cache + body', async () => {
  const r = await fetch(await url());
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('etag'), etagOf(DATA));
  assert.equal(r.headers.get('cache-control'), 'no-cache');
  assert.equal(r.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.deepEqual(await r.json(), DATA);
});
test('ex06 · Content-Length là số byte', async () => {
  const r = await fetch(await url());
  await r.text();
  assert.equal(Number(r.headers.get('content-length')), Buffer.byteLength(JSON.stringify(DATA)));
});
test('ex06 · If-None-Match khớp → 304, có ETag, không body', async () => {
  const r = await fetch(await url(), { headers: { 'if-none-match': etagOf(DATA) } });
  assert.equal(r.status, 304);
  assert.equal(r.headers.get('etag'), etagOf(DATA));
  assert.equal(await r.text(), '');
});
test('ex06 · If-None-Match không khớp → 200 đầy đủ', async () => {
  const r = await fetch(await url(), { headers: { 'if-none-match': '"abc"' } });
  assert.equal(r.status, 200);
});
test('ex06 · danh sách ETag, tiền tố W/ và dấu * đều khớp', async () => {
  const e = etagOf(DATA);
  assert.equal((await fetch(await url(), { headers: { 'if-none-match': `"x", ${e}, "y"` } })).status, 304);
  assert.equal((await fetch(await url(), { headers: { 'if-none-match': `W/${e}` } })).status, 304);
  assert.equal((await fetch(await url(), { headers: { 'if-none-match': '*' } })).status, 304);
});
test('ex06 · HEAD: header có ETag, không body', async () => {
  const r = await fetch(await url(), { method: 'HEAD' });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('etag'), etagOf(DATA));
  assert.equal(await r.text(), '');
});
test('ex06 · POST luôn 200 dù có If-None-Match, không đặt ETag', async () => {
  const r = await fetch(await url(), { method: 'POST', headers: { 'if-none-match': etagOf(DATA) } });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('etag'), null);
});
test('ex06 · dữ liệu đổi thì ETag đổi', async () => {
  assert.notEqual(etagOf(DATA), etagOf({ ...DATA, price: 1 }));
  const s = await serve((req, res) => conditionalJson(req, res, { ...DATA, price: 1 }));
  servers.push(s);
  const r = await fetch(s.url, { headers: { 'if-none-match': etagOf(DATA) } });
  assert.equal(r.status, 200);
});
