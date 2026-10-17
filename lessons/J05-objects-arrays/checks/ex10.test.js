import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffObjects } from '../answers/ex10.js';

test('ex10 · added / removed / changed, sắp xếp theo key', () => {
  const before = { name: 'An', role: 'user', phone: '090' };
  const after = { name: 'An Nguyễn', role: 'user', email: 'an@x.vn' };
  assert.deepEqual(diffObjects(before, after), [
    { key: 'email', type: 'added', to: 'an@x.vn' },
    { key: 'name', type: 'changed', from: 'An', to: 'An Nguyễn' },
    { key: 'phone', type: 'removed', from: '090' },
  ]);
});
test('ex10 · so sâu: object/mảng giống nhau không tính là đổi', () => {
  const before = { tags: ['a', 'b'], addr: { city: 'HN' }, at: new Date(1) };
  const after = { tags: ['a', 'b'], addr: { city: 'HN' }, at: new Date(1) };
  assert.deepEqual(diffObjects(before, after), []);
});
test('ex10 · thay đổi lồng nhau báo ở key tầng 1', () => {
  const r = diffObjects({ addr: { city: 'HN' } }, { addr: { city: 'SG' } });
  assert.deepEqual(r, [{ key: 'addr', type: 'changed', from: { city: 'HN' }, to: { city: 'SG' } }]);
});
test('ex10 · bỏ qua updatedAt mặc định, và ignore tùy chọn', () => {
  assert.deepEqual(diffObjects({ updatedAt: 1, a: 1 }, { updatedAt: 2, a: 1 }), []);
  assert.deepEqual(diffObjects({ v: 1, a: 1 }, { v: 2, a: 1 }, ['v']), []);
  assert.equal(diffObjects({ updatedAt: 1 }, { updatedAt: 2 }, []).length, 1);
});
test('ex10 · NaN không bị coi là thay đổi', () => assert.deepEqual(diffObjects({ x: NaN }, { x: NaN }), []));
