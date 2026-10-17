import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Notifier, EmailNotifier, SmsNotifier } from '../answers/ex02.js';

const transport = () => {
  const sent: [string, string][] = [];
  return { sent, fn: async (to: string, body: string) => void sent.push([to, body]) };
};

function _typeTests() {
  // @ts-expect-error abstract class không new được
  new Notifier();
}

test('ex02 · email', async () => {
  const t = transport();
  await new EmailNotifier(t.fn).notify('a@x.vn', '  Đơn đã giao ');
  assert.deepEqual(t.sent, [['a@x.vn', 'Đơn đã giao\n--\nShop']]);
});
test('ex02 · validate chung (template method)', async () => {
  const t = transport();
  const n = new EmailNotifier(t.fn);
  await assert.rejects(n.notify('a@x.vn', '   '));
  await assert.rejects(n.notify('not-an-email', 'hi'));
  assert.equal(t.sent.length, 0);
});
test('ex02 · sms', async () => {
  const t = transport();
  const n = new SmsNotifier(t.fn);
  await n.notify('0901234567', 'x'.repeat(200));
  assert.equal(t.sent[0]![1].length, 160);
  await assert.rejects(n.notify('+84901', 'hi'));
  assert.ok(n instanceof Notifier);
});
