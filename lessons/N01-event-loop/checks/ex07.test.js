import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { createLoopMonitor } from '../answers/ex07.js';

const busy = (ms) => { const end = performance.now() + ms; while (performance.now() < end); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('ex07 · snapshot có maxMs, p99Ms, meanMs là số hữu hạn (ms, không phải ns)', async () => {
  const m = createLoopMonitor({ resolution: 10 });
  await sleep(80);
  const s = m.snapshot();
  m.stop();
  for (const k of ['maxMs', 'p99Ms', 'meanMs']) {
    assert.equal(typeof s[k], 'number', k);
    assert.ok(Number.isFinite(s[k]) && s[k] >= 0 && s[k] < 1000, `${k}=${s[k]}`);
  }
});
test('ex07 · bắt được lần chặn loop 150ms', async () => {
  const m = createLoopMonitor({ resolution: 10 });
  await sleep(30);
  busy(150);
  await sleep(30);
  const s = m.snapshot();
  m.stop();
  assert.ok(s.maxMs >= 100, `maxMs=${s.maxMs}`);
});
test('ex07 · reset() xóa dữ liệu cũ', async () => {
  const m = createLoopMonitor({ resolution: 10 });
  await sleep(30);
  busy(150);
  await sleep(30);
  m.reset();
  await sleep(100);
  const s = m.snapshot();
  m.stop();
  assert.ok(s.maxMs < 80, `sau reset maxMs còn ${s.maxMs}`);
});
test('ex07 · stop() rồi snapshot() không ném lỗi', async () => {
  const m = createLoopMonitor();
  await sleep(30);
  m.stop();
  assert.doesNotThrow(() => m.snapshot());
});
test('ex07 · không giữ process sống: process con tạo monitor mà không stop vẫn tự thoát', () => {
  const href = pathToFileURL(new URL('../answers/ex07.js', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')).href;
  const code = `import(${JSON.stringify(href)}).then((m) => { m.createLoopMonitor(); console.log('ok'); });`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8', timeout: 8000 });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /ok/);
});
