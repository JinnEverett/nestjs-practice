import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration } from '../answers/ex07.js';

test('ex07 · một đơn vị', () => {
  assert.equal(parseDuration('500ms'), 500);
  assert.equal(parseDuration('30s'), 30_000);
  assert.equal(parseDuration('15m'), 900_000);
  assert.equal(parseDuration('2h'), 7_200_000);
  assert.equal(parseDuration('7d'), 604_800_000);
});
test('ex07 · nhiều đơn vị, có/không khoảng trắng', () => {
  assert.equal(parseDuration('1h30m'), 5_400_000);
  assert.equal(parseDuration('2d 4h'), 187_200_000);
  assert.equal(parseDuration(' 1m 1s 1ms '), 61_001);
});
test('ex07 · ms không bị đọc nhầm thành m + s', () => assert.equal(parseDuration('1m5ms'), 60_005));
test('ex07 · sai → TypeError', () => {
  for (const s of ['', '   ', '10x', '1h abc', 'h', '10', '1.5h', '-1h', 'abc1h']) assert.throws(() => parseDuration(s), TypeError, JSON.stringify(s));
});
