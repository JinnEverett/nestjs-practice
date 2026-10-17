import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextId } from '../answers/ex09.js';

test('ex09 · số nhỏ', () => {
  assert.equal(nextId('41'), '42');
  assert.equal(nextId('0'), '1');
  assert.equal(nextId('99'), '100');
});
test('ex09 · vượt MAX_SAFE_INTEGER vẫn chính xác', () => {
  assert.equal(nextId('9007199254740991'), '9007199254740992');
  assert.equal(nextId('9007199254740993'), '9007199254740994');
  assert.equal(nextId('9223372036854775806'), '9223372036854775807');
});
test('ex09 · trả về chuỗi', () => assert.equal(typeof nextId('1'), 'string'));
test('ex09 · input sai → TypeError', () => {
  for (const bad of ['abc', '-1', '1.5', '', ' 1', '1e3', '0x10', 5, null, undefined, 5n]) {
    assert.throws(() => nextId(bad), TypeError, `phải ném TypeError với ${String(bad)}`);
  }
});
