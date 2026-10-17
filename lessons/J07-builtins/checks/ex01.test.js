import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatVnd } from '../answers/ex01.js';

const n = (s) => s.replace(/ /g, ' ');
test('ex01 · phân cách nghìn bằng dấu chấm', () => {
  assert.equal(n(formatVnd(1250000)), '1.250.000 ₫');
  assert.equal(n(formatVnd(0)), '0 ₫');
  assert.equal(n(formatVnd(999)), '999 ₫');
});
test('ex01 · làm tròn về đồng', () => {
  assert.equal(n(formatVnd(1234.6)), '1.235 ₫');
  assert.equal(n(formatVnd(1234.4)), '1.234 ₫');
});
test('ex01 · số âm', () => assert.equal(n(formatVnd(-50000)), '-50.000 ₫'));
