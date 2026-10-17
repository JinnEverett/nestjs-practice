import { test } from 'node:test';
import assert from 'node:assert/strict';
import { naturals, mapLazy, filterLazy, take } from '../answers/ex04.js';

test('ex04 · take từ nguồn vô hạn', () => assert.deepEqual([...take(naturals(), 4)], [0, 1, 2, 3]));
test('ex04 · ghép chuỗi', () => {
  const evensSquared = take(mapLazy(filterLazy(naturals(), (n) => n % 2 === 0), (n) => n * n), 3);
  assert.deepEqual([...evensSquared], [0, 4, 16]);
});
test('ex04 · lười: fn chỉ gọi đúng số lần cần', () => {
  let calls = 0;
  const r = [
    ...take(
      mapLazy(naturals(), (n) => {
        calls++;
        return n;
      }),
      3,
    ),
  ];
  assert.deepEqual(r, [0, 1, 2]);
  assert.equal(calls, 3);
});
test('ex04 · take(0) không đọc nguồn', () => {
  let pulled = 0;
  function* src() {
    for (;;) {
      pulled++;
      yield 1;
    }
  }
  assert.deepEqual([...take(src(), 0)], []);
  assert.equal(pulled, 0);
});
test('ex04 · trả generator (iterator)', () => {
  const t = take([1, 2], 1);
  assert.equal(typeof t.next, 'function');
  assert.equal(typeof t[Symbol.iterator], 'function');
});
