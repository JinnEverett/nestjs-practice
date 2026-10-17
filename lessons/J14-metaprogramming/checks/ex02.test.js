import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEnum } from '../answers/ex02.js';

test('ex02 · giá trị và keys', () => {
  const Status = createEnum(['PENDING', 'PAID']);
  assert.equal(Status.PENDING, 'PENDING');
  assert.deepEqual(Object.keys(Status), ['PENDING', 'PAID']);
  assert.equal(JSON.stringify(Status), '{"PENDING":"PENDING","PAID":"PAID"}');
});
test('ex02 · values / has', () => {
  const Status = createEnum(['PENDING', 'PAID']);
  assert.deepEqual(Status.values(), ['PENDING', 'PAID']);
  assert.equal(Status.has('PAID'), true);
  assert.equal(Status.has('paid'), false);
  assert.equal(Status.has('toString'), false);
  assert.equal(Status.has('values'), false);
});
test('ex02 · đóng băng', () => {
  const Status = createEnum(['A']);
  assert.ok(Object.isFrozen(Status));
  assert.throws(() => {
    Status.A = 'x';
  }, TypeError);
  assert.throws(() => {
    Status.B = 'B';
  }, TypeError);
});
test('ex02 · tên trùng', () => assert.throws(() => createEnum(['A', 'A']), Error));
