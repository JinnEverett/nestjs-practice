import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeMiddleware } from '../answers/ex09.js';

test('ex09 · thứ tự "củ hành": vào a → b → c, ra c → b → a', () => {
  const mw = (name) => (ctx, next) => {
    ctx.log.push(`${name}>`);
    const r = next();
    ctx.log.push(`<${name}`);
    return r;
  };
  const run = composeMiddleware([mw('a'), mw('b'), (ctx) => (ctx.log.push('handler'), 'result')]);
  const ctx = { log: [] };
  assert.equal(run(ctx), 'result');
  assert.deepEqual(ctx.log, ['a>', 'b>', 'handler', '<b', '<a']);
});
test('ex09 · middleware cuối gọi next() nhận undefined', () => {
  const run = composeMiddleware([(ctx, next) => next()]);
  assert.equal(run({}), undefined);
});
test('ex09 · danh sách rỗng', () => assert.equal(composeMiddleware([])({}), undefined));
test('ex09 · chặn lại khi không gọi next', () => {
  let reached = false;
  const auth = (ctx, next) => (ctx.user ? next() : { status: 401 });
  const run = composeMiddleware([auth, () => ((reached = true), { status: 200 })]);
  assert.deepEqual(run({}), { status: 401 });
  assert.equal(reached, false);
  assert.deepEqual(run({ user: 'an' }), { status: 200 });
});
test('ex09 · middleware có thể sửa kết quả trả về (như interceptor)', () => {
  const wrap = (ctx, next) => ({ data: next() });
  const run = composeMiddleware([wrap, () => 42]);
  assert.deepEqual(run({}), { data: 42 });
});
test('ex09 · lỗi lan ra ngoài, middleware ngoài bắt được', () => {
  const catcher = (ctx, next) => {
    try {
      return next();
    } catch (e) {
      return `caught ${e.message}`;
    }
  };
  const run = composeMiddleware([catcher, () => {
    throw new Error('boom');
  }]);
  assert.equal(run({}), 'caught boom');
});
test('ex09 · gọi next() hai lần → lỗi', () => {
  const run = composeMiddleware([(ctx, next) => {
    next();
    return next();
  }, () => 1]);
  assert.throws(() => run({}), /next\(\) called multiple times/);
});
test('ex09 · chạy run nhiều lần độc lập', () => {
  let n = 0;
  const run = composeMiddleware([(ctx, next) => next(), () => ++n]);
  run({});
  assert.equal(run({}), 2);
});
