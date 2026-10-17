import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPrice } from '../answers/ex06.js';

const n = (s) => s.replace(/ /g, ' ');
test('ex06 · chuỗi', () => {
  const p = createPrice(150000);
  assert.equal(n(`${p}`), '150.000 ₫');
  assert.equal(n(String(p)), '150.000 ₫');
});
test('ex06 · số', () => {
  const p = createPrice(150000);
  assert.equal(+p, 150000);
  assert.equal(p + 1, 150001);
  assert.equal(p > 100, true);
  assert.equal(p.amount, 150000);
});
test('ex06 · toStringTag và JSON', () => {
  const p = createPrice(150000);
  assert.equal(Object.prototype.toString.call(p), '[object Price]');
  assert.equal(JSON.stringify({ price: p }), '{"price":150000}');
});
