import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Money } from '../answers/ex02.js';

test('ex02 · tạo và đọc', () => {
  const m = new Money(1250000);
  assert.equal(m.amount, 1250000);
  assert.equal(m.currency, 'VND');
  assert.equal(new Money(500, 'USD').currency, 'USD');
});
test('ex02 · validate', () => {
  for (const a of [1.5, NaN, '100', 2 ** 60]) assert.throws(() => new Money(a), RangeError, String(a));
  for (const c of ['vnd', 'VN', 'VNDD', '']) assert.throws(() => new Money(1, c), RangeError, c);
});
test('ex02 · bất biến', () => {
  const m = new Money(100);
  assert.throws(() => {
    m.amount = 5;
  }, TypeError);
  assert.equal(m.amount, 100);
  assert.deepEqual(Object.keys(m), []);
});
test('ex02 · add / subtract trả object mới', () => {
  const a = new Money(100);
  const b = new Money(30);
  const s = a.add(b);
  assert.ok(s instanceof Money);
  assert.equal(s.amount, 130);
  assert.equal(a.subtract(b).amount, 70);
  assert.equal(a.amount, 100);
});
test('ex02 · khác currency → TypeError', () => {
  assert.throws(() => new Money(1).add(new Money(1, 'USD')), TypeError);
  assert.throws(() => new Money(1).subtract(new Money(1, 'USD')), TypeError);
});
test('ex02 · multiply làm tròn', () => {
  assert.equal(new Money(1000).multiply(1.1).amount, 1100);
  assert.equal(new Money(333).multiply(0.5).amount, 167);
});
test('ex02 · equals, toString, toJSON, zero', () => {
  assert.equal(new Money(5).equals(new Money(5)), true);
  assert.equal(new Money(5).equals(new Money(5, 'USD')), false);
  assert.equal(new Money(5).equals(new Money(6)), false);
  assert.equal(String(new Money(1250000)), '1250000 VND');
  assert.equal(JSON.stringify({ p: new Money(9, 'USD') }), '{"p":{"amount":9,"currency":"USD"}}');
  assert.ok(Money.zero().equals(new Money(0)));
  assert.equal(Money.zero('USD').currency, 'USD');
});
