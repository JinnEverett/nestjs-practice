import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describePayment, feeFor, type Payment } from '../answers/ex04.js';

function _typeTests() {
  // @ts-expect-error card không có bankCode
  const bad: Payment = { type: 'card', bankCode: 'x' };
  // @ts-expect-error bank thiếu accountNo
  const bad2: Payment = { type: 'bank', bankCode: 'VCB' };
  void bad;
  void bad2;
}

test('ex04 · describePayment', () => {
  assert.equal(describePayment({ type: 'card', last4: '4242' }), 'Thẻ •••• 4242');
  assert.equal(describePayment({ type: 'bank', bankCode: 'VCB', accountNo: '0123456789' }), 'Chuyển khoản VCB - ****6789');
  assert.equal(describePayment({ type: 'cod' }), 'Thanh toán khi nhận hàng');
});
test('ex04 · feeFor', () => {
  assert.equal(feeFor({ type: 'card', last4: '1' }, 150_050), 3001);
  assert.equal(feeFor({ type: 'bank', bankCode: 'A', accountNo: '1' }, 1_000_000), 0);
  assert.equal(feeFor({ type: 'cod' }, 10), 15000);
});
