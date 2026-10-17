import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import cjsDefault from '../answers/ex03.cjs';

const require = createRequire(import.meta.url);
const { parseCsvLine } = require('../answers/ex03.cjs');

test('ex03 · require được và import default được (interop)', () => {
  assert.equal(typeof parseCsvLine, 'function');
  assert.equal(cjsDefault.parseCsvLine, parseCsvLine);
});
test('ex03 · field thường', () => assert.deepEqual(parseCsvLine('a,b, c'), ['a', 'b', ' c']));
test('ex03 · ngoặc kép chứa dấu phẩy và "" ', () => {
  assert.deepEqual(parseCsvLine('1,"Áo, size L","nói ""hay""",'), ['1', 'Áo, size L', 'nói "hay"', '']);
});
test('ex03 · field rỗng', () => {
  assert.deepEqual(parseCsvLine(''), ['']);
  assert.deepEqual(parseCsvLine(',,'), ['', '', '']);
  assert.deepEqual(parseCsvLine('""'), ['']);
});
test('ex03 · separator tùy chọn', () => assert.deepEqual(parseCsvLine('a;"b;c";d', ';'), ['a', 'b;c', 'd']));
