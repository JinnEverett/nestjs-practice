import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getShippingCity } from '../answers/ex07.js';

test('ex07 · lấy địa chỉ default đầu tiên', () => {
  const order = { customer: { addresses: [{ city: 'Huế', isDefault: false }, { city: 'Hà Nội', isDefault: true }, { city: 'Đà Nẵng', isDefault: true }] } };
  assert.equal(getShippingCity(order), 'Hà Nội');
});
test('ex07 · thiếu tầng nào cũng → N/A, không ném lỗi', () => {
  assert.equal(getShippingCity(undefined), 'N/A');
  assert.equal(getShippingCity(null), 'N/A');
  assert.equal(getShippingCity({}), 'N/A');
  assert.equal(getShippingCity({ customer: null }), 'N/A');
  assert.equal(getShippingCity({ customer: {} }), 'N/A');
  assert.equal(getShippingCity({ customer: { addresses: null } }), 'N/A');
});
test('ex07 · mảng rỗng hoặc không có default → N/A', () => {
  assert.equal(getShippingCity({ customer: { addresses: [] } }), 'N/A');
  assert.equal(getShippingCity({ customer: { addresses: [{ city: 'Huế', isDefault: false }] } }), 'N/A');
});
test('ex07 · isDefault phải đúng là true (không phải "true")', () => {
  assert.equal(getShippingCity({ customer: { addresses: [{ city: 'Huế', isDefault: 'true' }] } }), 'N/A');
});
test('ex07 · city null → N/A, city rỗng giữ nguyên', () => {
  assert.equal(getShippingCity({ customer: { addresses: [{ city: null, isDefault: true }] } }), 'N/A');
  assert.equal(getShippingCity({ customer: { addresses: [{ city: '', isDefault: true }] } }), '');
});
