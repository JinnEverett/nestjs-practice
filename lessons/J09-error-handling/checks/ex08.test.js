import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonBody } from '../answers/ex08.js';
import { AppError, ValidationError } from '../answers/ex02.js';

test('ex08 · hợp lệ', () => assert.deepEqual(parseJsonBody('{"a":1}'), { a: 1 }));
test('ex08 · quá lớn theo BYTE (tiếng Việt 1 ký tự nhiều byte)', () => {
  assert.throws(() => parseJsonBody('{"a":"xxxxxx"}', { maxBytes: 10 }), (e) => e instanceof AppError && e.statusCode === 413 && e.code === 'PAYLOAD_TOO_LARGE');
  const vn = JSON.stringify({ t: 'đđđđ' }); // 12 ký tự nhưng 16 byte
  assert.equal(vn.length, 12);
  assert.throws(() => parseJsonBody(vn, { maxBytes: 14 }), (e) => e.statusCode === 413);
  assert.deepEqual(parseJsonBody(vn, { maxBytes: 16 }), { t: 'đđđđ' });
});
test('ex08 · JSON sai → ValidationError giữ SyntaxError', () => {
  assert.throws(
    () => parseJsonBody('{bad'),
    (e) => e instanceof ValidationError && e.message === 'Invalid JSON' && e.cause instanceof SyntaxError && e.details[0].field === 'body',
  );
});
test('ex08 · không phải object', () => {
  for (const raw of ['[1]', '5', 'null', '"x"']) assert.throws(() => parseJsonBody(raw), ValidationError, raw);
});
