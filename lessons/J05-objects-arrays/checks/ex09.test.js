import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addItem } from '../answers/ex09.js';

const freezeCart = (c) => Object.freeze({ items: Object.freeze(c.items.map((i) => Object.freeze(i))) });

test('ex09 · thêm sản phẩm mới vào cuối', () => {
  const cart = freezeCart({ items: [{ productId: 1, qty: 1, price: 10 }] });
  const n = addItem(cart, { productId: 2, qty: 3, price: 5 });
  assert.deepEqual(n.items, [{ productId: 1, qty: 1, price: 10 }, { productId: 2, qty: 3, price: 5 }]);
});
test('ex09 · cộng dồn qty cho sản phẩm đã có', () => {
  const cart = freezeCart({ items: [{ productId: 1, qty: 1, price: 10 }, { productId: 2, qty: 1, price: 5 }] });
  const n = addItem(cart, { productId: 1, qty: 2, price: 10 });
  assert.deepEqual(n.items, [{ productId: 1, qty: 3, price: 10 }, { productId: 2, qty: 1, price: 5 }]);
});
test('ex09 · không mutate, giữ tham chiếu dòng không đổi', () => {
  const cart = freezeCart({ items: [{ productId: 1, qty: 1, price: 10 }, { productId: 2, qty: 1, price: 5 }] });
  const n = addItem(cart, { productId: 1, qty: 1, price: 10 });
  assert.notEqual(n, cart);
  assert.notEqual(n.items, cart.items);
  assert.equal(n.items[1], cart.items[1]);
  assert.equal(cart.items[0].qty, 1);
});
test('ex09 · hai khách không lẫn giỏ', () => {
  const a = addItem({ items: [] }, { productId: 1, qty: 1, price: 1 });
  const b = addItem({ items: [] }, { productId: 2, qty: 1, price: 1 });
  assert.equal(a.items.length, 1);
  assert.equal(b.items.length, 1);
});
test('ex09 · item thêm vào là bản copy (sửa item gốc không ảnh hưởng giỏ)', () => {
  const item = { productId: 5, qty: 1, price: 1 };
  const n = addItem({ items: [] }, item);
  item.qty = 999;
  assert.equal(n.items[0].qty, 1);
});
test('ex09 · qty không hợp lệ → RangeError', () => {
  for (const qty of [0, -1, 1.5, '2', NaN]) {
    assert.throws(() => addItem({ items: [] }, { productId: 1, qty, price: 1 }), RangeError, String(qty));
  }
});
