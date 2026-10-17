import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAutoMock } from '../answers/ex08.js';

test('ex08 · method bất kỳ, ghi lời gọi', () => {
  const repo = createAutoMock();
  assert.equal(repo.save({ id: 1 }), undefined);
  repo.save({ id: 2 }, { tx: true });
  assert.deepEqual(repo.calls('save'), [[{ id: 1 }], [{ id: 2 }, { tx: true }]]);
  assert.deepEqual(repo.calls('neverCalled'), []);
  assert.equal(repo.save, repo.save);
});
test('ex08 · mockReturn / mockImplementation', async () => {
  const repo = createAutoMock();
  repo.mockReturn('findById', { id: 7 });
  repo.mockImplementation('count', async (status) => (status === 'paid' ? 3 : 0));
  assert.deepEqual(repo.findById(7), { id: 7 });
  assert.equal(await repo.count('paid'), 3);
  assert.deepEqual(repo.calls('count'), [['paid']]);
});
test('ex08 · không phải thenable', async () => {
  const m = createAutoMock();
  assert.equal(m.then, undefined);
  assert.equal(await m, m);
  assert.equal(await Promise.resolve(m), m);
});
test('ex08 · key symbol → undefined', () => {
  const m = createAutoMock();
  assert.equal(m[Symbol.iterator], undefined);
  assert.equal(m[Symbol.toPrimitive], undefined);
});
test('ex08 · dùng trong service thật', async () => {
  class OrderService {
    constructor(repo, mailer) {
      this.repo = repo;
      this.mailer = mailer;
    }
    async place(order) {
      const saved = await this.repo.save(order);
      await this.mailer.send(saved.email, 'Đặt hàng thành công');
      return saved.id;
    }
  }
  const repo = createAutoMock();
  const mailer = createAutoMock();
  repo.mockReturn('save', { id: 9, email: 'a@x.vn' });
  assert.equal(await new OrderService(repo, mailer).place({}), 9);
  assert.deepEqual(mailer.calls('send'), [['a@x.vn', 'Đặt hàng thành công']]);
});
