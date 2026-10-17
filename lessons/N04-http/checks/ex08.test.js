import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../answers/ex08.js';
import { serve } from '../_lib/http.js';

const servers = [];
after(() => Promise.all(servers.map((s) => s.close())));

/** server dùng limiter; đồng hồ giả điều khiển được */
async function app(opts) {
  const clock = { t: 1_000_000 };
  const check = createRateLimiter({ now: () => clock.t, ...opts });
  const s = await serve((req, res) => {
    if (check(req, res)) return;
    res.writeHead(200).end('ok');
  });
  servers.push(s);
  return { url: s.url, clock, check };
}
const get = (url, headers) => fetch(url, { headers });

test('ex08 · cho qua đến limit, vượt thì 429', async () => {
  const a = await app({ limit: 3, windowMs: 1000 });
  for (let i = 0; i < 3; i++) assert.equal((await get(a.url)).status, 200);
  const r = await get(a.url);
  assert.equal(r.status, 429);
  assert.deepEqual(await r.json(), { error: 'Too Many Requests' });
});
test('ex08 · header X-RateLimit-Limit/Remaining trên cả 200 lẫn 429 (Remaining không âm)', async () => {
  const a = await app({ limit: 2, windowMs: 1000 });
  const r1 = await get(a.url);
  assert.equal(r1.headers.get('x-ratelimit-limit'), '2');
  assert.equal(r1.headers.get('x-ratelimit-remaining'), '1');
  const r2 = await get(a.url);
  assert.equal(r2.headers.get('x-ratelimit-remaining'), '0');
  const r3 = await get(a.url);
  assert.equal(r3.status, 429);
  assert.equal(r3.headers.get('x-ratelimit-remaining'), '0');
  const r4 = await get(a.url);
  assert.equal(r4.headers.get('x-ratelimit-remaining'), '0');
});
test('ex08 · Retry-After = số giây còn lại của cửa sổ, làm tròn lên', async () => {
  const a = await app({ limit: 1, windowMs: 10_000 });
  await get(a.url);
  a.clock.t += 2_500;
  const r = await get(a.url);
  assert.equal(r.status, 429);
  assert.equal(r.headers.get('retry-after'), '8'); // còn 7.5s → 8
});
test('ex08 · hết cửa sổ thì được lại', async () => {
  const a = await app({ limit: 1, windowMs: 1000 });
  assert.equal((await get(a.url)).status, 200);
  assert.equal((await get(a.url)).status, 429);
  a.clock.t += 1000;
  assert.equal((await get(a.url)).status, 200);
});
test('ex08 · cửa sổ tính từ request đầu tiên của client, không reset khi vẫn đang bị chặn', async () => {
  const a = await app({ limit: 1, windowMs: 1000 });
  await get(a.url);
  a.clock.t += 900;
  assert.equal((await get(a.url)).status, 429);
  a.clock.t += 150; // tổng 1050 từ request đầu
  assert.equal((await get(a.url)).status, 200);
});
test('ex08 · mỗi client một bộ đếm riêng (qua X-Forwarded-For khi trustProxy)', async () => {
  const a = await app({ limit: 1, windowMs: 1000, trustProxy: true });
  assert.equal((await get(a.url, { 'x-forwarded-for': '1.1.1.1, 10.0.0.1' })).status, 200);
  assert.equal((await get(a.url, { 'x-forwarded-for': '1.1.1.1' })).status, 429);
  assert.equal((await get(a.url, { 'x-forwarded-for': '2.2.2.2' })).status, 200);
});
test('ex08 · không trustProxy thì bỏ qua X-Forwarded-For (không thể giả mạo để né giới hạn)', async () => {
  const a = await app({ limit: 1, windowMs: 1000, trustProxy: false });
  assert.equal((await get(a.url, { 'x-forwarded-for': '1.1.1.1' })).status, 200);
  assert.equal((await get(a.url, { 'x-forwarded-for': '9.9.9.9' })).status, 429);
});
test('ex08 · dọn bộ nhớ: client hết hạn bị xóa khi cửa sổ trôi qua', async () => {
  const a = await app({ limit: 5, windowMs: 1000, trustProxy: true });
  for (let i = 0; i < 50; i++) await get(a.url, { 'x-forwarded-for': `10.0.0.${i}` });
  assert.equal(a.check.size(), 50);
  a.clock.t += 1500;
  await get(a.url, { 'x-forwarded-for': '99.99.99.99' });
  assert.equal(a.check.size(), 1);
});
test('ex08 · check trả boolean: true = đã chặn', async () => {
  const clock = { t: 0 };
  const check = createRateLimiter({ limit: 1, windowMs: 1000, now: () => clock.t });
  const mk = () => { const h = {}; return { res: { setHeader: (k, v) => { h[k] = v; }, writeHead() {}, end() {} }, h }; };
  const req = { headers: {}, socket: { remoteAddress: '5.5.5.5' } };
  assert.equal(check(req, mk().res), false);
  assert.equal(check(req, mk().res), true);
});
