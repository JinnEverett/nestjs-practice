import { test } from 'node:test';
import assert from 'node:assert/strict';
import { measureLag } from '../answers/ex03.js';

const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('ex03 · work chặn loop 150ms → maxMs phản ánh được (≥ 100)', async () => {
  const r = await measureLag(async () => {
    await sleep(30);
    busy(150);
    await sleep(30);
  });
  assert.ok(r.maxMs >= 100, `maxMs=${r.maxMs}`);
});
test('ex03 · work chỉ chờ, không chặn → maxMs nhỏ (< 60)', async () => {
  const r = await measureLag(() => sleep(150));
  assert.ok(r.maxMs < 60, `maxMs=${r.maxMs}`);
});
test('ex03 · trả {maxMs, p99Ms} là số, đơn vị ms (không phải ns)', async () => {
  const r = await measureLag(() => sleep(50));
  assert.equal(typeof r.maxMs, 'number');
  assert.equal(typeof r.p99Ms, 'number');
  assert.ok(r.maxMs < 1000);
  assert.ok(r.p99Ms <= r.maxMs + 1);
});
test('ex03 · nhận cả work đồng bộ', async () => {
  const r = await measureLag(() => busy(120));
  assert.ok(r.maxMs >= 80, `maxMs=${r.maxMs}`);
});
test('ex03 · work ném lỗi → ném lại đúng lỗi đó, và monitor được tắt (lần đo sau không dính)', async () => {
  await assert.rejects(measureLag(async () => { busy(120); throw new Error('boom'); }), /boom/);
  await sleep(50);
  const r = await measureLag(() => sleep(100));
  assert.ok(r.maxMs < 60, `lần đo sau còn dính dữ liệu cũ: maxMs=${r.maxMs}`);
});
