import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { lineTotal, formatLine, type LineItem } from '../answers/ex01.js';

type _shape = Expect<Equal<LineItem, { name: string; qty: number; unitPrice: number }>>;
type _ret = Expect<Equal<ReturnType<typeof lineTotal>, number>>;
type _ret2 = Expect<Equal<ReturnType<typeof formatLine>, string>>;

function _typeTests() {
  // @ts-expect-error thiếu unitPrice
  lineTotal({ name: 'a', qty: 1 });
  // @ts-expect-error qty sai kiểu
  lineTotal({ name: 'a', qty: '1', unitPrice: 1 });
}

test('ex01 · lineTotal', () => assert.equal(lineTotal({ name: 'Áo', qty: 2, unitPrice: 150000 }), 300000));
test('ex01 · formatLine', () => assert.equal(formatLine({ name: 'Áo thun', qty: 2, unitPrice: 150000 }), '2 × Áo thun = 300000'));
