import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readonlyView } from '../answers/ex04.js';

const make = () => ({ id: 1, address: { city: 'HN', geo: { lat: 21 } }, tags: ['a'] });

test('ex04 · đọc bình thường', () => {
  const v = readonlyView(make());
  assert.equal(v.address.geo.lat, 21);
  assert.equal(v.tags[0], 'a');
  assert.deepEqual(Object.keys(v), ['id', 'address', 'tags']);
});
test('ex04 · chặn ghi mọi tầng', () => {
  const v = readonlyView(make());
  assert.throws(() => {
    v.id = 2;
  }, TypeError);
  assert.throws(() => {
    v.address.city = 'SG';
  }, TypeError);
  assert.throws(() => {
    v.address.geo.lat = 0;
  }, TypeError);
  assert.throws(() => v.tags.push('b'), TypeError);
  assert.throws(() => {
    delete v.address;
  }, TypeError);
  assert.throws(() => Object.defineProperty(v, 'x', { value: 1 }), TypeError);
});
test('ex04 · gốc sửa được, view thấy thay đổi', () => {
  const src = make();
  const v = readonlyView(src);
  src.address.city = 'Huế';
  assert.equal(v.address.city, 'Huế');
});
test('ex04 · cùng proxy cho cùng object con', () => {
  const v = readonlyView(make());
  assert.equal(v.address, v.address);
});
