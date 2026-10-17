import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../answers/ex08.js';

const clock = (start = 0) => {
  let t = start;
  const now = () => t;
  now.advance = (ms) => (t += ms);
  return now;
};

test('ex08 · cho phép tối đa limit lượt trong cửa sổ', () => {
  const now = clock(1000);
  const rl = createRateLimiter({ limit: 3, windowMs: 60_000, now });
  assert.deepEqual([1, 2, 3, 4].map(() => rl.tryConsume('ip1')), [true, true, true, false]);
});
test('ex08 · remaining', () => {
  const now = clock();
  const rl = createRateLimiter({ limit: 2, windowMs: 1000, now });
  assert.equal(rl.remaining('new'), 2);
  rl.tryConsume('a');
  assert.equal(rl.remaining('a'), 1);
  rl.tryConsume('a');
  rl.tryConsume('a');
  assert.equal(rl.remaining('a'), 0);
});
test('ex08 · hết cửa sổ thì đếm lại', () => {
  const now = clock(5000);
  const rl = createRateLimiter({ limit: 1, windowMs: 1000, now });
  assert.equal(rl.tryConsume('a'), true);
  now.advance(999);
  assert.equal(rl.tryConsume('a'), false);
  now.advance(1);
  assert.equal(rl.remaining('a'), 1);
  assert.equal(rl.tryConsume('a'), true);
});
test('ex08 · cửa sổ tính từ lượt đầu, không phải từ mốc 0', () => {
  const now = clock(1500);
  const rl = createRateLimiter({ limit: 1, windowMs: 1000, now });
  rl.tryConsume('a');
  now.advance(600); // t = 2100: vẫn trong cửa sổ [1500, 2500)
  assert.equal(rl.tryConsume('a'), false);
});
test('ex08 · các key độc lập', () => {
  const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: clock() });
  assert.equal(rl.tryConsume('a'), true);
  assert.equal(rl.tryConsume('b'), true);
  assert.equal(rl.tryConsume('a'), false);
});
test('ex08 · hai limiter độc lập', () => {
  const now = clock();
  const a = createRateLimiter({ limit: 1, windowMs: 1000, now });
  const b = createRateLimiter({ limit: 1, windowMs: 1000, now });
  a.tryConsume('x');
  assert.equal(b.tryConsume('x'), true);
});
