import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import { requestId, accessLog } from '../answers/ex03.js';
import { serve, call } from '../_lib/http.js';

const servers = [];
after(() => Promise.all(servers.map((s) => s.close())));

async function app(sink) {
  const a = express();
  a.use(requestId(), accessLog(sink));
  a.get('/ok', (req, res) => res.json({ id: req.id }));
  a.get('/missing', (req, res) => res.status(404).json({}));
  a.get('/slow', (req, res) => setTimeout(() => res.json({ slow: true }), 60));
  a.get('/never', () => {});
  const s = await serve(a);
  servers.push(s);
  return s.url;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

test('ex03 · sinh UUID khi client không gửi, có trong req.id và header', async () => {
  const url = await app(() => {});
  const r = await call(`${url}/ok`);
  assert.match(r.headers.get('x-request-id'), UUID);
  assert.equal(r.json.id, r.headers.get('x-request-id'));
});
test('ex03 · mỗi request một id khác nhau', async () => {
  const url = await app(() => {});
  const a = (await call(`${url}/ok`)).headers.get('x-request-id');
  const b = (await call(`${url}/ok`)).headers.get('x-request-id');
  assert.notEqual(a, b);
});
test('ex03 · dùng lại X-Request-Id hợp lệ của client', async () => {
  const url = await app(() => {});
  const r = await call(`${url}/ok`, { headers: { 'x-request-id': 'client-trace_12345' } });
  assert.equal(r.headers.get('x-request-id'), 'client-trace_12345');
  assert.equal(r.json.id, 'client-trace_12345');
});
test('ex03 · X-Request-Id không hợp lệ (ngắn, ký tự lạ, quá dài) bị thay bằng UUID', async () => {
  const url = await app(() => {});
  for (const bad of ['abc', 'has space in it!', 'a'.repeat(65), '<script>alert(1)</script>']) {
    const r = await call(`${url}/ok`, { headers: { 'x-request-id': bad } });
    assert.match(r.headers.get('x-request-id'), UUID, bad);
  }
});
test('ex03 · accessLog gọi sink đúng 1 lần/request với id, method, url, status, ms', async () => {
  const logs = [];
  const url = await app((e) => logs.push(e));
  await call(`${url}/ok?x=1`, { headers: { 'x-request-id': 'trace-id-0001' } });
  await call(`${url}/missing`, { method: 'GET' });
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(logs.length, 2);
  assert.equal(logs[0].id, 'trace-id-0001');
  assert.equal(logs[0].method, 'GET');
  assert.equal(logs[0].url, '/ok?x=1');
  assert.equal(logs[0].status, 200);
  assert.equal(typeof logs[0].ms, 'number');
  assert.equal(logs[1].status, 404);
});
test('ex03 · ms phản ánh thời gian xử lý thật', async () => {
  const logs = [];
  const url = await app((e) => logs.push(e));
  await call(`${url}/slow`);
  await new Promise((r) => setTimeout(r, 30));
  assert.ok(logs[0].ms >= 50 && logs[0].ms < 500, `ms=${logs[0].ms}`);
});
test('ex03 · client ngắt giữa chừng vẫn được log (đúng 1 lần)', async () => {
  const logs = [];
  const url = await app((e) => logs.push(e));
  await new Promise((resolve) => {
    const req = http.get(`${url}/never`);
    req.on('error', () => {});
    setTimeout(() => { req.destroy(); resolve(); }, 40);
  });
  await new Promise((r) => setTimeout(r, 80));
  assert.equal(logs.length, 1);
});
