import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readBody, parseJsonBody } from '../answers/ex02.js';
import { HttpError } from '../answers/ex01.js';
import { serve } from '../_lib/http.js';

const servers = [];
after(() => Promise.all(servers.map((s) => s.close())));
const start = async (h) => { const s = await serve(h); servers.push(s); return s; };

/** server trả lại kết quả/ lỗi của fn(req) dưới dạng JSON để test dễ assert */
const echo = (fn) => start(async (req, res) => {
  try {
    const value = await fn(req);
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ value: value ?? null, undef: value === undefined }));
  } catch (e) {
    res.writeHead(e instanceof HttpError ? e.status : 500, { 'content-type': 'application/json', connection: 'close' })
      .end(JSON.stringify({ error: e.message, status: e.status, isHttpError: e instanceof HttpError }));
  }
});
const post = (url, body, headers = { 'content-type': 'application/json' }) => fetch(url, { method: 'POST', headers, body });

test('ex02 · readBody đọc đủ UTF-8 nhiều chunk', async () => {
  const s = await echo((req) => readBody(req));
  const text = 'Đơn hàng — '.repeat(2000);
  const r = await (await post(s.url, text, {})).json();
  assert.equal(r.value, text);
});
test('ex02 · readBody: body rỗng → ""', async () => {
  const s = await echo((req) => readBody(req));
  assert.equal((await (await fetch(s.url)).json()).value, '');
});
test('ex02 · readBody: Content-Length khai báo vượt limit → 413', async () => {
  const s = await echo((req) => readBody(req, { limit: 100 }));
  const res = await post(s.url, 'x'.repeat(500), {});
  const r = await res.json();
  assert.equal(r.status, 413);
  assert.equal(r.message ?? r.error, 'Payload Too Large');
});
test('ex02 · readBody: đúng bằng limit thì được', async () => {
  const s = await echo((req) => readBody(req, { limit: 100 }));
  const r = await (await post(s.url, 'x'.repeat(100), {})).json();
  assert.equal(r.value.length, 100);
});
test('ex02 · readBody: chunked (không Content-Length) vượt limit → 413, dừng đọc', async () => {
  const s = await echo((req) => readBody(req, { limit: 1000 }));
  const status = await new Promise((resolve, reject) => {
    const req = http.request(s.url, { method: 'POST' }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject);
    req.write('a'.repeat(600));
    req.write('b'.repeat(600));
    req.end();
  });
  assert.equal(status, 413);
});
test('ex02 · parseJsonBody: JSON hợp lệ (có charset trong content-type, hoa thường)', async () => {
  const s = await echo((req) => parseJsonBody(req));
  const r = await (await post(s.url, '{"a":[1,2],"t":"Đ"}', { 'content-type': 'Application/JSON; charset=utf-8' })).json();
  assert.deepEqual(r.value, { a: [1, 2], t: 'Đ' });
});
test('ex02 · parseJsonBody: body rỗng → undefined', async () => {
  const s = await echo((req) => parseJsonBody(req));
  const r = await (await fetch(s.url, { method: 'POST' })).json();
  assert.equal(r.undef, true);
});
test('ex02 · parseJsonBody: sai content-type → 415', async () => {
  const s = await echo((req) => parseJsonBody(req));
  const r = await (await post(s.url, '{"a":1}', { 'content-type': 'text/plain' })).json();
  assert.equal(r.status, 415);
  assert.equal(r.isHttpError, true);
});
test('ex02 · parseJsonBody: JSON hỏng → 400 Invalid JSON', async () => {
  const s = await echo((req) => parseJsonBody(req));
  const r = await (await post(s.url, '{"a":')).json();
  assert.equal(r.status, 400);
  assert.equal(r.error, 'Invalid JSON');
});
test('ex02 · parseJsonBody: JSON hỏng giữ cause là lỗi parse', async () => {
  let captured;
  const s = await start(async (req, res) => {
    try { await parseJsonBody(req); } catch (e) { captured = e; }
    res.end('ok');
  });
  await post(s.url, 'not json');
  assert.ok(captured.cause instanceof SyntaxError);
});
test('ex02 · parseJsonBody: giá trị JSON falsy (0, false, null) vẫn được trả', async () => {
  const s = await echo((req) => parseJsonBody(req));
  assert.equal((await (await post(s.url, '0')).json()).value, 0);
  assert.equal((await (await post(s.url, 'false')).json()).value, false);
});
