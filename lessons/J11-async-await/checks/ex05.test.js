import { test } from 'node:test';
import assert from 'node:assert/strict';
import { retry } from '../answers/ex05.js';

const recorder = () => {
  const delays = [];
  const sleep = async (ms) => {
    delays.push(ms);
  };
  return { delays, sleep };
};

test('ex05 · thành công lần đầu, không chờ', async () => {
  const { delays, sleep } = recorder();
  assert.equal(await retry(async () => 'ok', { sleep }), 'ok');
  assert.deepEqual(delays, []);
});
test('ex05 · thử lại với backoff rồi thành công', async () => {
  const { delays, sleep } = recorder();
  const attempts = [];
  const r = await retry(
    async (attempt) => {
      attempts.push(attempt);
      if (attempt < 3) throw new Error('503');
      return 'ok';
    },
    { sleep },
  );
  assert.equal(r, 'ok');
  assert.deepEqual(attempts, [1, 2, 3]);
  assert.deepEqual(delays, [100, 200]);
});
test('ex05 · hết lượt → lỗi lần cuối', async () => {
  const { delays, sleep } = recorder();
  let n = 0;
  await assert.rejects(
    retry(
      async () => {
        throw new Error(`fail ${++n}`);
      },
      { retries: 2, baseDelayMs: 50, factor: 3, sleep },
    ),
    /fail 3/,
  );
  assert.deepEqual(delays, [50, 150]);
});
test('ex05 · maxDelayMs', async () => {
  const { delays, sleep } = recorder();
  await retry(async () => Promise.reject(new Error('x')), { retries: 5, baseDelayMs: 100, maxDelayMs: 500, sleep }).catch(() => {});
  assert.deepEqual(delays, [100, 200, 400, 500, 500]);
});
test('ex05 · shouldRetry false → ném ngay', async () => {
  const { delays, sleep } = recorder();
  let calls = 0;
  const err = Object.assign(new Error('400 Bad Request'), { status: 400 });
  await assert.rejects(
    retry(
      async () => {
        calls++;
        throw err;
      },
      { sleep, shouldRetry: (e) => e.status >= 500 },
    ),
    (e) => e === err,
  );
  assert.equal(calls, 1);
  assert.deepEqual(delays, []);
});
test('ex05 · sleep mặc định chờ thật', async () => {
  const start = performance.now();
  let n = 0;
  await retry(async () => (++n < 2 ? Promise.reject(new Error('x')) : 'ok'), { baseDelayMs: 30 });
  assert.ok(performance.now() - start >= 25);
});
