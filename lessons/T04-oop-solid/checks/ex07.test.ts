import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OrderService, type Order, type OrderRepository, type Mailer, type Clock } from '../answers/ex07.js';

const setup = (mailFails = false) => {
  const saved: Omit<Order, 'id'>[] = [];
  const mails: [string, string][] = [];
  const repo: OrderRepository = { save: async (data) => (saved.push(data), { id: saved.length, ...data }) };
  const mailer: Mailer = {
    send: async (to, subject) => {
      if (mailFails) throw new Error('SMTP down');
      mails.push([to, subject]);
    },
  };
  const clock: Clock = { now: () => new Date('2026-10-17T03:00:00Z') };
  return { service: new OrderService(repo, mailer, clock), saved, mails };
};

test('ex07 · lưu đơn với thời gian từ clock, gửi mail', async () => {
  const { service, saved, mails } = setup();
  const order = await service.placeOrder({ customerEmail: 'a@x.vn', total: 500 });
  assert.deepEqual(order, { id: 1, customerEmail: 'a@x.vn', total: 500, createdAt: new Date('2026-10-17T03:00:00Z') });
  assert.equal(saved.length, 1);
  assert.deepEqual(mails, [['a@x.vn', 'Đơn #1 đã được tạo']]);
});
test('ex07 · mail lỗi vẫn trả order', async () => {
  const { service, saved } = setup(true);
  const order = await service.placeOrder({ customerEmail: 'a@x.vn', total: 500 });
  assert.equal(order.id, 1);
  assert.equal(saved.length, 1);
});
test('ex07 · total sai', async () => {
  const { service, saved } = setup();
  await assert.rejects(service.placeOrder({ customerEmail: 'a@x.vn', total: 0 }), RangeError);
  assert.equal(saved.length, 0);
});
