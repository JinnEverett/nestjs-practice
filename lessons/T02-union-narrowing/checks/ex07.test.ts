import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDispatcher, type AppEvent } from '../answers/ex07.js';

function _typeTests() {
  // @ts-expect-error thiếu handler user.registered
  createDispatcher({ 'order.created': (e) => void e.orderId });
  createDispatcher({
    'order.created': (e) => void e.orderId,
    // @ts-expect-error event user.registered không có orderId
    'user.registered': (e) => void e.orderId,
  });
}

test('ex07 · gọi đúng handler với đúng event', () => {
  const log: string[] = [];
  const dispatch = createDispatcher({
    'order.created': (e) => log.push(`order ${e.orderId} ${e.total}`),
    'user.registered': (e) => log.push(`user ${e.email}`),
  });
  const events: AppEvent[] = [
    { type: 'user.registered', email: 'a@x.vn' },
    { type: 'order.created', orderId: 7, total: 500 },
  ];
  events.forEach(dispatch);
  assert.deepEqual(log, ['user a@x.vn', 'order 7 500']);
});
