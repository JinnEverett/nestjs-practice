import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { OrderService } from '../answers/ex06.js';

const fakeNotifier = () => ({ sent: [], send(msg) { this.sent.push(msg); } });

test('ex06 · handler chạy đúng khi event bắn ra', () => {
  const emitter = new EventEmitter();
  const notifier = fakeNotifier();
  new OrderService(emitter, notifier);
  emitter.emit('order.created', { id: 7 });
  assert.deepEqual(notifier.sent, ['Đơn 7 đã tạo']);
});
test('ex06 · gọi trực tiếp handleOrderCreated cũng được', () => {
  const notifier = fakeNotifier();
  const s = new OrderService(new EventEmitter(), notifier);
  s.handleOrderCreated({ id: 1 });
  assert.deepEqual(notifier.sent, ['Đơn 1 đã tạo']);
});
test('ex06 · dispose hủy đúng handler', () => {
  const emitter = new EventEmitter();
  const notifier = fakeNotifier();
  const s = new OrderService(emitter, notifier);
  assert.equal(emitter.listenerCount('order.created'), 1);
  s.dispose();
  assert.equal(emitter.listenerCount('order.created'), 0);
  emitter.emit('order.created', { id: 9 });
  assert.deepEqual(notifier.sent, []);
});
test('ex06 · hai service, dispose một cái không ảnh hưởng cái kia', () => {
  const emitter = new EventEmitter();
  const n1 = fakeNotifier();
  const n2 = fakeNotifier();
  const s1 = new OrderService(emitter, n1);
  new OrderService(emitter, n2);
  s1.dispose();
  emitter.emit('order.created', { id: 3 });
  assert.deepEqual(n1.sent, []);
  assert.deepEqual(n2.sent, ['Đơn 3 đã tạo']);
});
