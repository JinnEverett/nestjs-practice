import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runJobs } from '../answers/ex06.js';

test('ex06 · chạy đủ và đúng thứ tự, resolve số job', async () => {
  const log = [];
  const n = await runJobs([() => log.push('a'), () => log.push('b'), () => log.push('c')]);
  assert.deepEqual(log, ['a', 'b', 'c']);
  assert.equal(n, 3);
});
test('ex06 · mảng rỗng → 0', async () => {
  assert.equal(await runJobs([]), 0);
});
test('ex06 · trả Promise', () => {
  const p = runJobs([() => {}]);
  assert.ok(p instanceof Promise);
  return p;
});
test('ex06 · 20 000 job: setTimeout(0) đặt trước chạy được TRƯỚC khi job cuối xong', async () => {
  let timerFired = false;
  setTimeout(() => { timerFired = true; }, 0);
  let firedWhenLastRan = null;
  const jobs = Array.from({ length: 20000 }, () => () => {});
  jobs.push(() => { firedWhenLastRan = timerFired; });
  await runJobs(jobs, { batch: 100 });
  assert.equal(firedWhenLastRan, true, 'timer bị đói: chưa chạy khi job cuối chạy');
});
test('ex06 · batch=1 vẫn đúng', async () => {
  const log = [];
  await runJobs([() => log.push(1), () => log.push(2)], { batch: 1 });
  assert.deepEqual(log, [1, 2]);
});
test('ex06 · job ném lỗi → reject, không chạy job sau', async () => {
  const log = [];
  await assert.rejects(
    runJobs([() => log.push(1), () => { throw new Error('job 2 hỏng'); }, () => log.push(3)]),
    /job 2 hỏng/,
  );
  assert.deepEqual(log, [1]);
});
