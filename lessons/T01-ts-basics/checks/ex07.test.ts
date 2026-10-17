import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { effectivePrice, findCheapest, averagePrice, type Product } from '../answers/ex07.js';

type _c = Expect<Equal<ReturnType<typeof findCheapest>, Product | undefined>>;
type _a = Expect<Equal<ReturnType<typeof averagePrice>, number | null>>;
type _salePrice = Expect<Equal<Product['salePrice'], number | undefined>>;

const ps: Product[] = [
  { id: 1, name: 'A', price: 100 },
  { id: 2, name: 'B', price: 300, salePrice: 50 },
  { id: 3, name: 'C', price: 90 },
];
test('ex07 · effectivePrice, kể cả salePrice = 0', () => {
  assert.equal(effectivePrice(ps[1]!), 50);
  assert.equal(effectivePrice({ id: 4, name: 'Free', price: 100, salePrice: 0 }), 0);
});
test('ex07 · findCheapest', () => {
  assert.equal(findCheapest(ps)?.id, 2);
  assert.equal(findCheapest([]), undefined);
});
test('ex07 · averagePrice', () => {
  assert.equal(averagePrice(ps), 80);
  assert.equal(averagePrice([]), null);
});
