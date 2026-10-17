import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countByStatus } from '../answers/ex03.js';

test('ex03 · đếm', () => {
  assert.deepEqual(countByStatus([{ status: 'paid' }, { status: 'paid' }, { status: 'pending' }]), { paid: 2, pending: 1 });
});
test('ex03 · status liệt kê sẵn có mặt với 0', () => {
  assert.deepEqual(countByStatus([{ status: 'paid' }], ['cancelled', 'paid']), { cancelled: 0, paid: 1 });
});
test('ex03 · mảng rỗng', () => {
  assert.deepEqual(countByStatus([]), {});
  assert.deepEqual(countByStatus([], ['a']), { a: 0 });
});
test('ex03 · status lạ như toString vẫn đếm đúng', () => {
  assert.equal(countByStatus([{ status: 'toString' }, { status: 'toString' }]).toString, 2);
});
