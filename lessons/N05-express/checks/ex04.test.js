import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { ordersRouter } from '../answers/ex04.js';
import { serve, call } from '../_lib/http.js';

function memoryStore() {
  const rows = new Map();
  let seq = 0;
  return {
    list: () => [...rows.values()],
    get: (id) => rows.get(id),
    create: (data) => { const o = { id: ++seq, ...data }; rows.set(o.id, o); return o; },
    update: (id, patch) => { const o = { ...rows.get(id), ...patch, id }; rows.set(id, o); return o; },
    remove: (id) => rows.delete(id),
  };
}

let s;
before(async () => {
  const app = express();
  app.use('/orders', ordersRouter(memoryStore()));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.expose) return res.status(err.status).json({ error: err.message });
    res.status(500).json({ error: 'internal', detail: err.message });
  });
  s = await serve(app);
});
after(() => s.close());
const j = (method, path, body) => call(`${s.url}${path}`, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });

test('ex04 · danh sách rỗng ban đầu', async () => {
  const r = await j('GET', '/orders');
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, []);
});
test('ex04 · POST → 201 + Location + body có id', async () => {
  const r = await j('POST', '/orders', { item: 'áo', qty: 2 });
  assert.equal(r.status, 201);
  assert.deepEqual(r.json, { id: 1, item: 'áo', qty: 2 });
  assert.equal(r.headers.get('location'), '/orders/1');
});
test('ex04 · GET /:id', async () => {
  const r = await j('GET', '/orders/1');
  assert.equal(r.status, 200);
  assert.equal(r.json.item, 'áo');
});
test('ex04 · PATCH /:id cập nhật một phần', async () => {
  const r = await j('PATCH', '/orders/1', { qty: 5 });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { id: 1, item: 'áo', qty: 5 });
});
test('ex04 · id không hợp lệ → 400 cho MỌI route có :id (router.param)', async () => {
  for (const [m, p] of [['GET', '/orders/abc'], ['PATCH', '/orders/-1'], ['DELETE', '/orders/0'], ['GET', '/orders/1.5'], ['GET', '/orders/01']]) {
    const r = await j(m, p, m === 'PATCH' ? {} : undefined);
    assert.equal(r.status, 400, `${m} ${p}`);
    assert.deepEqual(r.json, { error: 'Invalid id' }, `${m} ${p}`);
  }
});
test('ex04 · không tồn tại → 404 cho GET/PATCH/DELETE', async () => {
  for (const m of ['GET', 'PATCH', 'DELETE']) {
    const r = await j(m, '/orders/999', m === 'PATCH' ? {} : undefined);
    assert.equal(r.status, 404, m);
    assert.deepEqual(r.json, { error: 'Order not found' }, m);
  }
});
test('ex04 · DELETE → 204 rồi GET → 404', async () => {
  assert.equal((await j('DELETE', '/orders/1')).status, 204);
  assert.equal((await j('GET', '/orders/1')).status, 404);
});
test('ex04 · danh sách phản ánh thay đổi', async () => {
  await j('POST', '/orders', { item: 'quần' });
  const r = await j('GET', '/orders');
  assert.deepEqual(r.json.map((o) => o.item), ['quần']);
});
