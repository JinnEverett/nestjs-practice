import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { fetchJson } from '../answers/ex07.js';
import { serve } from '../_lib/http.js';

const servers = [];
after(() => Promise.all(servers.map((s) => s.close())));

/** server theo kịch bản: mỗi request lấy bước tiếp theo trong `steps` (bước cuối lặp lại) */
async function scripted(steps) {
  const seen = [];
  const s = await serve(async (req, res) => {
    let body = '';
    for await (const c of req) body += c;
    seen.push({ method: req.method, body, contentType: req.headers['content-type'] });
    const step = steps[Math.min(seen.length - 1, steps.length - 1)];
    if (step === 'hang') return; // không phản hồi
    if (step === 'reset') return req.socket.destroy();
    const [status, payload] = step;
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(payload === undefined ? undefined : JSON.stringify(payload));
  });
  servers.push(s);
  return { url: s.url, seen };
}
const fast = { backoffMs: 1, timeoutMs: 300 };

test('ex07 · 200 → JSON; 204 → undefined', async () => {
  const a = await scripted([[200, { ok: 1 }]]);
  assert.deepEqual(await fetchJson(a.url, fast), { ok: 1 });
  const b = await scripted([[204]]);
  assert.equal(await fetchJson(b.url, fast), undefined);
});
test('ex07 · body object → JSON + content-type', async () => {
  const s = await scripted([[201, { id: 1 }]]);
  assert.deepEqual(await fetchJson(s.url, { ...fast, method: 'POST', body: { name: 'Đ' } }), { id: 1 });
  assert.equal(s.seen[0].method, 'POST');
  assert.equal(s.seen[0].body, '{"name":"Đ"}');
  assert.match(s.seen[0].contentType, /application\/json/);
});
test('ex07 · 503 rồi 200 → thử lại thành công', async () => {
  const s = await scripted([[503, { e: 1 }], [503, { e: 1 }], [200, { ok: true }]]);
  assert.deepEqual(await fetchJson(s.url, { ...fast, retries: 2 }), { ok: true });
  assert.equal(s.seen.length, 3);
});
test('ex07 · hết lượt thử → ném lỗi có status và body', async () => {
  const s = await scripted([[502, { why: 'gateway' }]]);
  await assert.rejects(fetchJson(s.url, { ...fast, retries: 2 }), (e) => {
    assert.equal(e.status, 502);
    assert.match(e.body, /gateway/);
    return true;
  });
  assert.equal(s.seen.length, 3);
});
test('ex07 · 4xx và 500 KHÔNG thử lại', async () => {
  const a = await scripted([[404, { e: 'x' }]]);
  await assert.rejects(fetchJson(a.url, fast), { status: 404 });
  assert.equal(a.seen.length, 1);
  const b = await scripted([[500, { e: 'x' }]]);
  await assert.rejects(fetchJson(b.url, fast), { status: 500 });
  assert.equal(b.seen.length, 1);
});
test('ex07 · lỗi mạng (socket bị reset) được thử lại', async () => {
  const s = await scripted(['reset', [200, { ok: true }]]);
  assert.deepEqual(await fetchJson(s.url, { ...fast, retries: 1 }), { ok: true });
  assert.equal(s.seen.length, 2);
});
test('ex07 · timeout → TimeoutError; có thử lại theo retries', async () => {
  const s = await scripted(['hang']);
  await assert.rejects(fetchJson(s.url, { timeoutMs: 40, retries: 1, backoffMs: 1 }), { name: 'TimeoutError' });
  assert.equal(s.seen.length, 2);
});
test('ex07 · POST không idempotent KHÔNG thử lại; có idempotent:true thì có', async () => {
  const a = await scripted([[503, {}], [200, { ok: 1 }]]);
  await assert.rejects(fetchJson(a.url, { ...fast, method: 'POST', body: {} }), { status: 503 });
  assert.equal(a.seen.length, 1);
  const b = await scripted([[503, {}], [200, { ok: 1 }]]);
  assert.deepEqual(await fetchJson(b.url, { ...fast, method: 'POST', body: {}, idempotent: true }), { ok: 1 });
  assert.equal(b.seen.length, 2);
});
test('ex07 · backoff tăng dần (khoảng cách giữa các lần ≥ backoffMs·2^k)', async () => {
  const times = [];
  const s = await serve((req, res) => { times.push(performance.now()); res.writeHead(503).end(); });
  servers.push(s);
  await assert.rejects(fetchJson(s.url, { retries: 2, backoffMs: 40, timeoutMs: 500 }));
  assert.equal(times.length, 3);
  assert.ok(times[1] - times[0] >= 35, `lần 1→2: ${times[1] - times[0]}`);
  assert.ok(times[2] - times[1] >= 75, `lần 2→3: ${times[2] - times[1]}`);
});
