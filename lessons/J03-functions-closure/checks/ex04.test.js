import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memoize } from '../answers/ex04.js';

const counted = (impl) => {
  const f = (...args) => {
    f.calls++;
    return impl(...args);
  };
  f.calls = 0;
  return f;
};

test('ex04 · nhớ theo tham số đầu', () => {
  const sq = counted((n) => n * n);
  const m = memoize(sq);
  assert.equal(m(4), 16);
  assert.equal(m(4), 16);
  assert.equal(m(5), 25);
  assert.equal(sq.calls, 2);
});
test('ex04 · kết quả falsy cũng được nhớ', () => {
  for (const v of [0, '', undefined, null, false]) {
    const f = counted(() => v);
    const m = memoize(f);
    m('k');
    m('k');
    assert.equal(f.calls, 1, `giá trị ${String(v)}`);
  }
});
test('ex04 · key đặc biệt __proto__ / toString', () => {
  const f = counted((k) => `v:${k}`);
  const m = memoize(f);
  assert.equal(m('__proto__'), 'v:__proto__');
  assert.equal(m('toString'), 'v:toString');
  assert.equal(m('toString'), 'v:toString');
  assert.equal(f.calls, 2);
});
test('ex04 · keyFn cho nhiều tham số', () => {
  const add = counted((a, b) => a + b);
  const m = memoize(add, (a, b) => `${a}:${b}`);
  assert.equal(m(1, 2), 3);
  assert.equal(m(1, 3), 4);
  assert.equal(m(1, 2), 3);
  assert.equal(add.calls, 2);
});
test('ex04 · truyền đủ tham số cho fn', () => {
  const m = memoize((a, b, c) => [a, b, c].join('-'), (...xs) => xs.join());
  assert.equal(m(1, 2, 3), '1-2-3');
});
test('ex04 · clear() xóa cache', () => {
  const f = counted((n) => n);
  const m = memoize(f);
  m(1);
  m.clear();
  m(1);
  assert.equal(f.calls, 2);
});
