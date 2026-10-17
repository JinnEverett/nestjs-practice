import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { memoizeByObject } from '../answers/ex07.js';

test('ex07 · nhớ theo object', () => {
  let calls = 0;
  const totalOf = memoizeByObject((order) => {
    calls++;
    return order.items.reduce((s, i) => s + i, 0);
  });
  const a = { items: [1, 2] };
  const b = { items: [5] };
  assert.equal(totalOf(a), 3);
  assert.equal(totalOf(a), 3);
  assert.equal(totalOf(b), 5);
  assert.equal(calls, 2);
});
test('ex07 · object khác nhưng giống nội dung là key khác', () => {
  let calls = 0;
  const f = memoizeByObject(() => ++calls);
  f({ x: 1 });
  f({ x: 1 });
  assert.equal(calls, 2);
});
test('ex07 · nhớ cả undefined, truyền thêm tham số', () => {
  let calls = 0;
  const f = memoizeByObject((o, extra) => {
    calls++;
    return extra === 'show' ? undefined : 1;
  });
  const o = {};
  assert.equal(f(o, 'show'), undefined);
  f(o, 'other');
  assert.equal(calls, 1);
});
test('ex07 · key không phải object → TypeError', () => {
  const f = memoizeByObject(() => 1);
  for (const k of [1, 'a', null, undefined]) assert.throws(() => f(k), TypeError);
  assert.equal(f(() => {}), 1);
});
test('ex07 · dùng WeakMap', () => {
  assert.ok(/WeakMap/.test(readFileSync(new URL('../answers/ex07.js', import.meta.url), 'utf8')));
});
