// Chạy lại chính file test này trong process con với TZ khác, để bắt bài phụ thuộc múi giờ máy.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

export function alsoRunInTimezones(metaUrl, zones = ['UTC', 'America/New_York', 'Asia/Tokyo']) {
  if (process.env.__TZ_CHILD) return;
  for (const tz of zones) {
    test(`chạy lại với TZ=${tz}`, () => {
      try {
        execFileSync(process.execPath, ['--test', '--test-reporter=dot', fileURLToPath(metaUrl)], {
          env: { ...process.env, TZ: tz, __TZ_CHILD: '1' },
          encoding: 'utf8',
        });
      } catch (e) {
        assert.fail(`Sai khi máy chạy ở TZ=${tz} — bài đang phụ thuộc múi giờ của máy.\n${e.stdout ?? ''}`);
      }
    });
  }
}
