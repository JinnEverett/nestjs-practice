import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vnDayRange } from '../answers/ex04.js';
import { alsoRunInTimezones } from './_tz.js';

test('ex04 · khoảng nửa mở của ngày VN', () => {
  const { from, to } = vnDayRange('2026-10-17');
  assert.ok(from instanceof Date && to instanceof Date);
  assert.equal(from.toISOString(), '2026-10-16T17:00:00.000Z');
  assert.equal(to.toISOString(), '2026-10-17T17:00:00.000Z');
});
test('ex04 · qua tháng / qua năm', () => {
  assert.equal(vnDayRange('2026-10-31').to.toISOString(), '2026-10-31T17:00:00.000Z');
  assert.equal(vnDayRange('2026-12-31').to.toISOString(), '2026-12-31T17:00:00.000Z');
  assert.equal(vnDayRange('2027-01-01').from.toISOString(), '2026-12-31T17:00:00.000Z');
});
test('ex04 · đơn 23:30 tối 17/10 giờ VN nằm trong khoảng', () => {
  const { from, to } = vnDayRange('2026-10-17');
  const t = new Date('2026-10-17T23:30:00+07:00');
  assert.ok(t >= from && t < to);
});
test('ex04 · sai định dạng → RangeError', () => {
  for (const s of ['17/10/2026', '2026-1-7', '2026-02-30', 'abc']) assert.throws(() => vnDayRange(s), RangeError, s);
});
alsoRunInTimezones(import.meta.url);
