import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pipe } from '../answers/ex01.js';

test('ex01 · áp dụng trái sang phải', () => {
  const slugify = pipe((s) => s.trim(), (s) => s.toLowerCase(), (s) => s.replaceAll(' ', '-'));
  assert.equal(slugify('  Hello World '), 'hello-world');
});
test('ex01 · thứ tự quan trọng', () => {
  assert.equal(pipe((x) => x + 1, (x) => x * 2)(3), 8);
  assert.equal(pipe((x) => x * 2, (x) => x + 1)(3), 7);
});
test('ex01 · không có hàm → identity', () => {
  const obj = {};
  assert.equal(pipe()(obj), obj);
});
test('ex01 · một hàm', () => assert.equal(pipe((x) => x + '!')('hi'), 'hi!'));
test('ex01 · tái sử dụng hàm pipe nhiều lần', () => {
  const inc = pipe((x) => x + 1);
  assert.equal(inc(1), 2);
  assert.equal(inc(1), 2);
});
