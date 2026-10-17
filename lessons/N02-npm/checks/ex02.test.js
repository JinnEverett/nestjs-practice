import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, sortVersions, maxSatisfying } from '../answers/ex02.js';

test('ex02 · compareVersions so như số, không so chuỗi', () => {
  assert.equal(compareVersions('1.10.0', '1.9.0'), 1);
  assert.equal(compareVersions('1.9.0', '1.10.0'), -1);
  assert.equal(compareVersions('2.0.0', '10.0.0'), -1);
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0);
  assert.equal(compareVersions('1.2.10', '1.2.9'), 1);
});
test('ex02 · sortVersions tăng dần, không mutate', () => {
  const input = ['1.10.0', '1.2.0', '0.9.9', '1.9.0', '10.0.0'];
  const copy = [...input];
  assert.deepEqual(sortVersions(input), ['0.9.9', '1.2.0', '1.9.0', '1.10.0', '10.0.0']);
  assert.deepEqual(input, copy);
});
test('ex02 · maxSatisfying chọn bản lớn nhất (không phải bản cuối mảng)', () => {
  const list = ['1.2.0', '1.10.0', '1.9.0', '2.0.0', '1.3.0'];
  assert.equal(maxSatisfying(list, '^1.2.0'), '1.10.0');
  assert.equal(maxSatisfying(list, '~1.2.0'), '1.2.0');
  assert.equal(maxSatisfying(list, '*'), '2.0.0');
  assert.equal(maxSatisfying(list, '<1.3.0'), '1.2.0');
});
test('ex02 · maxSatisfying không có bản nào → null', () => {
  assert.equal(maxSatisfying(['1.0.0', '2.0.0'], '^3.0.0'), null);
  assert.equal(maxSatisfying([], '*'), null);
});
test('ex02 · maxSatisfying không mutate danh sách', () => {
  const list = ['2.0.0', '1.0.0'];
  maxSatisfying(list, '*');
  assert.deepEqual(list, ['2.0.0', '1.0.0']);
});
