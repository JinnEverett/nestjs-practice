import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeStatus } from '../answers/ex06.js';

const table = {
  pending: ['Chờ xử lý', 'gray'],
  paid: ['Đã thanh toán', 'blue'],
  shipped: ['Đang giao', 'orange'],
  delivered: ['Đã giao', 'green'],
  cancelled: ['Đã hủy', 'red'],
};
test('ex06 · đủ 5 trạng thái', () => {
  for (const [s, [label, color]] of Object.entries(table)) assert.deepEqual(describeStatus(s), { label, color }, s);
});
test('ex06 · trạng thái lạ → Không rõ', () => {
  assert.deepEqual(describeStatus('refunded'), { label: 'Không rõ', color: 'gray' });
  assert.deepEqual(describeStatus(undefined), { label: 'Không rõ', color: 'gray' });
});
test('ex06 · không bị lừa bởi thuộc tính của Object.prototype', () => {
  assert.deepEqual(describeStatus('toString'), { label: 'Không rõ', color: 'gray' });
  assert.deepEqual(describeStatus('constructor'), { label: 'Không rõ', color: 'gray' });
  assert.deepEqual(describeStatus('__proto__'), { label: 'Không rõ', color: 'gray' });
});
test('ex06 · mỗi lần gọi trả object mới, sửa không ảnh hưởng lần sau', () => {
  const a = describeStatus('paid');
  a.label = 'HACKED';
  assert.equal(describeStatus('paid').label, 'Đã thanh toán');
  const u = describeStatus('nope');
  u.color = 'black';
  assert.equal(describeStatus('nope').color, 'gray');
});
