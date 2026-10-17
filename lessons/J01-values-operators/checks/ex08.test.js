import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions } from '../answers/ex08.js';

test('ex08 · so theo số, không theo chuỗi', () => {
  assert.equal(compareVersions('1.10.0', '1.9.3'), 1);
  assert.equal(compareVersions('1.9.3', '1.10.0'), -1);
});
test('ex08 · bằng nhau → 0', () => assert.equal(compareVersions('2.0.0', '2.0.0'), 0));
test('ex08 · major quyết định trước', () => {
  assert.equal(compareVersions('0.9.9', '1.0.0'), -1);
  assert.equal(compareVersions('10.0.0', '9.99.99'), 1);
});
test('ex08 · patch', () => {
  assert.equal(compareVersions('1.2.10', '1.2.9'), 1);
  assert.equal(compareVersions('1.2.3', '1.2.4'), -1);
});
test('ex08 · chỉ trả -1, 0, 1', () => {
  assert.equal(compareVersions('5.0.0', '1.0.0'), 1);
  assert.equal(compareVersions('1.0.0', '5.0.0'), -1);
});
