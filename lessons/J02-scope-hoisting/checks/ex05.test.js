import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createIdGenerator } from '../answers/ex05.js';

test('ex05 · next tăng dần từ start mặc định 1', () => {
  const g = createIdGenerator('ORD');
  assert.equal(g.next(), 'ORD-1');
  assert.equal(g.next(), 'ORD-2');
});
test('ex05 · pad số 0 bên trái', () => {
  const g = createIdGenerator('ORD', { pad: 4 });
  assert.equal(g.next(), 'ORD-0001');
  const big = createIdGenerator('X', { start: 12345, pad: 3 });
  assert.equal(big.next(), 'X-12345');
});
test('ex05 · start tùy chọn', () => assert.equal(createIdGenerator('INV', { start: 100 }).next(), 'INV-100'));
test('ex05 · peek không tăng bộ đếm', () => {
  const g = createIdGenerator('ORD');
  g.next();
  assert.equal(g.peek(), 'ORD-2');
  assert.equal(g.peek(), 'ORD-2');
  assert.equal(g.next(), 'ORD-2');
});
test('ex05 · reset về start', () => {
  const g = createIdGenerator('ORD', { start: 5 });
  g.next();
  g.next();
  g.reset();
  assert.equal(g.next(), 'ORD-5');
});
test('ex05 · hai generator độc lập', () => {
  const a = createIdGenerator('A');
  const b = createIdGenerator('B');
  a.next();
  a.next();
  assert.equal(b.next(), 'B-1');
  assert.equal(a.next(), 'A-3');
});
test('ex05 · bộ đếm không lộ ra ngoài', () => {
  const g = createIdGenerator('ORD');
  assert.deepEqual(Object.keys(g).sort(), ['next', 'peek', 'reset']);
});
