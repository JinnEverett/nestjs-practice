import { test } from 'node:test';
import assert from 'node:assert/strict';
import { superviseChild } from '../answers/ex07.js';

const node = (code) => ({ cmd: process.execPath, args: ['-e', code] });
const fast = { backoffMs: 5, stableMs: 10_000 };
const race = (p, ms = 8000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('TREO')), ms))]);

test('ex07 · con thoát 0 → done {reason:"exited", starts:1}, không restart', async () => {
  const s = superviseChild({ ...node('process.exit(0)'), ...fast });
  assert.deepEqual(await race(s.done), { reason: 'exited', starts: 1 });
});
test('ex07 · con crash liên tục → restart tối đa maxRestarts rồi bỏ cuộc', async () => {
  const s = superviseChild({ ...node('process.exit(1)'), ...fast, maxRestarts: 2 });
  assert.deepEqual(await race(s.done), { reason: 'max-restarts', starts: 3 });
});
test('ex07 · crash rồi lần sau thoát 0 → exited', async () => {
  // lần chạy đầu ghi file cờ rồi crash; lần sau thấy cờ thì thoát 0
  const code = `
    const fs=require('fs'), p=require('os').tmpdir()+'/sup-'+process.argv[1];
    if (fs.existsSync(p)) { fs.unlinkSync(p); process.exit(0); }
    fs.writeFileSync(p,'1'); process.exit(1);`;
  const id = `${process.pid}-${Date.now()}`;
  const s = superviseChild({ cmd: process.execPath, args: ['-e', code, id], ...fast });
  assert.deepEqual(await race(s.done), { reason: 'exited', starts: 2 });
});
test('ex07 · stop() kill con đang chạy, không restart', async () => {
  const s = superviseChild({ ...node('setInterval(()=>{},1000)'), ...fast });
  await new Promise((r) => setTimeout(r, 300));
  const r = await race(s.stop());
  assert.deepEqual(r, { reason: 'stopped', starts: 1 });
  assert.deepEqual(await s.done, r);
});
test('ex07 · stop() trong lúc đang chờ backoff cũng dừng hẳn, không khởi động lại', async () => {
  const events = [];
  const s = superviseChild({ ...node('process.exit(1)'), backoffMs: 400, stableMs: 10_000, maxRestarts: 5, onEvent: (e) => events.push(e.type) });
  await new Promise((r) => setTimeout(r, 250)); // con đã chết, đang chờ 400ms
  const r = await race(s.stop());
  assert.equal(r.reason, 'stopped');
  assert.equal(r.starts, 1);
  await new Promise((resolve) => setTimeout(resolve, 600));
  assert.equal(events.filter((t) => t === 'start').length, 1);
});
test('ex07 · backoff tăng gấp đôi: khoảng cách giữa các lần start', async () => {
  const startTimes = [];
  const s = superviseChild({
    ...node('process.exit(1)'), backoffMs: 80, stableMs: 10_000, maxRestarts: 2,
    onEvent: (e) => { if (e.type === 'start') startTimes.push(performance.now()); },
  });
  await race(s.done);
  assert.equal(startTimes.length, 3);
  const gap1 = startTimes[1] - startTimes[0];
  const gap2 = startTimes[2] - startTimes[1];
  assert.ok(gap2 > gap1 + 40, `gap1=${gap1.toFixed(0)} gap2=${gap2.toFixed(0)} — backoff chưa tăng`);
});
test('ex07 · con sống ≥ stableMs rồi crash thì bộ đếm liên tiếp reset (không bỏ cuộc)', async () => {
  const s = superviseChild({
    ...node('setTimeout(()=>process.exit(1), 200)'), backoffMs: 5, stableMs: 100, maxRestarts: 1,
  });
  await new Promise((r) => setTimeout(r, 1200)); // nếu không reset, sẽ bỏ cuộc sau 2 lần start
  const r = await race(Promise.race([s.done, s.stop()]));
  assert.equal(r.reason, 'stopped');
  assert.ok(r.starts >= 3, `starts=${r.starts}`);
});
test('ex07 · lệnh không tồn tại không làm crash test (lỗi spawn được tính là crash)', async () => {
  const s = superviseChild({ cmd: 'lenh-khong-ton-tai-xyz', ...fast, maxRestarts: 1 });
  const r = await race(s.done);
  assert.equal(r.reason, 'max-restarts');
});
test('ex07 · onEvent nhận start/exit/restart/give-up', async () => {
  const types = new Set();
  const s = superviseChild({ ...node('process.exit(1)'), ...fast, maxRestarts: 1, onEvent: (e) => types.add(e.type) });
  await race(s.done);
  for (const t of ['start', 'exit', 'restart', 'give-up']) assert.ok(types.has(t), t);
});
