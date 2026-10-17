import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnose } from '../answers/ex08.js';

const series = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));
const healthy = (i) => ({ heapMb: 200 + (i % 3), loopLagMs: 5 + (i % 4), cpuPct: 35, dbPoolWaiting: 0, p99Ms: 120, upstreamMs: 30 });
const noise = (i) => ((i * 7919) % 13) / 13; // xác định, 0..1

test('ex08 · < 5 điểm → insufficient-data', () => {
  const r = diagnose(series(4, healthy));
  assert.equal(r.verdict, 'insufficient-data');
  assert.ok(r.evidence.length > 0);
});
test('ex08 · khỏe mạnh → healthy, evidence rỗng', () => {
  assert.deepEqual(diagnose(series(30, healthy)), { verdict: 'healthy', evidence: [] });
});
test('ex08 · memory-leak: heap tăng đều có nhiễu', () => {
  const r = diagnose(series(30, (i) => ({ ...healthy(i), heapMb: 200 + i * 6 + noise(i) * 10 })));
  assert.equal(r.verdict, 'memory-leak');
  assert.ok(r.evidence.some((e) => /heapMb/.test(e)));
});
test('ex08 · KHÔNG phải leak: heap dao động (tăng rồi GC giảm) dù điểm cuối cao', () => {
  const r = diagnose(series(30, (i) => ({ ...healthy(i), heapMb: 200 + (i % 10) * 20 })));
  assert.notEqual(r.verdict, 'memory-leak');
});
test('ex08 · KHÔNG phải leak: tăng quá chậm (≤ 0.5MB/điểm)', () => {
  const r = diagnose(series(30, (i) => ({ ...healthy(i), heapMb: 500 + i * 0.3 })));
  assert.notEqual(r.verdict, 'memory-leak');
});
test('ex08 · KHÔNG phải leak: ít hơn 10 điểm có heap', () => {
  const r = diagnose(series(9, (i) => ({ ...healthy(i), heapMb: 100 + i * 50 })));
  assert.notEqual(r.verdict, 'memory-leak');
});
test('ex08 · event-loop-blocked: ≥ 3 điểm lag > 100ms', () => {
  const r = diagnose(series(20, (i) => ({ ...healthy(i), loopLagMs: [3, 7, 12].includes(i) ? 450 : 6, cpuPct: 95 })));
  assert.equal(r.verdict, 'event-loop-blocked');
  assert.ok(r.evidence.some((e) => /loopLagMs/.test(e)));
});
test('ex08 · chỉ 2 điểm lag cao → chưa kết luận event-loop-blocked', () => {
  const r = diagnose(series(20, (i) => ({ ...healthy(i), loopLagMs: i < 2 ? 450 : 6 })));
  assert.equal(r.verdict, 'healthy');
});
test('ex08 · pool-exhausted: hàng đợi pool ≥ 30% điểm trong khi CPU thấp', () => {
  const r = diagnose(series(20, (i) => ({ ...healthy(i), dbPoolWaiting: i % 2 ? 8 : 0, cpuPct: 25, p99Ms: 2500 })));
  assert.equal(r.verdict, 'pool-exhausted');
  assert.ok(r.evidence.some((e) => /dbPoolWaiting/.test(e)));
});
test('ex08 · hàng đợi pool nhưng CPU cao → không phải pool-exhausted', () => {
  const r = diagnose(series(20, (i) => ({ ...healthy(i), dbPoolWaiting: 5, cpuPct: 90 })));
  assert.notEqual(r.verdict, 'pool-exhausted');
});
test('ex08 · slow-upstream: p99 cao, upstream chiếm phần lớn, loop khỏe, CPU thấp', () => {
  const r = diagnose(series(20, (i) => ({ ...healthy(i), p99Ms: 4000 + i, upstreamMs: 3800, cpuPct: 15 })));
  assert.equal(r.verdict, 'slow-upstream');
  assert.ok(r.evidence.some((e) => /upstreamMs/.test(e)));
});
test('ex08 · p99 cao nhưng upstream nhanh → không phải slow-upstream', () => {
  const r = diagnose(series(20, (i) => ({ ...healthy(i), p99Ms: 4000, upstreamMs: 50 })));
  assert.notEqual(r.verdict, 'slow-upstream');
});
test('ex08 · ưu tiên: leak thắng event-loop-blocked', () => {
  const r = diagnose(series(30, (i) => ({ ...healthy(i), heapMb: 200 + i * 8, loopLagMs: i % 4 === 0 ? 300 : 5 })));
  assert.equal(r.verdict, 'memory-leak');
});
test('ex08 · ưu tiên: event-loop-blocked thắng pool-exhausted', () => {
  const r = diagnose(series(20, (i) => ({ ...healthy(i), loopLagMs: i < 5 ? 400 : 5, dbPoolWaiting: 6, cpuPct: 30 })));
  assert.equal(r.verdict, 'event-loop-blocked');
});
test('ex08 · thiếu trường: vẫn chạy, chỉ dùng điểm có dữ liệu', () => {
  const r = diagnose(series(20, (i) => ({ loopLagMs: i < 3 ? 500 : 4 })));
  assert.equal(r.verdict, 'event-loop-blocked');
  assert.equal(diagnose(series(20, () => ({}))).verdict, 'healthy');
});
test('ex08 · không mutate samples', () => {
  const s = Object.freeze(series(10, (i) => Object.freeze(healthy(i))));
  assert.doesNotThrow(() => diagnose(s));
});
