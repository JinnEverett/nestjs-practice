import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindAll } from '../answers/ex03.js';

test('ex03 · method tách ra vẫn giữ this', () => {
  const svc = bindAll({ n: 1, get() { return this.n; } }, 'get');
  const { get } = svc;
  assert.equal(get(), 1);
  assert.equal([0].map(svc.get)[0], 1);
});
test('ex03 · trả về chính obj và thấy thay đổi state', () => {
  const obj = { n: 1, inc() { this.n++; return this.n; } };
  assert.equal(bindAll(obj, 'inc'), obj);
  const { inc } = obj;
  inc();
  assert.equal(obj.n, 2);
});
test('ex03 · nhiều method, method trên prototype của class', () => {
  class Svc {
    x = 5;
    a() { return this.x; }
    b() { return this.x * 2; }
  }
  const s = bindAll(new Svc(), 'a', 'b');
  const { a, b } = s;
  assert.equal(a() + b(), 15);
});
test('ex03 · giữ tham số', () => {
  const obj = { base: 10, add(x, y) { return this.base + x + y; } };
  bindAll(obj, 'add');
  const { add } = obj;
  assert.equal(add(1, 2), 13);
});
test('ex03 · tên không phải function → TypeError', () => {
  assert.throws(() => bindAll({ n: 1 }, 'n'), TypeError);
  assert.throws(() => bindAll({}, 'missing'), TypeError);
});
