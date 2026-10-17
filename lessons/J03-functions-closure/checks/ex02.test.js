import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from '../answers/ex02.js';

test('ex02 · chỉ gọi fn một lần, trả lại kết quả đầu', () => {
  let calls = 0;
  const init = once((x) => {
    calls++;
    return x * 2;
  });
  assert.equal(init(21), 42);
  assert.equal(init(100), 42);
  assert.equal(calls, 1);
});
test('ex02 · kết quả undefined cũng được nhớ', () => {
  let calls = 0;
  const f = once(() => {
    calls++;
  });
  f();
  f();
  assert.equal(calls, 1);
});
test('ex02 · lỗi được ném ra và lần sau thử lại', () => {
  let calls = 0;
  const f = once(() => {
    calls++;
    if (calls === 1) throw new Error('boom');
    return 'ok';
  });
  assert.throws(() => f(), /boom/);
  assert.equal(f(), 'ok');
  assert.equal(f(), 'ok');
  assert.equal(calls, 2);
});
test('ex02 · giữ this', () => {
  const obj = {
    n: 7,
    get: once(function () {
      return this.n;
    }),
  };
  assert.equal(obj.get(), 7);
});
test('ex02 · hai hàm once độc lập', () => {
  const a = once(() => 'a');
  const b = once(() => 'b');
  assert.equal(a(), 'a');
  assert.equal(b(), 'b');
});
