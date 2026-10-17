import { test } from 'node:test';
import assert from 'node:assert/strict';
import { instrumentMethods } from '../answers/ex08.js';

class PriceService {
  rate = 1.1;
  withTax(x) {
    return Math.round(x * this.rate);
  }
  total(items) {
    return items.reduce((s, x) => s + this.withTax(x), 0);
  }
}

test('ex08 · gọi onCall rồi trả đúng kết quả', () => {
  const calls = [];
  const s = instrumentMethods(new PriceService(), ['withTax'], (name, args) => calls.push([name, args]));
  assert.equal(s.withTax(100), 110);
  assert.deepEqual(calls, [['withTax', [100]]]);
});
test('ex08 · method gốc dùng this.field và this.otherMethod', () => {
  const calls = [];
  const s = instrumentMethods(new PriceService(), ['withTax', 'total'], (name) => calls.push(name));
  assert.equal(s.total([100, 200]), 330);
  assert.deepEqual(calls, ['total', 'withTax', 'withTax']);
});
test('ex08 · onCall chạy TRƯỚC method gốc', () => {
  const order = [];
  const svc = { run() { order.push('run'); } };
  instrumentMethods(svc, ['run'], () => order.push('onCall'));
  svc.run();
  assert.deepEqual(order, ['onCall', 'run']);
});
test('ex08 · trả về instance, không sửa prototype của class', () => {
  const a = new PriceService();
  assert.equal(instrumentMethods(a, ['withTax'], () => {}), a);
  const calls = [];
  instrumentMethods(new PriceService(), ['withTax'], () => calls.push(1));
  new PriceService().withTax(1); // instance khác không bị bọc
  assert.equal(calls.length, 0);
});
