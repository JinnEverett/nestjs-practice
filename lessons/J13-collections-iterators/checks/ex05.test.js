import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paginate } from '../answers/ex05.js';

const pages = { null: { items: [1, 2], nextCursor: 'c2' }, c2: { items: [3, 4], nextCursor: 'c3' }, c3: { items: [5], nextCursor: null } };
const makeFetch = () => {
  const calls = [];
  const fetchPage = async (cursor) => {
    calls.push(cursor);
    return pages[String(cursor)];
  };
  return { fetchPage, calls };
};

test('ex05 · duyệt hết các trang', async () => {
  const { fetchPage, calls } = makeFetch();
  const items = [];
  for await (const x of paginate(fetchPage)) items.push(x);
  assert.deepEqual(items, [1, 2, 3, 4, 5]);
  assert.deepEqual(calls, [null, 'c2', 'c3']);
});
test('ex05 · dừng sớm không tải thêm', async () => {
  const { fetchPage, calls } = makeFetch();
  for await (const x of paginate(fetchPage)) if (x === 2) break;
  assert.deepEqual(calls, [null]);
});
test('ex05 · trang rỗng ở giữa vẫn đi tiếp', async () => {
  const p = { null: { items: [], nextCursor: 'b' }, b: { items: ['x'], nextCursor: null } };
  const out = [];
  for await (const x of paginate(async (c) => p[String(c)])) out.push(x);
  assert.deepEqual(out, ['x']);
});
test('ex05 · lỗi lan ra', async () => {
  await assert.rejects(async () => {
    for await (const x of paginate(async () => {
      throw new Error('503');
    }));
  }, /503/);
});
