import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Shape, Rectangle, Circle } from '../answers/ex03.js';

test('ex03 · không new Shape trực tiếp', () => assert.throws(() => new Shape(), TypeError));
test('ex03 · area và kế thừa', () => {
  const r = new Rectangle(2, 3);
  assert.equal(r.area(), 6);
  assert.ok(r instanceof Shape);
  assert.ok(Math.abs(new Circle(1).area() - Math.PI) < 1e-9);
});
test('ex03 · describe dùng tên class thật', () => {
  assert.equal(new Circle(1).describe(), 'Circle có diện tích 3.14');
  assert.equal(new Rectangle(2, 3).describe(), 'Rectangle có diện tích 6.00');
});
test('ex03 · lớp con quên area → Not implemented', () => {
  class Blob extends Shape {}
  assert.throws(() => new Blob().area(), /Not implemented/);
});
test('ex03 · largest', () => {
  const shapes = [new Rectangle(1, 1), new Circle(2), new Rectangle(3, 3)];
  assert.equal(Shape.largest(shapes), shapes[1]);
  assert.equal(Shape.largest([]), null);
});
