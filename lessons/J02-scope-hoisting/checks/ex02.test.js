import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeHandlers } from '../answers/ex02.js';

test('ex02 · mỗi handler nhớ đúng tên và vị trí của nó', () => {
  const hs = makeHandlers(['An', 'Bình', 'Chi']);
  assert.deepEqual(hs.map((h) => h()), ['Hello, An #0', 'Hello, Bình #1', 'Hello, Chi #2']);
});
test('ex02 · gọi lại nhiều lần vẫn đúng', () => {
  const [h] = makeHandlers(['An']);
  assert.equal(h(), 'Hello, An #0');
  assert.equal(h(), 'Hello, An #0');
});
test('ex02 · mảng rỗng → mảng rỗng', () => assert.deepEqual(makeHandlers([]), []));
test('ex02 · sửa mảng names sau khi tạo không làm đổi kết quả', () => {
  const names = ['An', 'Bình'];
  const hs = makeHandlers(names);
  names[0] = 'XXX';
  assert.equal(hs[0](), 'Hello, An #0');
});
