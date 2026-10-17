import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { deepFreeze, type MyPartial, type MyReadonly, type Mutable, type Nullable, type DeepReadonly } from '../answers/ex02.js';

interface U {
  readonly id: number;
  name: string;
  tags: string[];
  address: { city: string; geo: { lat: number } };
  greet: () => string;
}
type _p = Expect<Equal<MyPartial<{ a: number; b: string }>, { a?: number; b?: string }>>;
type _r = Expect<Equal<MyReadonly<{ a: number }>, { readonly a: number }>>;
type _m = Expect<Equal<Mutable<{ readonly a: number; b: string }>, { a: number; b: string }>>;
type _n = Expect<Equal<Nullable<{ a: number }>, { a: number | null }>>;
type _d1 = Expect<Equal<DeepReadonly<U>['address']['geo'], { readonly lat: number }>>;
type _d2 = Expect<Equal<DeepReadonly<U>['tags'], readonly string[]>>;
type _d3 = Expect<Equal<DeepReadonly<U>['greet'], () => string>>;

function _typeTests(d: DeepReadonly<U>) {
  // @ts-expect-error tầng sâu cũng readonly
  d.address.geo.lat = 1;
  // @ts-expect-error mảng readonly
  d.tags.push('x');
}

test('ex02 · deepFreeze', () => {
  const cfg = deepFreeze({ db: { port: 5434 }, list: [1] });
  assert.ok(Object.isFrozen(cfg.db));
  assert.ok(Object.isFrozen(cfg.list));
  assert.equal(cfg.db.port, 5434);
});
