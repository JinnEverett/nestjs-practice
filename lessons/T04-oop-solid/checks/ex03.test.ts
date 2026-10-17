import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PaymentService, type PaymentGateway } from '../answers/ex03.js';

const fakeGateway = () => {
  const calls: [number, string][] = [];
  const gw: PaymentGateway = {
    charge: async (amount, token) => {
      calls.push([amount, token]);
      return { transactionId: `tx-${amount}` };
    },
  };
  return { gw, calls };
};

test('ex03 · pay dùng gateway được tiêm vào', async () => {
  const { gw, calls } = fakeGateway();
  assert.deepEqual(await new PaymentService(gw).pay(7, 500, 'tok'), { orderId: 7, amount: 500, transactionId: 'tx-500' });
  assert.deepEqual(calls, [[500, 'tok']]);
});
test('ex03 · amount sai không gọi gateway', async () => {
  const { gw, calls } = fakeGateway();
  await assert.rejects(new PaymentService(gw).pay(1, 0, 't'), RangeError);
  assert.equal(calls.length, 0);
});
test('ex03 · không phụ thuộc implementation cụ thể', () => {
  const src = readFileSync(new URL('../../answers/ex03.ts', import.meta.url), 'utf8'); // test TS chạy từ .build/checks
  assert.equal(/new\s+\w*(Gateway|Stripe|Vnpay|Momo)\w*\s*\(/i.test(src), false);
});
