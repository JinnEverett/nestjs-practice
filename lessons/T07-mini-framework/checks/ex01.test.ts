import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../answers/mini-nest/index.js';

class Clock {
  now() {
    return 42;
  }
}
class Unregistered {}

test('ex01 · resolve singleton', () => {
  const c = new Container();
  assert.equal(c.register(Clock), c);
  const a = c.resolve(Clock);
  assert.ok(a instanceof Clock);
  assert.equal(a.now(), 42);
  assert.equal(c.resolve(Clock), a);
});
test('ex01 · chưa đăng ký', () => {
  assert.throws(() => new Container().resolve(Unregistered), /No provider for Unregistered/);
});
test('ex01 · hai container độc lập', () => {
  const a = new Container().register(Clock);
  const b = new Container().register(Clock);
  assert.notEqual(a.resolve(Clock), b.resolve(Clock));
});
