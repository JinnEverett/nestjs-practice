import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChangeTracker } from '../answers/ex05.js';

const make = () => ({ name: 'An', email: 'a@x.vn', address: { city: 'HN', zip: '100000' }, tags: ['x'] });

test('ex05 · ghi nhận thay đổi tầng 1 và lồng nhau, sắp theo path', () => {
  const target = make();
  const { proxy, getChanges } = createChangeTracker(target);
  proxy.name = 'An Nguyễn';
  proxy.address.city = 'SG';
  assert.deepEqual(getChanges(), [
    { path: 'address.city', from: 'HN', to: 'SG' },
    { path: 'name', from: 'An', to: 'An Nguyễn' },
  ]);
  assert.equal(target.address.city, 'SG');
});
test('ex05 · from là giá trị ban đầu, to là hiện tại', () => {
  const { proxy, getChanges } = createChangeTracker(make());
  proxy.name = 'B';
  proxy.name = 'C';
  assert.deepEqual(getChanges(), [{ path: 'name', from: 'An', to: 'C' }]);
});
test('ex05 · gán về giá trị cũ → hết thay đổi', () => {
  const { proxy, getChanges } = createChangeTracker(make());
  proxy.email = 'b@x.vn';
  proxy.email = 'a@x.vn';
  assert.deepEqual(getChanges(), []);
});
test('ex05 · field mới, mảng coi như giá trị', () => {
  const { proxy, getChanges } = createChangeTracker(make());
  proxy.phone = '090';
  proxy.tags = ['x', 'y'];
  assert.deepEqual(getChanges(), [
    { path: 'phone', from: undefined, to: '090' },
    { path: 'tags', from: ['x'], to: ['x', 'y'] },
  ]);
});
test('ex05 · reset', () => {
  const { proxy, getChanges, reset } = createChangeTracker(make());
  proxy.name = 'X';
  reset();
  assert.deepEqual(getChanges(), []);
  proxy.name = 'Y';
  assert.deepEqual(getChanges(), [{ path: 'name', from: 'X', to: 'Y' }]);
});
