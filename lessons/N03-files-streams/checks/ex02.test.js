import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeFrame, decodeFrames } from '../answers/ex02.js';

test('ex02 · encodeFrame: 4 byte độ dài BE + nội dung', () => {
  const f = encodeFrame('abc');
  assert.ok(Buffer.isBuffer(f));
  assert.deepEqual([...f], [0, 0, 0, 3, 97, 98, 99]);
});
test('ex02 · độ dài tính bằng BYTE, không phải số ký tự', () => {
  const f = encodeFrame('Đơn hàng'); // 8 ký tự, 11 byte UTF-8
  assert.equal(f.readUInt32BE(0), Buffer.byteLength('Đơn hàng'));
  assert.equal(f.length, 4 + Buffer.byteLength('Đơn hàng'));
});
test('ex02 · khung rỗng hợp lệ', () => {
  assert.deepEqual([...encodeFrame('')], [0, 0, 0, 0]);
  const r = decodeFrames(encodeFrame(''));
  assert.deepEqual(r.messages, ['']);
  assert.equal(r.rest.length, 0);
});
test('ex02 · decode nhiều khung liền nhau', () => {
  const buf = Buffer.concat(['một', 'two', 'ba — 3'].map(encodeFrame));
  const r = decodeFrames(buf);
  assert.deepEqual(r.messages, ['một', 'two', 'ba — 3']);
  assert.equal(r.rest.length, 0);
});
test('ex02 · khung dang dở (thiếu payload) → nằm trong rest', () => {
  const a = encodeFrame('hoàn chỉnh');
  const b = encodeFrame('dang dở');
  const buf = Buffer.concat([a, b.subarray(0, b.length - 3)]);
  const r = decodeFrames(buf);
  assert.deepEqual(r.messages, ['hoàn chỉnh']);
  assert.deepEqual(r.rest, b.subarray(0, b.length - 3));
});
test('ex02 · thiếu cả header (< 4 byte) → rest', () => {
  const a = encodeFrame('x');
  const buf = Buffer.concat([a, Buffer.from([0, 0])]);
  const r = decodeFrames(buf);
  assert.deepEqual(r.messages, ['x']);
  assert.deepEqual([...r.rest], [0, 0]);
});
test('ex02 · nối rest với dữ liệu đến sau thì decode được nốt (giả lập TCP chia gói tùy ý)', () => {
  const full = Buffer.concat(['Đơn #1', 'Đơn #2 dài hơn một chút', 'Đ'].map(encodeFrame));
  const got = [];
  let pending = Buffer.alloc(0);
  for (let i = 0; i < full.length; i += 5) {
    pending = Buffer.concat([pending, full.subarray(i, i + 5)]);
    const r = decodeFrames(pending);
    got.push(...r.messages);
    pending = r.rest;
  }
  assert.deepEqual(got, ['Đơn #1', 'Đơn #2 dài hơn một chút', 'Đ']);
  assert.equal(pending.length, 0);
});
test('ex02 · buffer rỗng', () => {
  const r = decodeFrames(Buffer.alloc(0));
  assert.deepEqual(r.messages, []);
  assert.equal(r.rest.length, 0);
});
