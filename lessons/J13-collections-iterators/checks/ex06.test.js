import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndex, search } from '../answers/ex06.js';

const docs = [
  { id: 3, text: 'Áo thun nam, cotton 100%' },
  { id: 1, text: 'Áo khoác nam chống nước' },
  { id: 2, text: 'Quần jean NAM' },
];

test('ex06 · index là Map<word, Set<id>>', () => {
  const idx = buildIndex(docs);
  assert.ok(idx instanceof Map);
  assert.ok(idx.get('nam') instanceof Set);
  assert.deepEqual([...idx.get('nam')].toSorted(), [1, 2, 3]);
  assert.deepEqual([...idx.get('áo')].toSorted(), [1, 3]);
  assert.equal(idx.has('100'), false);
});
test('ex06 · search AND, id tăng dần, không phân biệt hoa thường', () => {
  const idx = buildIndex(docs);
  assert.deepEqual(search(idx, 'áo NAM'), [1, 3]);
  assert.deepEqual(search(idx, 'nam'), [1, 2, 3]);
  assert.deepEqual(search(idx, 'áo jean'), []);
  assert.deepEqual(search(idx, 'không-có'), []);
  assert.deepEqual(search(idx, '  !!! '), []);
});
test('ex06 · từ trùng trong 1 doc chỉ tính một lần', () => {
  const idx = buildIndex([{ id: 1, text: 'sale sale SALE' }]);
  assert.equal(idx.get('sale').size, 1);
});
