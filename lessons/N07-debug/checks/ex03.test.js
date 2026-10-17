import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInventory } from '../answers/ex03.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fakeDb(initial, { delayMs = 5, failOn } = {}) {
  const rows = new Map(Object.entries(initial).map(([k, v]) => [k, { stock: v }]));
  const ops = { get: 0, set: 0 };
  return {
    rows,
    ops,
    async get(sku) {
      ops.get++;
      await sleep(Math.random() * delayMs);
      if (failOn?.(sku, 'get', ops)) throw new Error('DB get lỗi');
      return { ...rows.get(sku) };
    },
    async set(sku, value) {
      ops.set++;
      await sleep(Math.random() * delayMs);
      if (failOn?.(sku, 'set', ops)) throw new Error('DB set lỗi');
      rows.set(sku, { ...value });
    },
  };
}

test('ex03 · tuần tự: đặt chỗ đến khi hết hàng', async () => {
  const db = fakeDb({ A: 2 });
  const inv = createInventory(db);
  assert.equal(await inv.reserve('A', 1), true);
  assert.equal(await inv.reserve('A', 1), true);
  assert.equal(await inv.reserve('A', 1), false);
  assert.equal(db.rows.get('A').stock, 0);
});
test('ex03 · qty vượt tồn → false, không đổi tồn', async () => {
  const db = fakeDb({ A: 3 });
  assert.equal(await createInventory(db).reserve('A', 5), false);
  assert.equal(db.rows.get('A').stock, 3);
});
test('ex03 · 50 request ĐỒNG THỜI, tồn 10 → đúng 10 thành công', async () => {
  for (let round = 0; round < 3; round++) {
    const db = fakeDb({ A: 10 });
    const inv = createInventory(db);
    const results = await Promise.all(Array.from({ length: 50 }, () => inv.reserve('A', 1)));
    assert.equal(results.filter(Boolean).length, 10, `vòng ${round}`);
    assert.equal(db.rows.get('A').stock, 0);
  }
});
test('ex03 · qty > 1 đồng thời không âm tồn', async () => {
  const db = fakeDb({ A: 10 });
  const inv = createInventory(db);
  const results = await Promise.all(Array.from({ length: 20 }, () => inv.reserve('A', 3)));
  assert.equal(results.filter(Boolean).length, 3); // 3 × 3 = 9 ≤ 10
  assert.equal(db.rows.get('A').stock, 1);
});
test('ex03 · SKU khác nhau chạy SONG SONG (không khóa toàn cục)', async () => {
  const db = fakeDb({ A: 5, B: 5, C: 5, D: 5 }, { delayMs: 0 });
  const slow = {
    ...db,
    get: async (s) => { await sleep(40); return db.get(s); },
  };
  const inv = createInventory(slow);
  const t0 = performance.now();
  await Promise.all(['A', 'B', 'C', 'D'].map((s) => inv.reserve(s, 1)));
  const took = performance.now() - t0;
  assert.ok(took < 40 * 4 * 0.6, `mất ${took.toFixed(0)}ms — đang khóa toàn cục?`);
});
test('ex03 · db ném lỗi → caller nhận lỗi, khóa được nhả, lần sau vẫn chạy', async () => {
  let fail = true;
  const db = fakeDb({ A: 5 }, { delayMs: 1, failOn: (sku, op) => fail && op === 'get' });
  const inv = createInventory(db);
  await assert.rejects(inv.reserve('A', 1), /DB get lỗi/);
  fail = false;
  const r = await Promise.race([inv.reserve('A', 1), sleep(1000).then(() => 'TREO')]);
  assert.equal(r, true);
});
test('ex03 · lỗi ở một request trong hàng đợi không làm hỏng các request sau', async () => {
  let n = 0;
  const db = fakeDb({ A: 10 }, { delayMs: 1, failOn: (sku, op) => op === 'get' && ++n === 2 });
  const inv = createInventory(db);
  const settled = await Promise.allSettled([inv.reserve('A', 1), inv.reserve('A', 1), inv.reserve('A', 1)]);
  assert.deepEqual(settled.map((s) => s.status), ['fulfilled', 'rejected', 'fulfilled']);
  assert.equal(db.rows.get('A').stock, 8);
});
test('ex03 · qty không hợp lệ → RangeError', async () => {
  const inv = createInventory(fakeDb({ A: 5 }));
  for (const bad of [0, -1, 1.5, '2', NaN, undefined]) {
    await assert.rejects(inv.reserve('A', bad), RangeError, String(bad));
  }
});
