import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../answers/ex01.js';
import { serve, call } from '../_lib/http.js';

let s;
before(async () => { s = await serve(createApp()); });
after(() => s.close());
const post = (path, body, headers = { 'content-type': 'application/json' }) => call(`${s.url}${path}`, { method: 'POST', headers, body });

test('ex01 · createApp trả app Express chưa listen', () => {
  const app = createApp();
  assert.equal(typeof app, 'function');
  assert.equal(typeof app.use, 'function');
  assert.equal(typeof app.listen, 'function');
});
test('ex01 · GET /health', async () => {
  const r = await call(`${s.url}/health`);
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { status: 'ok' });
});
test('ex01 · POST /echo trả lại body với 201', async () => {
  const r = await post('/echo', JSON.stringify({ a: 1, tên: 'Đơn' }));
  assert.equal(r.status, 201);
  assert.deepEqual(r.json, { a: 1, tên: 'Đơn' });
});
test('ex01 · POST /echo không body → 400 Body required', async () => {
  const r = await call(`${s.url}/echo`, { method: 'POST' });
  assert.equal(r.status, 400);
  assert.deepEqual(r.json, { error: 'Body required' });
});
test('ex01 · route lạ → 404 JSON', async () => {
  const r = await call(`${s.url}/khong-co`);
  assert.equal(r.status, 404);
  assert.match(r.headers.get('content-type'), /application\/json/);
  assert.deepEqual(r.json, { error: 'Not Found' });
});
test('ex01 · JSON hỏng → 400 Invalid JSON', async () => {
  const r = await post('/echo', '{"a":');
  assert.equal(r.status, 400);
  assert.deepEqual(r.json, { error: 'Invalid JSON' });
});
test('ex01 · body > 10kb → 413', async () => {
  const r = await post('/echo', JSON.stringify({ pad: 'x'.repeat(20_000) }));
  assert.equal(r.status, 413);
  assert.deepEqual(r.json, { error: 'Payload Too Large' });
});
test('ex01 · lỗi đồng bộ và async đều → 500 chung chung, không lộ message', async () => {
  for (const p of ['/boom', '/boom-async']) {
    const r = await call(`${s.url}${p}`);
    assert.equal(r.status, 500, p);
    assert.deepEqual(r.json, { error: 'Internal Server Error' }, p);
    assert.ok(!r.text.includes('nội bộ'), p);
  }
});
test('ex01 · không lộ header X-Powered-By? (không bắt buộc nhưng nên tắt)', async (t) => {
  const r = await call(`${s.url}/health`);
  if (r.headers.get('x-powered-by')) t.diagnostic('Gợi ý: app.disable("x-powered-by") — đừng quảng cáo framework cho kẻ tấn công');
});
