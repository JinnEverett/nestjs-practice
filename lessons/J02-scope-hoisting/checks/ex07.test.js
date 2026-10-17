import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../answers/ex07.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const db = { 1: [1, 2, 3], 2: [1] };
const loadOrders = async (id) => {
  await sleep(id === 1 ? 30 : 5); // user 1 truy vấn chậm hơn
  return db[id] ?? [];
};

test('ex07 · một request đơn lẻ', async () => {
  assert.deepEqual(await handleRequest({ id: 2, name: 'Bình' }, loadOrders), { user: 'Bình', orders: 1 });
});
test('ex07 · hai request chạy xen kẽ không lẫn dữ liệu', async () => {
  const [a, b] = await Promise.all([handleRequest({ id: 1, name: 'An' }, loadOrders), handleRequest({ id: 2, name: 'Bình' }, loadOrders)]);
  assert.deepEqual(a, { user: 'An', orders: 3 });
  assert.deepEqual(b, { user: 'Bình', orders: 1 });
});
test('ex07 · 20 request đồng thời', async () => {
  const users = Array.from({ length: 20 }, (_, i) => ({ id: (i % 2) + 1, name: `U${i}` }));
  const res = await Promise.all(users.map((u) => handleRequest(u, loadOrders)));
  res.forEach((r, i) => assert.equal(r.user, `U${i}`));
});
