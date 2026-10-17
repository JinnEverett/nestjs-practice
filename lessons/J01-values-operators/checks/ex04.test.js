import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspect } from 'node:util';

const cases = [
  ['[] + []', () => [] + []],
  ['[] == false', () => [] == false],
  ['null == 0', () => null == 0],
  ['null >= 0', () => null >= 0],
  ["'5' * '2'", () => '5' * '2'],
  ["'5' + 2", () => '5' + 2],
  ['NaN === NaN', () => NaN === NaN],
  ['0.1 + 0.2 === 0.3', () => 0.1 + 0.2 === 0.3],
  ['typeof NaN', () => typeof NaN],
  ["!!'false'", () => !!'false'],
];
const lines = readFileSync(new URL('../answers/ex04.txt', import.meta.url), 'utf8')
  .split(/\r?\n/)
  .map((l) => l.trim().replace(/^\d+\.\s*/, ''))
  .filter((l) => l !== '');
const norm = (s) => s.replace(/"/g, "'");

test('ex04 · đủ 10 dòng', () => assert.equal(lines.length, 10));
cases.forEach(([src, f], i) => {
  test(`ex04 · dòng ${i + 1}: ${src}`, () => assert.equal(norm(lines[i] ?? '(trống)'), inspect(f())));
});
