import { test } from 'node:test';
import assert from 'node:assert/strict';
import { batch } from '../answers/ex08.js';

const collect = async (it) => {
  const out = [];
  for await (const x of it) out.push(x);
  return out;
};

test('ex08 · nguồn đồng bộ', async () => assert.deepEqual(await collect(batch([1, 2, 3, 4, 5], 2)), [[1, 2], [3, 4], [5]]));
test('ex08 · nguồn bất đồng bộ', async () => {
  async function* rows() {
    for (let i = 1; i <= 4; i++) yield i;
  }
  assert.deepEqual(await collect(batch(rows(), 2)), [
    [1, 2],
    [3, 4],
  ]);
});
test('ex08 · rỗng không yield gì', async () => assert.deepEqual(await collect(batch([], 3)), []));
test('ex08 · lười: chỉ đọc đủ cho lô đầu', async () => {
  let pulled = 0;
  async function* rows() {
    for (let i = 0; i < 1000; i++) {
      pulled++;
      yield i;
    }
  }
  for await (const lot of batch(rows(), 10)) {
    assert.equal(lot.length, 10);
    break;
  }
  assert.ok(pulled <= 11, `đã đọc ${pulled} dòng`);
});
test('ex08 · size sai', async () => {
  for (const size of [0, -1, 1.5]) await assert.rejects(collect(batch([1], size)), RangeError);
});
