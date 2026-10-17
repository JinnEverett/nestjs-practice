import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEmitter } from '../answers/ex05.js';

type Events = { 'order.created': { orderId: number }; 'user.registered': { email: string } };

function _typeTests() {
  const em = createEmitter<Events>();
  em.on('order.created', (p) => {
    const id: number = p.orderId;
    void id;
    // @ts-expect-error payload order không có email
    void p.email;
  });
  // @ts-expect-error payload sai kiểu
  em.emit('order.created', { orderId: '1' });
  // @ts-expect-error event lạ
  em.emit('order.deleted', {});
}

test('ex05 · on/emit/unsubscribe', () => {
  const em = createEmitter<Events>();
  const got: number[] = [];
  const off = em.on('order.created', (p) => got.push(p.orderId));
  em.emit('order.created', { orderId: 1 });
  em.emit('user.registered', { email: 'a@x' });
  off();
  em.emit('order.created', { orderId: 2 });
  assert.deepEqual(got, [1]);
});
