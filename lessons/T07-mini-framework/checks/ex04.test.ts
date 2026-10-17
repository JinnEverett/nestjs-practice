import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Injectable, Inject } from '../answers/mini-nest/index.js';

const B_TOKEN = Symbol('B');

@Injectable()
class A {
  constructor(@Inject(B_TOKEN) readonly b: unknown) {}
}

test('ex04 · vòng 2 phần tử', () => {
  const c = new Container()
    .register({ provide: 'A', useFactory: (b: unknown) => ({ b }), inject: ['B'] })
    .register({ provide: 'B', useFactory: (a: unknown) => ({ a }), inject: ['A'] });
  assert.throws(() => c.resolve('A'), (e: unknown) => e instanceof Error && e.message.includes('A -> B -> A'));
});
test('ex04 · vòng qua class và symbol', () => {
  const c = new Container().register(A).register({ provide: B_TOKEN, useFactory: (a: unknown) => a, inject: [A] });
  assert.throws(() => c.resolve(A), (e: unknown) => e instanceof Error && e.message.includes('A -> B -> A'));
});
test('ex04 · dùng chung (kim cương) KHÔNG phải vòng', () => {
  const c = new Container()
    .register({ provide: 'shared', useValue: 1 })
    .register({ provide: 'left', useFactory: (s: number) => s + 1, inject: ['shared'] })
    .register({ provide: 'right', useFactory: (s: number) => s + 2, inject: ['shared'] })
    .register({ provide: 'top', useFactory: (l: number, r: number) => l + r, inject: ['left', 'right'] });
  assert.equal(c.resolve('top'), 5);
});
