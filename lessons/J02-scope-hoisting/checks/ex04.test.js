import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotal } from '../answers/ex04.js';

test('ex04 · dưới 1 triệu không giảm', () => {
  assert.equal(calculateTotal([{ price: 200000, qty: 2 }]), 400000);
  assert.equal(calculateTotal([{ price: 999999, qty: 1 }]), 999999);
});
test('ex04 · đúng 1 triệu được giảm 10%', () => assert.equal(calculateTotal([{ price: 500000, qty: 2 }]), 900000));
test('ex04 · làm tròn về số nguyên', () => {
  assert.equal(calculateTotal([{ price: 500000, qty: 2 }, { price: 1, qty: 5 }]), 900005);
  assert.equal(calculateTotal([{ price: 1000001, qty: 1 }]), 900001);
});
test('ex04 · mảng rỗng → 0', () => assert.equal(calculateTotal([]), 0));
test('ex04 · gọi 2 lần liên tiếp không cộng dồn', () => {
  calculateTotal([{ price: 100, qty: 1 }]);
  assert.equal(calculateTotal([{ price: 100, qty: 1 }]), 100);
});
test('ex04 · không tạo biến toàn cục', () => {
  calculateTotal([{ price: 100, qty: 1 }]);
  for (const name of ['total', 'item', 'i', 'discount']) assert.equal(name in globalThis, false, `rò biến toàn cục: ${name}`);
});
