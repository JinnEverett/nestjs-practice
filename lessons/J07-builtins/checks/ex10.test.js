import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyReport } from '../answers/ex10.js';
import { alsoRunInTimezones } from './_tz.js';

test('ex10 · gom theo ngày lịch VN', () => {
  const orders = [
    { createdAt: '2026-10-16T16:59:59Z', total: 100 }, // 23:59:59 ngày 16 giờ VN
    { createdAt: '2026-10-16T17:00:00Z', total: 200 }, // 00:00 ngày 17 giờ VN
    { createdAt: '2026-10-16T18:30:00Z', total: 300 }, // 01:30 ngày 17
    { createdAt: '2026-10-15T03:00:00Z', total: 50 },
  ];
  assert.deepEqual(dailyReport(orders), [
    { date: '2026-10-15', count: 1, revenue: 50 },
    { date: '2026-10-16', count: 1, revenue: 100 },
    { date: '2026-10-17', count: 2, revenue: 500 },
  ]);
});
test('ex10 · rỗng', () => assert.deepEqual(dailyReport([]), []));
test('ex10 · sắp xếp đúng qua tháng/năm', () => {
  const r = dailyReport([
    { createdAt: '2027-01-01T00:00:00Z', total: 1 },
    { createdAt: '2026-12-31T16:00:00Z', total: 1 },
    { createdAt: '2026-02-01T00:00:00Z', total: 1 },
  ]);
  assert.deepEqual(r.map((x) => x.date), ['2026-02-01', '2026-12-31', '2027-01-01']);
});
alsoRunInTimezones(import.meta.url);
