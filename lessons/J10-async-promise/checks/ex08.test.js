import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCoalescingCache } from '../answers/ex08.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('ex08 · 100 get đồng thời → fetcher chạy 1 lần', async () => {
  let calls = 0;
  const cache = createCoalescingCache(async (key) => {
    calls++;
    await sleep(20);
    return `price:${key}`;
  });
  const results = await Promise.all(Array.from({ length: 100 }, () => cache.get(42)));
  assert.equal(calls, 1);
  assert.ok(results.every((r) => r === 'price:42'));
});
test('ex08 · đã có trong cache thì không gọi lại', async () => {
  let calls = 0;
  const cache = createCoalescingCache(async () => ++calls);
  await cache.get('a');
  await cache.get('a');
  assert.equal(calls, 1);
});
test('ex08 · TTL', async () => {
  let t = 0;
  let calls = 0;
  const cache = createCoalescingCache(async () => ++calls, { ttlMs: 1000, now: () => t });
  await cache.get('a');
  t = 999;
  await cache.get('a');
  assert.equal(calls, 1);
  t = 1000;
  assert.equal(await cache.get('a'), 2);
});
test('ex08 · lỗi: mọi caller nhận lỗi, không cache lỗi', async () => {
  let calls = 0;
  const cache = createCoalescingCache(async () => {
    calls++;
    await sleep(10);
    if (calls === 1) throw new Error('db down');
    return 'ok';
  });
  const settled = await Promise.allSettled([cache.get('k'), cache.get('k'), cache.get('k')]);
  assert.ok(settled.every((s) => s.status === 'rejected' && s.reason.message === 'db down'));
  assert.equal(calls, 1);
  assert.equal(await cache.get('k'), 'ok');
  assert.equal(calls, 2);
});
test('ex08 · key khác nhau độc lập', async () => {
  const seen = [];
  const cache = createCoalescingCache(async (k) => (seen.push(k), k * 2));
  assert.deepEqual(await Promise.all([cache.get(1), cache.get(2), cache.get(1)]), [2, 4, 2]);
  assert.deepEqual(seen.toSorted(), [1, 2]);
});
