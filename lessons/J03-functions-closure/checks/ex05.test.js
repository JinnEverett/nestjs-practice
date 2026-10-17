import { test } from 'node:test';
import assert from 'node:assert/strict';
import { debounce } from '../answers/ex05.js';

test('ex05 · chỉ gọi sau khi ngừng gọi ms', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const d = debounce((q) => calls.push(q), 300);
  d('n');
  t.mock.timers.tick(100);
  d('ne');
  t.mock.timers.tick(100);
  d('nes');
  t.mock.timers.tick(299);
  assert.deepEqual(calls, []);
  t.mock.timers.tick(1);
  assert.deepEqual(calls, ['nes']);
});
test('ex05 · nhiều đợt gọi tách rời → nhiều lần gọi fn', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const d = debounce((q) => calls.push(q), 100);
  d('a');
  t.mock.timers.tick(150);
  d('b');
  t.mock.timers.tick(150);
  assert.deepEqual(calls, ['a', 'b']);
});
test('ex05 · truyền đủ nhiều tham số', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let got;
  const d = debounce((...args) => (got = args), 50);
  d(1, 2, 3);
  t.mock.timers.tick(50);
  assert.deepEqual(got, [1, 2, 3]);
});
test('ex05 · cancel() hủy lần gọi đang chờ', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const d = debounce(() => calls++, 100);
  d();
  d.cancel();
  t.mock.timers.tick(500);
  assert.equal(calls, 0);
  d();
  t.mock.timers.tick(100);
  assert.equal(calls, 1);
});
test('ex05 · hai hàm debounce độc lập', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const a = debounce(() => calls.push('a'), 100);
  const b = debounce(() => calls.push('b'), 100);
  a();
  b();
  t.mock.timers.tick(100);
  assert.deepEqual(calls.sort(), ['a', 'b']);
});
