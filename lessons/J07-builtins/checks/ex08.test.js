import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonWithDates } from '../answers/ex08.js';

test('ex08 · chuỗi ISO đầy đủ → Date, ở mọi độ sâu', () => {
  const r = parseJsonWithDates('{"at":"2026-10-17T03:00:00.000Z","items":[{"paidAt":"2026-10-17T10:00:00+07:00"}]}');
  assert.ok(r.at instanceof Date);
  assert.equal(r.at.toISOString(), '2026-10-17T03:00:00.000Z');
  assert.ok(r.items[0].paidAt instanceof Date);
  assert.equal(r.items[0].paidAt.toISOString(), '2026-10-17T03:00:00.000Z');
});
test('ex08 · không có mili giây cũng được', () => {
  assert.ok(parseJsonWithDates('{"a":"2026-10-17T03:00:00Z"}').a instanceof Date);
});
test('ex08 · chuỗi khác giữ nguyên', () => {
  const r = parseJsonWithDates('{"d":"2026-10-17","s":"hello","n":5,"t":"2026-10-17T03:00:00","x":"2026-13-45T99:00:00Z"}');
  assert.equal(r.d, '2026-10-17');
  assert.equal(r.s, 'hello');
  assert.equal(r.n, 5);
  assert.equal(r.t, '2026-10-17T03:00:00');
  assert.equal(r.x, '2026-13-45T99:00:00Z');
});
test('ex08 · JSON sai vẫn ném SyntaxError', () => assert.throws(() => parseJsonWithDates('{bad'), SyntaxError));
