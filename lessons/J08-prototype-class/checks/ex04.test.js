import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../answers/ex04.js';

test('ex04 · on/emit theo thứ tự đăng ký, trả số handler', () => {
  const bus = new EventBus();
  const log = [];
  bus.on('x', (p) => log.push(`a${p}`));
  bus.on('x', (p) => log.push(`b${p}`));
  assert.equal(bus.emit('x', 1), 2);
  assert.deepEqual(log, ['a1', 'b1']);
  assert.equal(bus.emit('nothing'), 0);
});
test('ex04 · unsubscribe và off', () => {
  const bus = new EventBus();
  let n = 0;
  const h = () => n++;
  const unsub = bus.on('x', h);
  unsub();
  bus.emit('x');
  bus.on('x', h);
  bus.off('x', h);
  bus.emit('x');
  assert.equal(n, 0);
});
test('ex04 · once', () => {
  const bus = new EventBus();
  let n = 0;
  bus.once('x', () => n++);
  bus.emit('x');
  bus.emit('x');
  assert.equal(n, 1);
});
test('ex04 · handler thêm trong lúc emit không chạy ở lần đó', () => {
  const bus = new EventBus();
  const log = [];
  bus.on('x', () => {
    log.push('first');
    bus.on('x', () => log.push('late'));
  });
  bus.emit('x');
  assert.deepEqual(log, ['first']);
});
test('ex04 · đăng ký trùng chỉ tính 1', () => {
  const bus = new EventBus();
  let n = 0;
  const h = () => n++;
  bus.on('x', h);
  bus.on('x', h);
  assert.equal(bus.emit('x'), 1);
  assert.equal(n, 1);
});
test('ex04 · không lộ state', () => assert.deepEqual(Object.keys(new EventBus()), []));
