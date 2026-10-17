import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { myBind } from '../answers/ex04.js';

function greet(g, mark) {
  return `${g}, ${this.name}${mark}`;
}
test('ex04 · gắn this', () => assert.equal(myBind(greet, { name: 'An' })('Chào', '!'), 'Chào, An!'));
test('ex04 · tham số đặt sẵn + tham số lúc gọi', () => {
  assert.equal(myBind(greet, { name: 'An' }, 'Chào')('!'), 'Chào, An!');
  assert.equal(myBind(greet, { name: 'An' }, 'Hi', '?')(), 'Hi, An?');
});
test('ex04 · gọi .call trên hàm đã bind không đổi được this', () => {
  const b = myBind(greet, { name: 'An' }, 'Chào');
  assert.equal(b.call({ name: 'X' }, '.'), 'Chào, An.');
});
test('ex04 · trả về kết quả của fn', () => {
  const sum = myBind(function (...xs) {
    return xs.reduce((a, b) => a + b, this.start);
  }, { start: 100 }, 1);
  assert.equal(sum(2, 3), 106);
});
test('ex04 · không dùng Function.prototype.bind', () => {
  const src = readFileSync(new URL('../answers/ex04.js', import.meta.url), 'utf8');
  assert.equal(/\.bind\s*\(/.test(src.replace(/\/\/.*$/gm, '')), false, 'không được gọi .bind(');
});
