import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deepClone } from '../answers/ex08.js';

test('ex08 · primitive trả nguyên', () => {
  for (const v of [1, 'a', null, undefined, true, 10n]) assert.equal(deepClone(v), v);
});
test('ex08 · object/mảng lồng: bằng giá trị, khác tham chiếu', () => {
  const src = { a: [1, { b: 2 }], c: { d: { e: 'x' } } };
  const c = deepClone(src);
  assert.deepEqual(c, src);
  assert.notEqual(c.a, src.a);
  assert.notEqual(c.a[1], src.a[1]);
  assert.notEqual(c.c.d, src.c.d);
});
test('ex08 · Date, Map, Set', () => {
  const src = { at: new Date(5), m: new Map([[{ k: 1 }, { v: 1 }]]), s: new Set([{ x: 1 }]) };
  const c = deepClone(src);
  assert.ok(c.at instanceof Date);
  assert.notEqual(c.at, src.at);
  assert.equal(c.at.getTime(), 5);
  assert.ok(c.m instanceof Map);
  const [[ck, cv]] = [...c.m];
  const [[sk, sv]] = [...src.m];
  assert.deepEqual([ck, cv], [sk, sv]);
  assert.notEqual(cv, sv);
  assert.ok(c.s instanceof Set);
  assert.notEqual([...c.s][0], [...src.s][0]);
});
test('ex08 · tham chiếu vòng', () => {
  const src = { name: 'root', children: [] };
  src.self = src;
  src.children.push({ parent: src });
  const c = deepClone(src);
  assert.equal(c.self, c);
  assert.equal(c.children[0].parent, c);
  assert.notEqual(c, src);
});
test('ex08 · cùng object xuất hiện 2 lần → bản clone cũng dùng chung', () => {
  const shared = { v: 1 };
  const c = deepClone({ a: shared, b: shared });
  assert.equal(c.a, c.b);
});
test('ex08 · không dùng structuredClone/JSON', () => {
  const src = readFileSync(new URL('../answers/ex08.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  assert.equal(/structuredClone|JSON\./.test(src), false);
});
