import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFlag } from '../answers/ex10.js';

test('ex10 · các giá trị true', () => {
  for (const v of ['true', 'TRUE', ' True ', '1', 'yes', 'YES', 'on', 'On']) assert.equal(parseFlag(v), true, v);
});
test('ex10 · các giá trị false (kể cả "false" — Boolean("false") là true!)', () => {
  for (const v of ['false', 'FALSE', '0', 'no', 'off', '', '   ']) assert.equal(parseFlag(v), false, JSON.stringify(v));
});
test('ex10 · undefined → defaultValue (mặc định false)', () => {
  assert.equal(parseFlag(undefined), false);
  assert.equal(parseFlag(undefined, true), true);
});
test('ex10 · boolean trả nguyên', () => {
  assert.equal(parseFlag(true), true);
  assert.equal(parseFlag(false, true), false);
});
test('ex10 · giá trị lạ → TypeError có nhắc giá trị', () => {
  assert.throws(() => parseFlag('enable'), (e) => e instanceof TypeError && e.message.includes('enable'));
  assert.throws(() => parseFlag(1), TypeError);
  assert.throws(() => parseFlag(null), TypeError);
  assert.throws(() => parseFlag('truee'), TypeError);
});
