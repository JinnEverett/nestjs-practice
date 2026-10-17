import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmOrders } from '../answers/ex01.js';

function fakeMailer({ failFor = [], delayMs = 20 } = {}) {
  let inFlight = 0;
  let maxInFlight = 0;
  const delivered = [];
  return {
    delivered,
    maxInFlight: () => maxInFlight,
    async send(to, subject) {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, delayMs));
      inFlight--;
      if (failFor.includes(to)) throw new Error(`SMTP từ chối ${to}`);
      delivered.push({ to, subject });
    },
  };
}
const orders = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, email: `u${i + 1}@shop.vn` }));

test('ex01 · chờ gửi xong rồi mới trả: sent đúng', async () => {
  const m = fakeMailer();
  const r = await confirmOrders(orders(7), m);
  assert.equal(r.sent, 7);
  assert.deepEqual(r.failed, []);
  assert.equal(m.delivered.length, 7, 'trả về trước khi gửi xong');
});
test('ex01 · nội dung email có mã đơn', async () => {
  const m = fakeMailer();
  await confirmOrders([{ id: 42, email: 'a@b.vn' }], m);
  assert.match(m.delivered[0].subject, /42/);
  assert.equal(m.delivered[0].to, 'a@b.vn');
});
test('ex01 · tối đa 3 email song song (và thực sự song song)', async () => {
  const m = fakeMailer({ delayMs: 30 });
  const t0 = performance.now();
  await confirmOrders(orders(9), m);
  const took = performance.now() - t0;
  assert.equal(m.maxInFlight(), 3);
  assert.ok(took < 9 * 30 * 0.7, `quá chậm (${took.toFixed(0)}ms) — đang gửi tuần tự?`);
});
test('ex01 · email lỗi không làm dừng các email khác; failed theo thứ tự đơn', async () => {
  const m = fakeMailer({ failFor: ['u2@shop.vn', 'u5@shop.vn'] });
  const r = await confirmOrders(orders(6), m);
  assert.equal(r.sent, 4);
  assert.deepEqual(r.failed.map((f) => f.id), [2, 5]);
  assert.match(r.failed[0].error.message, /u2@shop\.vn/);
  assert.equal(m.delivered.length, 4);
});
test('ex01 · không có unhandledRejection khi có email lỗi', async () => {
  const errors = [];
  const onErr = (e) => errors.push(e);
  process.on('unhandledRejection', onErr);
  await confirmOrders(orders(5), fakeMailer({ failFor: ['u1@shop.vn', 'u3@shop.vn'] }));
  await new Promise((r) => setTimeout(r, 50));
  process.off('unhandledRejection', onErr);
  assert.deepEqual(errors, []);
});
test('ex01 · danh sách rỗng', async () => {
  assert.deepEqual(await confirmOrders([], fakeMailer()), { sent: 0, failed: [] });
});
test('ex01 · ít đơn hơn mức song song', async () => {
  const r = await confirmOrders(orders(2), fakeMailer());
  assert.equal(r.sent, 2);
});
