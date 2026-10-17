import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Product } from '../answers/ex05.js';

test('ex05 · tạo và trim tên', () => {
  const p = new Product({ name: '  Áo thun ', price: 150000 });
  assert.equal(p.name, 'Áo thun');
  assert.equal(p.price, 150000);
});
test('ex05 · validate tên', () => {
  for (const name of ['', '   ', 5, null]) assert.throws(() => new Product({ name, price: 1 }), TypeError);
  const p = new Product({ name: 'a', price: 1 });
  assert.throws(() => {
    p.name = '  ';
  }, TypeError);
  assert.equal(p.name, 'a');
});
test('ex05 · validate giá', () => {
  for (const price of [-1, 1.5, '100', NaN]) assert.throws(() => new Product({ name: 'a', price }), RangeError);
});
test('ex05 · toJSON', () => {
  const json = JSON.parse(JSON.stringify(new Product({ name: 'Áo', price: 150000 })));
  assert.equal(json.name, 'Áo');
  assert.equal(json.price, 150000);
  assert.equal(json.priceLabel.replace(/ /g, ' '), '150.000 ₫');
});
test('ex05 · fromJSON đi qua validate', () => {
  const p = Product.fromJSON('{"name":" Quần ","price":200000}');
  assert.ok(p instanceof Product);
  assert.equal(p.name, 'Quần');
  assert.throws(() => Product.fromJSON('{"name":"x","price":-5}'), RangeError);
});
