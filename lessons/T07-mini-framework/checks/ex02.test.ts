import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Injectable } from '../answers/mini-nest/index.js';

@Injectable()
class Db {
  readonly id = Math.random();
}
@Injectable()
class UserRepository {
  constructor(readonly db: Db) {}
}
@Injectable()
class OrderRepository {
  constructor(readonly db: Db) {}
}
@Injectable()
class CheckoutService {
  constructor(
    readonly users: UserRepository,
    readonly orders: OrderRepository,
  ) {}
}
@Injectable()
class NeedsLogger {
  constructor(readonly logger: Db, readonly missing: CheckoutService) {}
}

test('ex02 · resolve đệ quy, dùng chung singleton', () => {
  const c = new Container().register(Db).register(UserRepository).register(OrderRepository).register(CheckoutService);
  const s = c.resolve(CheckoutService);
  assert.ok(s.users instanceof UserRepository);
  assert.ok(s.orders.db instanceof Db);
  assert.equal(s.users.db, s.orders.db);
  assert.equal(c.resolve(Db), s.users.db);
});
test('ex02 · thứ tự đăng ký không quan trọng', () => {
  const c = new Container().register(CheckoutService).register(OrderRepository).register(UserRepository).register(Db);
  assert.ok(c.resolve(CheckoutService) instanceof CheckoutService);
});
test('ex02 · thiếu dependency → lỗi nhắc tên', () => {
  const c = new Container().register(Db).register(NeedsLogger);
  assert.throws(() => c.resolve(NeedsLogger), /CheckoutService/);
});
