import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBatcher } from '../answers/ex08.js';

const usersDb = new Map([
  [1, 'An'],
  [2, 'Bình'],
  [3, 'Chi'],
]);
const makeBatchFn = () => {
  const calls = [];
  const fn = async (keys) => {
    calls.push([...keys]);
    return keys.map((k) => usersDb.get(k) ?? new Error(`user ${k} not found`));
  };
  return { fn, calls };
};

test('ex08 · gom các load cùng tick thành 1 batch', async () => {
  const { fn, calls } = makeBatchFn();
  const b = createBatcher(fn);
  assert.deepEqual(await Promise.all([b.load(1), b.load(2), b.load(3)]), ['An', 'Bình', 'Chi']);
  assert.deepEqual(calls, [[1, 2, 3]]);
});
test('ex08 · key trùng chỉ gửi một lần', async () => {
  const { fn, calls } = makeBatchFn();
  const b = createBatcher(fn);
  assert.deepEqual(await Promise.all([b.load(1), b.load(1), b.load(2)]), ['An', 'An', 'Bình']);
  assert.deepEqual(calls, [[1, 2]]);
});
test('ex08 · maxBatchSize chia batch', async () => {
  const calls = [];
  const b = createBatcher(async (keys) => (calls.push(keys.length), keys), { maxBatchSize: 100 });
  const r = await Promise.all(Array.from({ length: 250 }, (_, i) => b.load(i)));
  assert.equal(r[249], 249);
  assert.deepEqual(calls, [100, 100, 50]);
});
test('ex08 · maxWaitMs gom các load cách nhau', async () => {
  const { fn, calls } = makeBatchFn();
  const b = createBatcher(fn, { maxWaitMs: 30 });
  const p1 = b.load(1);
  await new Promise((r) => setTimeout(r, 10));
  const p2 = b.load(2);
  await Promise.all([p1, p2]);
  assert.deepEqual(calls, [[1, 2]]);
});
test('ex08 · Error trong kết quả → chỉ load đó reject', async () => {
  const { fn } = makeBatchFn();
  const b = createBatcher(fn);
  const [ok, missing] = await Promise.allSettled([b.load(1), b.load(99)]);
  assert.equal(ok.value, 'An');
  assert.match(missing.reason.message, /user 99 not found/);
});
test('ex08 · batchFn lỗi hoặc sai độ dài → cả batch reject', async () => {
  const b = createBatcher(async () => {
    throw new Error('db down');
  });
  const rs = await Promise.allSettled([b.load(1), b.load(2)]);
  assert.ok(rs.every((r) => r.status === 'rejected' && r.reason.message === 'db down'));
  const b2 = createBatcher(async () => ['only one']);
  const rs2 = await Promise.allSettled([b2.load(1), b2.load(2)]);
  assert.ok(rs2.every((r) => r.status === 'rejected'));
});
test('ex08 · batch sau độc lập với batch trước', async () => {
  const { fn, calls } = makeBatchFn();
  const b = createBatcher(fn);
  await b.load(1);
  await b.load(2);
  assert.deepEqual(calls, [[1], [2]]);
});
