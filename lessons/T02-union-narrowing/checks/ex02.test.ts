import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { area, assertNever, type Shape } from '../answers/ex02.js';

type _never = Expect<Equal<Parameters<typeof assertNever>, [x: never]>>;
type _kinds = Expect<Equal<Shape['kind'], 'circle' | 'rect' | 'triangle'>>;

function _typeTests() {
  // @ts-expect-error kind lạ
  area({ kind: 'hexagon', side: 1 });
  // @ts-expect-error circle không có width
  area({ kind: 'circle', width: 1 });
}

test('ex02 · area', () => {
  assert.ok(Math.abs(area({ kind: 'circle', radius: 1 }) - Math.PI) < 1e-9);
  assert.equal(area({ kind: 'rect', width: 2, height: 3 }), 6);
  assert.equal(area({ kind: 'triangle', base: 4, height: 3 }), 6);
});
test('ex02 · assertNever ném lỗi khi lọt dữ liệu lạ lúc chạy', () => {
  assert.throws(() => area(JSON.parse('{"kind":"hexagon"}')));
});
