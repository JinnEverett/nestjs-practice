import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVnDate } from '../answers/ex03.js';
import { alsoRunInTimezones } from './_tz.js';

test('ex03 · 00:00 giờ Việt Nam', () => {
  assert.equal(parseVnDate('17/10/2026').toISOString(), '2026-10-16T17:00:00.000Z');
  assert.equal(parseVnDate('01/01/2027').toISOString(), '2026-12-31T17:00:00.000Z');
});
test('ex03 · năm nhuận', () => {
  assert.equal(parseVnDate('29/02/2028').toISOString(), '2028-02-28T17:00:00.000Z');
  assert.equal(parseVnDate('29/02/2026'), null);
});
test('ex03 · ngày không tồn tại → null', () => {
  for (const s of ['31/02/2026', '00/10/2026', '17/13/2026', '31/04/2026', '32/01/2026']) assert.equal(parseVnDate(s), null, s);
});
test('ex03 · sai định dạng → null', () => {
  for (const s of ['2026-10-17', '17/10/26', '7/10/2026', '17-10-2026', ' 17/10/2026', 'abc', '']) assert.equal(parseVnDate(s), null, s);
});
alsoRunInTimezones(import.meta.url);
