import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskEmail } from '../answers/ex06.js';

test('ex06 · local dài', () => {
  assert.equal(maskEmail('nguyenvana@gmail.com'), 'ng*******a@gmail.com');
  assert.equal(maskEmail('abcd@x.vn'), 'ab*d@x.vn');
});
test('ex06 · local ngắn', () => {
  assert.equal(maskEmail('an@x.vn'), 'a***@x.vn');
  assert.equal(maskEmail('b@x.vn'), 'b***@x.vn');
  assert.equal(maskEmail('abc@x.vn'), 'a***@x.vn');
});
test('ex06 · email sai → TypeError', () => {
  for (const e of ['abc', 'a@b', 'a@@b.vn', 'a b@x.vn', '@x.vn', 'a@x.vn ', 'a@.vn']) assert.throws(() => maskEmail(e), TypeError, e);
});
