import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeDeep } from '../answers/ex07.js';

test('ex07 · merge đệ quy object lồng', () => {
  const r = mergeDeep({ db: { host: 'localhost', port: 5432 }, debug: false }, { db: { port: 5434 }, debug: true });
  assert.deepEqual(r, { db: { host: 'localhost', port: 5434 }, debug: true });
});
test('ex07 · mảng và Date bị thay thế', () => {
  const d = new Date(5);
  const r = mergeDeep({ tags: [1, 2, 3], at: new Date(0) }, { tags: [9], at: d });
  assert.deepEqual(r.tags, [9]);
  assert.equal(r.at.getTime(), 5);
});
test('ex07 · undefined trong source bị bỏ qua, null thì ghi đè', () => {
  assert.deepEqual(mergeDeep({ a: 1, b: 2 }, { a: undefined, b: null }), { a: 1, b: null });
});
test('ex07 · không mutate input', () => {
  const t = { db: { host: 'x' } };
  const s = { db: { port: 1 } };
  const r = mergeDeep(t, s);
  assert.deepEqual(t, { db: { host: 'x' } });
  assert.deepEqual(s, { db: { port: 1 } });
  assert.notEqual(r.db, t.db);
});
test('ex07 · chặn prototype pollution', () => {
  const evil = JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"prototype": {"polluted2": true}}, "ok": 1}');
  const r = mergeDeep({}, evil);
  assert.equal({}.polluted, undefined);
  assert.equal({}.polluted2, undefined);
  assert.equal(r.ok, 1);
  assert.equal(Object.getPrototypeOf(r), Object.prototype);
  const nested = JSON.parse('{"a": {"__proto__": {"polluted3": true}}}');
  mergeDeep({ a: {} }, nested);
  assert.equal({}.polluted3, undefined);
});
test('ex07 · key mới từ source', () => assert.deepEqual(mergeDeep({ a: 1 }, { b: { c: 2 } }), { a: 1, b: { c: 2 } }));
