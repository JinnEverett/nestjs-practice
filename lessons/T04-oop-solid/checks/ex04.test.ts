import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StandardShipping, ExpressShipping, FreeShippingOver, ShippingCalculator, type ShippingStrategy } from '../answers/ex04.js';

test('ex04 · từng strategy', () => {
  const std = new StandardShipping();
  assert.equal(std.calculate({ subtotal: 100_000, weightKg: 1.2 }), 30_000);
  assert.equal(new ExpressShipping().calculate({ subtotal: 100_000, weightKg: 1.2 }), 60_000);
  const free = new FreeShippingOver(500_000, std);
  assert.equal(free.calculate({ subtotal: 500_000, weightKg: 3 }), 0);
  assert.equal(free.calculate({ subtotal: 499_999, weightKg: 1 }), 25_000);
});
test('ex04 · calculator nhận strategy bất kỳ (kể cả object literal)', () => {
  const pickup: ShippingStrategy = { name: 'Nhận tại cửa hàng', calculate: () => 5_000 };
  const calc = new ShippingCalculator([new ExpressShipping(), new StandardShipping(), pickup]);
  const order = { subtotal: 100_000, weightKg: 2 };
  assert.deepEqual(calc.quote(order).map((q) => q.fee), [5_000, 30_000, 60_000]);
  assert.equal(calc.cheapest(order).name, 'Nhận tại cửa hàng');
});
