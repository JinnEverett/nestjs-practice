import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import express from 'express';
import { startServer } from '../answers/ex08.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function appWith(handlerMs = 150) {
  const app = express();
  app.get('/fast', (req, res) => res.json({ ok: true }));
  app.get('/slow', (req, res) => setTimeout(() => res.json({ slow: true }), handlerMs));
  app.get('/never', () => {});
  return app;
}
const get = (port, path, agent) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port, path, agent }, (res) => {
    let body = '';
    res.on('data', (c) => { body += c; });
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
  }).on('error', reject);
});
const canConnect = (port) => new Promise((resolve) => {
  const sock = net.connect(port, '127.0.0.1');
  sock.once('connect', () => { sock.destroy(); resolve(true); });
  sock.once('error', () => resolve(false));
});

test('ex08 · startServer listen thật, port 0 → cổng ngẫu nhiên', async () => {
  const s = await startServer(appWith(), { port: 0 });
  assert.ok(s.port > 0);
  assert.equal((await get(s.port, '/fast')).status, 200);
  await s.close();
});
test('ex08 · close() chờ request đang chạy xong (200), kèm Connection: close', async () => {
  const s = await startServer(appWith(150));
  const inflight = get(s.port, '/slow');
  await sleep(40);
  const t0 = performance.now();
  const closing = s.close();
  const r = await inflight;
  assert.equal(r.status, 200);
  assert.equal(JSON.parse(r.body).slow, true);
  assert.equal(String(r.headers.connection).toLowerCase(), 'close');
  const result = await closing;
  assert.equal(result.forced, false);
  assert.ok(performance.now() - t0 >= 80, 'close() resolve quá sớm, không chờ request');
});
test('ex08 · sau close() không nhận kết nối mới', async () => {
  const s = await startServer(appWith(100));
  const inflight = get(s.port, '/slow');
  await sleep(30);
  const closing = s.close();
  await sleep(20);
  assert.equal(await canConnect(s.port), false);
  await inflight;
  await closing;
});
test('ex08 · kết nối keep-alive đang rảnh không giữ close() mãi', async () => {
  const s = await startServer(appWith(), { shutdownTimeoutMs: 3000 });
  const agent = new http.Agent({ keepAlive: true });
  await get(s.port, '/fast', agent); // kết nối vẫn mở (idle)
  const t0 = performance.now();
  const result = await s.close();
  agent.destroy();
  assert.equal(result.forced, false);
  assert.ok(performance.now() - t0 < 1500, 'close() chờ keep-alive quá lâu');
});
test('ex08 · quá shutdownTimeoutMs → đóng cứng, forced = true', async () => {
  const s = await startServer(appWith(), { shutdownTimeoutMs: 120 });
  const hung = get(s.port, '/never').catch((e) => e);
  await sleep(30);
  const t0 = performance.now();
  const result = await s.close();
  assert.equal(result.forced, true);
  assert.ok(performance.now() - t0 < 1500);
  const err = await hung;
  assert.ok(err instanceof Error, 'request treo phải bị ngắt kết nối');
});
test('ex08 · gọi close() nhiều lần trả cùng kết quả', async () => {
  const s = await startServer(appWith());
  const [a, b] = await Promise.all([s.close(), s.close()]);
  assert.deepEqual(a, b);
  assert.deepEqual(await s.close(), a);
});
