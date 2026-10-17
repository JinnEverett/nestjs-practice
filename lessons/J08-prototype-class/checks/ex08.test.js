import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TokenBucket } from '../answers/ex08.js';

const clock = (t = 0) => {
  const now = () => t;
  now.advance = (ms) => (t += ms);
  return now;
};

test('ex08 · bắt đầu đầy, trừ dần', () => {
  const b = new TokenBucket({ capacity: 3, refillPerSecond: 1, now: clock() });
  assert.equal(b.available, 3);
  assert.equal(b.tryRemove(), true);
  assert.equal(b.tryRemove(2), true);
  assert.equal(b.tryRemove(), false);
  assert.equal(b.available, 0);
});
test('ex08 · không đủ thì không trừ', () => {
  const b = new TokenBucket({ capacity: 5, refillPerSecond: 1, now: clock() });
  assert.equal(b.tryRemove(6), false);
  assert.equal(b.available, 5);
});
test('ex08 · nạp lại theo thời gian, không vượt capacity', () => {
  const now = clock(10_000);
  const b = new TokenBucket({ capacity: 4, refillPerSecond: 2, now });
  b.tryRemove(4);
  now.advance(500);
  assert.equal(b.available, 1);
  now.advance(250);
  assert.equal(b.available, 1);
  assert.equal(b.tryRemove(), true);
  now.advance(60_000);
  assert.equal(b.available, 4);
});
test('ex08 · nạp phần lẻ được cộng dồn', () => {
  const now = clock();
  const b = new TokenBucket({ capacity: 10, refillPerSecond: 1, now });
  b.tryRemove(10);
  for (let i = 0; i < 4; i++) {
    now.advance(250);
    b.tryRemove(0);
  }
  assert.equal(b.available, 1);
});
