import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Injectable } from '../answers/mini-nest/index.js';

let counter = 0;
@Injectable({ scope: 'transient' })
class RequestId {
  readonly value = ++counter;
}
@Injectable()
class ServiceA {
  constructor(readonly id: RequestId) {}
}
@Injectable()
class ServiceB {
  constructor(readonly id: RequestId) {}
}

test('ex05 · transient tạo mới mỗi lần', () => {
  const c = new Container().register(RequestId).register(ServiceA).register(ServiceB);
  assert.notEqual(c.resolve(RequestId), c.resolve(RequestId));
  const a = c.resolve(ServiceA);
  const b = c.resolve(ServiceB);
  assert.notEqual(a.id, b.id);
  assert.equal(c.resolve(ServiceA), a, 'consumer singleton vẫn là singleton');
});
