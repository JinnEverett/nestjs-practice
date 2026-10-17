import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateIn } from '../answers/ex05.js';

const deepFreeze = (o) => {
  Object.values(o).forEach((v) => typeof v === 'object' && v !== null && deepFreeze(v));
  return Object.freeze(o);
};
const make = () => deepFreeze({ cart: { items: [{ qty: 1 }, { qty: 5 }] }, user: { name: 'An' } });

test('ex05 · cập nhật đúng giá trị', () => {
  const n = updateIn(make(), ['cart', 'items', 0, 'qty'], (q) => q + 1);
  assert.equal(n.cart.items[0].qty, 2);
});
test('ex05 · không mutate gốc (gốc bị freeze)', () => {
  const s = make();
  updateIn(s, ['cart', 'items', 0, 'qty'], (q) => q + 1);
  assert.equal(s.cart.items[0].qty, 1);
});
test('ex05 · structural sharing', () => {
  const s = make();
  const n = updateIn(s, ['cart', 'items', 0, 'qty'], (q) => q + 1);
  assert.notEqual(n, s);
  assert.notEqual(n.cart, s.cart);
  assert.notEqual(n.cart.items, s.cart.items);
  assert.equal(n.user, s.user);
  assert.equal(n.cart.items[1], s.cart.items[1]);
});
test('ex05 · mảng vẫn là mảng', () => {
  const n = updateIn(make(), ['cart', 'items', 1, 'qty'], () => 9);
  assert.equal(Array.isArray(n.cart.items), true);
  assert.equal(n.cart.items.length, 2);
});
test('ex05 · tạo tầng trung gian còn thiếu', () => {
  const n = updateIn({}, ['a', 'b', 'c'], (v) => (v ?? 0) + 1);
  assert.deepEqual(n, { a: { b: { c: 1 } } });
});
test('ex05 · updater trả giá trị cũ → trả chính obj', () => {
  const s = make();
  assert.equal(updateIn(s, ['user', 'name'], (x) => x), s);
});
test('ex05 · path rỗng → updater(obj)', () => {
  assert.deepEqual(updateIn({ a: 1 }, [], (o) => ({ ...o, b: 2 })), { a: 1, b: 2 });
});
