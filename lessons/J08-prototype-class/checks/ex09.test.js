import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Order, InvalidTransitionError } from '../answers/ex09.js';

const ticking = () => {
  let t = 0;
  return () => new Date((t += 1000));
};

test('ex09 · luồng chuẩn và history', () => {
  const o = new Order({ id: 1, now: ticking() });
  assert.equal(o.status, 'pending');
  assert.equal(o.pay().ship().deliver(), o);
  assert.equal(o.status, 'delivered');
  assert.deepEqual(
    o.history.map((h) => [h.from, h.to, h.at.getTime()]),
    [
      ['pending', 'paid', 1000],
      ['paid', 'shipped', 2000],
      ['shipped', 'delivered', 3000],
    ],
  );
});
test('ex09 · chuyển sai → InvalidTransitionError', () => {
  const o = new Order({ id: 1 });
  assert.throws(
    () => o.ship(),
    (e) => e instanceof InvalidTransitionError && e instanceof Error && e.from === 'pending' && e.to === 'shipped' && e.name === 'InvalidTransitionError' && e.message.includes('pending') && e.message.includes('shipped'),
  );
  o.cancel();
  assert.throws(() => o.pay(), InvalidTransitionError);
  assert.equal(o.status, 'cancelled');
});
test('ex09 · refund từ paid, không refund từ pending', () => {
  const o = new Order({ id: 1 });
  assert.throws(() => o.refund(), InvalidTransitionError);
  o.pay().refund();
  assert.equal(o.status, 'refunded');
});
test('ex09 · canTransitionTo', () => {
  const o = new Order({ id: 1 });
  assert.equal(o.canTransitionTo('paid'), true);
  assert.equal(o.canTransitionTo('delivered'), false);
  assert.equal(o.canTransitionTo('toString'), false);
});
test('ex09 · history là bản copy, status không gán được', () => {
  const o = new Order({ id: 1 });
  o.pay();
  o.history.push({ from: 'x', to: 'y' });
  o.history[0].to = 'hacked';
  assert.equal(o.history.length, 1);
  assert.equal(o.history[0].to, 'paid');
  assert.throws(() => {
    o.status = 'delivered';
  }, TypeError);
});
