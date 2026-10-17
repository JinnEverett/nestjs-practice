import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { HttpError, sendJson } from '../answers/ex01.js';
import { serve } from '../_lib/http.js';

const servers = [];
after(() => Promise.all(servers.map((s) => s.close())));
const start = async (h) => { const s = await serve(h); servers.push(s); return s; };

test('ex01 · HttpError: thuộc tính và mặc định expose', () => {
  const e = new HttpError(404, 'Không thấy');
  assert.ok(e instanceof Error);
  assert.equal(e.name, 'HttpError');
  assert.equal(e.status, 404);
  assert.equal(e.message, 'Không thấy');
  assert.equal(e.expose, true);
  assert.equal(new HttpError(500, 'x').expose, false);
  assert.equal(new HttpError(503, 'x', { expose: true }).expose, true);
});
test('ex01 · HttpError giữ cause', () => {
  const cause = new Error('gốc');
  assert.equal(new HttpError(400, 'x', { cause }).cause, cause);
  assert.equal(new HttpError(400, 'x').cause, undefined);
});
test('ex01 · sendJson: status, content-type, body', async () => {
  const s = await start((req, res) => sendJson(res, 201, { ok: true }, { 'X-Test': '1' }));
  const r = await fetch(s.url);
  assert.equal(r.status, 201);
  assert.equal(r.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(r.headers.get('x-test'), '1');
  assert.deepEqual(await r.json(), { ok: true });
});
test('ex01 · sendJson: Content-Length là số BYTE (tiếng Việt)', async () => {
  const body = { message: 'Đơn hàng không tồn tại — xin lỗi' };
  const s = await start((req, res) => sendJson(res, 404, body));
  const r = await fetch(s.url);
  const text = await r.text();
  assert.equal(Number(r.headers.get('content-length')), Buffer.byteLength(JSON.stringify(body)));
  assert.deepEqual(JSON.parse(text), body);
});
test('ex01 · sendJson: body undefined → không content-type, length 0', async () => {
  const s = await start((req, res) => sendJson(res, 204, undefined));
  const r = await fetch(s.url);
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('content-type'), null);
  assert.equal(await r.text(), '');
});
test('ex01 · sendJson: ghi đè được Content-Type', async () => {
  const s = await start((req, res) => sendJson(res, 400, { type: 'x' }, { 'Content-Type': 'application/problem+json' }));
  const r = await fetch(s.url);
  assert.equal(r.headers.get('content-type'), 'application/problem+json');
});
test('ex01 · sendJson: body null và 0 vẫn được gửi (khác undefined)', async () => {
  const s = await start((req, res) => sendJson(res, 200, req.url === '/n' ? null : 0));
  assert.equal(await (await fetch(`${s.url}/n`)).text(), 'null');
  assert.equal(await (await fetch(`${s.url}/z`)).text(), '0');
});
