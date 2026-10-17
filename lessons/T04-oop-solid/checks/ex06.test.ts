import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LegacyPayAdapter } from '../answers/ex06.js';
import { LegacyPayClient } from '../starter/legacy-pay.js';
import type { PaymentGateway } from '../answers/ex03.js';

test('ex06 · là PaymentGateway, đổi tên field', async () => {
  const gw: PaymentGateway = new LegacyPayAdapter(new LegacyPayClient());
  assert.deepEqual(await gw.charge(500, 'tok_1234'), { transactionId: 'TXN-500-1234' });
});
test('ex06 · lỗi SDK → Error', async () => {
  const gw = new LegacyPayAdapter(new LegacyPayClient());
  await assert.rejects(gw.charge(1, 'tok_declined'), (e: unknown) => e instanceof Error && e.message === 'E51: Insufficient funds');
});
