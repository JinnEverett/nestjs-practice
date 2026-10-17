import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runAll } from '../answers/ex07.js';

test('ex07 · tất cả thành công', () => assert.deepEqual(runAll([() => 1, () => 'a']), [1, 'a']));
test('ex07 · rỗng', () => assert.deepEqual(runAll([]), []));
test('ex07 · có lỗi: chạy hết, gộp lỗi', () => {
  const ran = [];
  const e1 = new Error('one');
  try {
    runAll([
      () => (ran.push(0), 0),
      () => {
        ran.push(1);
        throw e1;
      },
      () => (ran.push(2), 2),
      () => {
        ran.push(3);
        throw 'three';
      },
    ]);
    assert.fail('phải ném');
  } catch (e) {
    assert.ok(e instanceof AggregateError);
    assert.equal(e.message, '2/4 tasks failed');
    assert.equal(e.errors.length, 2);
    assert.equal(e.errors[0], e1);
    assert.ok(e.errors[1] instanceof Error);
    assert.deepEqual(e.results, [0, undefined, 2, undefined]);
  }
  assert.deepEqual(ran, [0, 1, 2, 3]);
});
