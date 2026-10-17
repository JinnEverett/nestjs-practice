import { test } from 'node:test';
import assert from 'node:assert/strict';
import { satisfies } from '../answers/ex01.js';

const yes = (v, r) => test(`ex01 · ${v} ∈ ${JSON.stringify(r)}`, () => assert.equal(satisfies(v, r), true));
const no = (v, r) => test(`ex01 · ${v} ∉ ${JSON.stringify(r)}`, () => assert.equal(satisfies(v, r), false));

// exact
yes('1.2.3', '1.2.3'); yes('1.2.3', '=1.2.3'); no('1.2.4', '1.2.3');
// caret
yes('1.2.3', '^1.2.3'); yes('1.9.9', '^1.2.3'); no('2.0.0', '^1.2.3'); no('1.2.2', '^1.2.3');
yes('0.2.9', '^0.2.3'); no('0.3.0', '^0.2.3'); no('0.2.2', '^0.2.3');
yes('0.0.3', '^0.0.3'); no('0.0.4', '^0.0.3');
yes('1.5.0', '^1.2'); no('2.0.0', '^1.2'); yes('1.9.0', '^1'); no('0.9.0', '^1');
yes('0.0.9', '^0.0'); no('0.1.0', '^0.0');
yes('1.4.0', '^1.x');
// tilde
yes('1.2.9', '~1.2.3'); no('1.3.0', '~1.2.3'); no('1.2.2', '~1.2.3');
yes('1.2.0', '~1.2'); no('1.3.0', '~1.2'); yes('1.9.9', '~1'); no('2.0.0', '~1');
yes('0.2.9', '~0.2.3'); no('0.3.0', '~0.2.3');
// wildcard / partial
yes('3.4.5', '*'); yes('3.4.5', ''); yes('1.0.0', '1.x'); yes('1.9.9', '1'); no('2.0.0', '1.x');
yes('1.2.7', '1.2.x'); no('1.3.0', '1.2.x'); yes('1.2.9', '1.2');
// so sánh
yes('1.2.3', '>=1.2.3'); no('1.2.2', '>=1.2.3'); yes('1.2.4', '>1.2.3'); no('1.2.3', '>1.2.3');
yes('1.2.3', '<=1.2.3'); yes('1.2.2', '<1.2.3'); no('1.2.3', '<1.2.3');
yes('1.3.0', '>1.2'); no('1.2.9', '>1.2'); yes('1.2.9', '<=1.2'); no('1.3.0', '<=1.2');
// AND / OR
yes('1.3.0', '>=1.2.0 <1.5.0'); no('1.5.0', '>=1.2.0 <1.5.0'); no('1.1.9', '>=1.2.0 <1.5.0');
yes('1.9.0', '^1.0.0 || ^2.0.0'); yes('2.5.0', '^1.0.0 || ^2.0.0'); no('3.0.0', '^1.0.0 || ^2.0.0');
yes('1.0.5', '  >=1.0.0   <2.0.0 ');
// so sánh số, không so chuỗi
yes('1.10.0', '>=1.9.0'); no('1.10.0', '<1.9.0'); yes('10.0.0', '>=9.0.0');

test('ex01 · version không hợp lệ → false', () => {
  assert.equal(satisfies('1.2', '^1.0.0'), false);
  assert.equal(satisfies('abc', '*'), false);
  assert.equal(satisfies('1.2.3.4', '*'), false);
});
test('ex01 · range không hiểu được → TypeError', () => {
  assert.throws(() => satisfies('1.2.3', 'foo'), TypeError);
  assert.throws(() => satisfies('1.2.3', '^^1'), TypeError);
  assert.throws(() => satisfies('1.2.3', '>=a.b.c'), TypeError);
});
