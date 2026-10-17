import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { createGetters, type EventName, type Getters } from '../answers/ex06.js';

type _e = Expect<Equal<EventName<'order'>, 'order.created' | 'order.updated' | 'order.deleted'>>;
type _g = Expect<Equal<Getters<{ name: string; age: number }>, { getName: () => string; getAge: () => number }>>;

test('ex06 · createGetters', () => {
  const g = createGetters({ name: 'An', age: 30 });
  assert.equal(g.getName(), 'An');
  assert.equal(g.getAge(), 30);
  assert.deepEqual(Object.keys(g).sort(), ['getAge', 'getName']);
});
