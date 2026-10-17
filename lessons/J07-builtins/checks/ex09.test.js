import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatRelativeVN } from '../answers/ex09.js';
import { alsoRunInTimezones } from './_tz.js';

const now = new Date('2026-10-17T15:00:00+07:00');
const ago = (ms) => new Date(now.getTime() - ms);
const S = 1000, M = 60 * S, H = 60 * M;

test('ex09 · vừa xong', () => {
  assert.equal(formatRelativeVN(ago(0), now), 'vừa xong');
  assert.equal(formatRelativeVN(ago(59 * S), now), 'vừa xong');
});
test('ex09 · phút', () => {
  assert.equal(formatRelativeVN(ago(60 * S), now), '1 phút trước');
  assert.equal(formatRelativeVN(ago(59 * M + 59 * S), now), '59 phút trước');
});
test('ex09 · giờ', () => {
  assert.equal(formatRelativeVN(ago(H), now), '1 giờ trước');
  assert.equal(formatRelativeVN(ago(23 * H + 59 * M), now), '23 giờ trước');
});
test('ex09 · hôm qua theo lịch VN', () => {
  assert.equal(formatRelativeVN(new Date('2026-10-16T08:00:00+07:00'), now), 'hôm qua');
  const lateNow = new Date('2026-10-17T23:00:00+07:00');
  assert.equal(formatRelativeVN(new Date('2026-10-16T22:00:00+07:00'), lateNow), 'hôm qua');
});
test('ex09 · xa hơn → dd/MM/yyyy giờ VN', () => {
  assert.equal(formatRelativeVN(new Date('2026-10-15T23:30:00+07:00'), now), '15/10/2026');
  assert.equal(formatRelativeVN(new Date('2026-10-14T18:00:00Z'), now), '15/10/2026');
  assert.equal(formatRelativeVN(new Date('2025-01-05T03:00:00Z'), now), '05/01/2025');
});
alsoRunInTimezones(import.meta.url);
