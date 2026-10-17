import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flattenCategories } from '../answers/ex08.js';

const tree = [
  {
    id: 1,
    name: 'Thời trang',
    children: [
      { id: 2, name: 'Áo', children: [{ id: 3, name: 'Áo thun' }] },
      { id: 4, name: 'Quần' },
    ],
  },
  { id: 5, name: 'Điện tử', children: [] },
];
test('ex08 · duyệt tiền thứ tự với depth và path', () => {
  assert.deepEqual(flattenCategories(tree), [
    { id: 1, name: 'Thời trang', depth: 0, path: 'Thời trang' },
    { id: 2, name: 'Áo', depth: 1, path: 'Thời trang > Áo' },
    { id: 3, name: 'Áo thun', depth: 2, path: 'Thời trang > Áo > Áo thun' },
    { id: 4, name: 'Quần', depth: 1, path: 'Thời trang > Quần' },
    { id: 5, name: 'Điện tử', depth: 0, path: 'Điện tử' },
  ]);
});
test('ex08 · cây rỗng', () => assert.deepEqual(flattenCategories([]), []));
test('ex08 · cây sâu 500 tầng', () => {
  let node = { id: 500, name: 'n500' };
  for (let i = 499; i >= 1; i--) node = { id: i, name: `n${i}`, children: [node] };
  const flat = flattenCategories([node]);
  assert.equal(flat.length, 500);
  assert.equal(flat[499].depth, 499);
});
