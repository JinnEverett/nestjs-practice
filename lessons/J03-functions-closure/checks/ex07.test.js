import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withLogging } from '../answers/ex07.js';

const fakeLogger = () => {
  const l = { infos: [], errors: [] };
  l.info = (x) => l.infos.push(x);
  l.error = (x) => l.errors.push(x);
  return l;
};

test('ex07 · trả đúng kết quả và log info', () => {
  const logger = fakeLogger();
  function add(a, b) {
    return a + b;
  }
  const wrapped = withLogging(add, logger);
  assert.equal(wrapped(2, 3), 5);
  assert.equal(logger.infos.length, 1);
  const [entry] = logger.infos;
  assert.equal(entry.fn, 'add');
  assert.deepEqual(entry.args, [2, 3]);
  assert.equal(typeof entry.ms, 'number');
  assert.ok(entry.ms >= 0);
  assert.equal(logger.errors.length, 0);
});
test('ex07 · lỗi: log error và ném lại đúng lỗi', () => {
  const logger = fakeLogger();
  const err = new Error('db down');
  function load() {
    throw err;
  }
  const wrapped = withLogging(load, logger);
  assert.throws(() => wrapped('x'), (e) => e === err);
  assert.equal(logger.errors.length, 1);
  assert.equal(logger.errors[0].fn, 'load');
  assert.deepEqual(logger.errors[0].args, ['x']);
  assert.equal(logger.errors[0].error, err);
  assert.equal(logger.infos.length, 0);
});
test('ex07 · giữ this khi bọc method', () => {
  const logger = fakeLogger();
  const svc = {
    prefix: 'ORD',
    format(id) {
      return `${this.prefix}-${id}`;
    },
  };
  svc.format = withLogging(svc.format, logger);
  assert.equal(svc.format(7), 'ORD-7');
});
