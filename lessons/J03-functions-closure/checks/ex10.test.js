import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoizeLRU } from '../answers/ex10.js';

const counted = () => {
  const calls = [];
  const f = (k) => {
    calls.push(k);
    return `v${k}`;
  };
  return { f, calls };
};

test('ex10 · nhớ như memoize bình thường', () => {
  const { f, calls } = counted();
  const m = memoizeLRU(f, 2);
  assert.equal(m(1), 'v1');
  assert.equal(m(1), 'v1');
  assert.deepEqual(calls, [1]);
});
test('ex10 · không vượt maxSize', () => {
  const { f } = counted();
  const m = memoizeLRU(f, 3);
  for (let i = 0; i < 100; i++) m(i);
  assert.equal(m.size, 3);
});
test('ex10 · bỏ key lâu nhất không dùng', () => {
  const { f, calls } = counted();
  const m = memoizeLRU(f, 2);
  m('a');
  m('b');
  m('c'); // bỏ 'a'
  calls.length = 0;
  m('b');
  m('c');
  assert.deepEqual(calls, []);
  m('a');
  assert.deepEqual(calls, ['a']);
});
test('ex10 · đọc trúng cache làm mới thứ tự', () => {
  const { f, calls } = counted();
  const m = memoizeLRU(f, 2);
  m('a');
  m('b');
  m('a'); // a vừa được dùng → b là cũ nhất
  m('c'); // bỏ 'b'
  calls.length = 0;
  m('a');
  assert.deepEqual(calls, [], 'a phải còn trong cache');
  m('b');
  assert.deepEqual(calls, ['b'], 'b phải đã bị bỏ');
});
test('ex10 · kết quả undefined vẫn được nhớ', () => {
  let n = 0;
  const m = memoizeLRU(() => {
    n++;
  }, 5);
  m('x');
  m('x');
  assert.equal(n, 1);
});
