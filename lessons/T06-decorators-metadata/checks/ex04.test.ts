import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Injectable, Inject, getDependencies } from '../answers/ex04.js';

class Logger {}
class UserRepository {}
interface Mailer {
  send(): void;
}
const CONFIG = Symbol('CONFIG');

@Injectable()
class UserService {
  constructor(
    readonly logger: Logger,
    @Inject(CONFIG) readonly config: { port: number },
    @Inject('MAILER') readonly mailer: Mailer,
    readonly repo: UserRepository,
  ) {}
}

@Injectable()
class Broken {
  constructor(
    readonly logger: Logger,
    readonly mailer: Mailer,
  ) {}
}

@Injectable()
class NoDeps {}

test('ex04 · trộn kiểu class và token', () => {
  assert.deepEqual(getDependencies(UserService), [Logger, CONFIG, 'MAILER', UserRepository]);
});
test('ex04 · không có dependency', () => assert.deepEqual(getDependencies(NoDeps), []));
test('ex04 · interface không có @Inject → lỗi có tên class và vị trí', () => {
  assert.throws(() => getDependencies(Broken), (e: unknown) => e instanceof Error && e.message.includes('Broken') && e.message.includes('1'));
});
test('ex04 · @Inject trên method → TypeError', () => {
  assert.throws(() => {
    class X {
      run(@Inject('A') _a: unknown) {}
    }
    void X;
  }, TypeError);
});
