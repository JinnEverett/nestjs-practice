import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Measure, Memoize } from '../answers/ex02.js';

const records: [string, number][] = [];
const sink = (label: string, ms: number) => void records.push([label, ms]);

class PriceService {
  rate = 1.1;
  calls = 0;

  @Measure(sink)
  withTax(x: number) {
    return Math.round(x * this.rate);
  }

  @Measure(sink)
  async slow() {
    await new Promise((r) => setTimeout(r, 30));
    return 'done';
  }

  @Measure(sink)
  fail(): never {
    throw new Error('boom');
  }

  @Memoize()
  square(n: number) {
    this.calls++;
    return n === 0 ? undefined : n * n;
  }
}

test('ex02 · Measure giữ this và kết quả', () => {
  records.length = 0;
  assert.equal(new PriceService().withTax(100), 110);
  assert.equal(records[0]![0], 'PriceService.withTax');
  assert.ok(records[0]![1] >= 0);
});
test('ex02 · Measure đo async tới khi settle', async () => {
  records.length = 0;
  assert.equal(await new PriceService().slow(), 'done');
  assert.ok(records[0]![1] >= 25, `ms=${records[0]![1]}`);
});
test('ex02 · Measure khi lỗi', () => {
  records.length = 0;
  assert.throws(() => new PriceService().fail(), /boom/);
  assert.equal(records.length, 1);
});
test('ex02 · Memoize riêng từng instance, nhớ cả undefined', () => {
  const a = new PriceService();
  const b = new PriceService();
  a.square(3);
  a.square(3);
  a.square(0);
  a.square(0);
  b.square(3);
  assert.equal(a.calls, 2);
  assert.equal(b.calls, 1);
  assert.equal(a.square(3), 9);
});
