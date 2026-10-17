import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { validate } from '../answers/ex07.js';
import { serve, call } from '../_lib/http.js';

const schema = {
  body: {
    name: { type: 'string', min: 1, max: 10 },
    qty: { type: 'int', min: 1, max: 100 },
    price: { type: 'number', min: 0 },
    gift: { type: 'boolean', optional: true },
    note: { type: 'string', optional: true, max: 5 },
  },
  query: { page: { type: 'string', optional: true } },
};
let s;
before(async () => {
  const a = express();
  a.use(express.json());
  a.post('/orders', validate(schema), (req, res) => res.json({ body: req.body }));
  s = await serve(a);
});
after(() => s.close());
const post = (body, path = '/orders') => call(`${s.url}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const ok = { name: 'Áo', qty: 2, price: 99.5 };

test('ex07 · hợp lệ → qua, body chỉ giữ field trong schema (whitelist)', async () => {
  const r = await post({ ...ok, isAdmin: true, __proto__x: 1, extra: { a: 1 } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.body, ok);
});
test('ex07 · field optional có mặt thì được giữ', async () => {
  const r = await post({ ...ok, gift: false, note: 'ghi' });
  assert.deepEqual(r.json.body, { ...ok, gift: false, note: 'ghi' });
});
test('ex07 · thiếu field bắt buộc → 400 liệt kê MỌI lỗi theo thứ tự schema', async () => {
  const r = await post({ qty: 'x' });
  assert.equal(r.status, 400);
  assert.equal(r.json.error, 'Validation failed');
  assert.deepEqual(r.json.details.map((d) => d.path), ['body.name', 'body.qty', 'body.price']);
  for (const d of r.json.details) assert.equal(typeof d.message, 'string');
});
test('ex07 · string không tự ép kiểu số; int không nhận chuỗi số, số thực, NaN/Infinity', async () => {
  const bad = [
    { ...ok, name: 5 },
    { ...ok, qty: '5' },
    { ...ok, qty: 1.5 },
    { ...ok, price: '9' },
    { ...ok, gift: 'true' },
    { ...ok, name: null },
  ];
  for (const b of bad) assert.equal((await post(b)).status, 400, JSON.stringify(b));
});
test('ex07 · min/max: độ dài với string, giá trị với số', async () => {
  assert.equal((await post({ ...ok, name: '' })).status, 400);
  assert.equal((await post({ ...ok, name: 'x'.repeat(11) })).status, 400);
  assert.equal((await post({ ...ok, name: 'x'.repeat(10) })).status, 200);
  assert.equal((await post({ ...ok, qty: 0 })).status, 400);
  assert.equal((await post({ ...ok, qty: 101 })).status, 400);
  assert.equal((await post({ ...ok, price: -1 })).status, 400);
  assert.equal((await post({ ...ok, price: 0 })).status, 200);
  assert.equal((await post({ ...ok, note: 'toolong' })).status, 400);
});
test('ex07 · optional có giá trị sai kiểu vẫn là lỗi', async () => {
  assert.equal((await post({ ...ok, gift: 'yes' })).status, 400);
});
test('ex07 · body không phải object → 400', async () => {
  for (const b of [[], 'text', 5, null]) assert.equal((await post(b)).status, 400, JSON.stringify(b));
});
test('ex07 · không dùng chung đối tượng: hai request độc lập', async () => {
  const [a, b] = await Promise.all([post({ ...ok, name: 'A' }), post({ ...ok, name: 'B' })]);
  assert.equal(a.json.body.name, 'A');
  assert.equal(b.json.body.name, 'B');
});
test('ex07 · field __proto__ trong body không làm ô nhiễm kết quả', async () => {
  const r = await call(`${s.url}/orders`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"name":"A","qty":1,"price":1,"__proto__":{"polluted":true}}' });
  assert.equal(r.status, 200);
  assert.equal(({}).polluted, undefined);
  assert.equal(Object.hasOwn(r.json.body, '__proto__'), false);
});
